import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNeonAuth } from "@/integrations/neon/auth-middleware";
import { agentRouterConfigured, liveChat } from "@/lib/llm/agent-router";

const Input = z.object({
  symbol: z.string().trim().toUpperCase().min(1).max(16),
  sessionState: z.enum(["open", "closed", "halted"]),
  thesis: z.string().trim().min(10).max(2000),
});

const SYSTEM =
  "You write concise, risk-aware trade briefs for BELL, a closed-session honesty product for BSC tokenized stocks. Never provide personalized financial advice, invent prices, imply execution, or call a reference price an official exchange price. Treat the supplied session state as authoritative. Use exactly four short sections with these headings: SETUP, SESSION RISK, INVALIDATION, BEFORE ACTING. Keep the entire response under 180 words. If closed, stress stale-reference and reopening-gap risk. If halted, stress that no action should proceed until status clears. End with: Not investment advice.";

export const generateTradeBrief = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    if (!agentRouterConfigured() && !process.env["LOVABLE_API_KEY"]) {
      return {
        ok: false as const,
        error:
          "AI is not configured — set AGENTROUTER_API_KEY (Tor/relay), Vercel AI Gateway, or LOVABLE_API_KEY. No mock brief.",
      };
    }

    let briefText: string | null = null;
    let path = "none";

    if (agentRouterConfigured()) {
      const chat = await liveChat({
        system: SYSTEM,
        user: `Market symbol: ${data.symbol}\nUnderlying session: ${data.sessionState}\nTrader thesis: ${data.thesis}\nProduce the brief now.`,
        maxTokens: 500,
      });
      if (!chat.ok) {
        if (!process.env["LOVABLE_API_KEY"]) {
          return {
            ok: false as const,
            error: `LLM unavailable (${chat.path}): ${chat.error}`,
          };
        }
      } else {
        briefText = chat.text;
        path = chat.path;
      }
    }

    if (!briefText && process.env["LOVABLE_API_KEY"]) {
      try {
        const { createOpenAI } = await import("@ai-sdk/openai");
        const { streamText } = await import("ai");
        const { createLovableAiGatewayRunIdFetch } = await import("./ai-gateway.server");
        const key = process.env["LOVABLE_API_KEY"]!;
        const runIdFetch = createLovableAiGatewayRunIdFetch();
        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: {
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });
        const result = streamText({
          model: lovable.responses("openai/gpt-6-astra"),
          system: SYSTEM,
          prompt: `Market symbol: ${data.symbol}\nUnderlying session: ${data.sessionState}\nTrader thesis: ${data.thesis}\nProduce the brief now.`,
        });
        briefText = (await result.text).trim();
        path = "lovable-gateway";
      } catch (error) {
        console.error("Lovable brief failed", error);
        return {
          ok: false as const,
          error: "The trade brief could not be generated. Your thesis was not saved.",
        };
      }
    }

    if (!briefText) {
      return {
        ok: false as const,
        error: "AI returned no brief. Please try a more specific thesis.",
      };
    }

    const savedRows = await context.sql`
      INSERT INTO public.trade_briefs (
        user_id, symbol, session_state, thesis, brief
      )
      VALUES (
        ${context.userId},
        ${data.symbol},
        ${data.sessionState},
        ${data.thesis},
        ${briefText}
      )
      RETURNING id, symbol, session_state, thesis, brief, created_at
    `;
    const saved = savedRows[0];
    if (!saved) throw new Error("trade brief insert failed");

    await context.sql`
      INSERT INTO public.activity_history (
        user_id, event_type, symbol, state, detail
      )
      VALUES (
        ${context.userId},
        ${"trade_brief"},
        ${data.symbol},
        ${"Briefed"},
        ${`${data.sessionState} session · AI risk brief saved · ${path}`}
      )
    `;
    return { ok: true as const, brief: saved, path };
  });

export const listTradeBriefs = createServerFn({ method: "GET" })
  .middleware([requireNeonAuth])
  .handler(async ({ context }) => {
    return context.sql`
      SELECT id, symbol, session_state, thesis, brief, created_at
      FROM public.trade_briefs
      WHERE user_id = ${context.userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;
  });
