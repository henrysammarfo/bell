import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { agentRouterConfigured, liveChat } from "@/lib/llm/agent-router";

const Input = z.object({
  symbol: z.string().trim().toUpperCase().min(1).max(16),
  sessionState: z.enum(["open", "closed", "halted"]),
  thesis: z.string().trim().min(10).max(2000),
});

const SYSTEM =
  "You write concise, risk-aware trade briefs for BELL, a closed-session honesty product for BSC tokenized stocks. Never provide personalized financial advice, invent prices, imply execution, or call a reference price an official exchange price. Treat the supplied session state as authoritative. Use exactly four short sections with these headings: SETUP, SESSION RISK, INVALIDATION, BEFORE ACTING. Keep the entire response under 180 words. If closed, stress stale-reference and reopening-gap risk. If halted, stress that no action should proceed until status clears. End with: Not investment advice.";

export const generateTradeBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    if (!agentRouterConfigured() && !process.env["LOVABLE_API_KEY"]) {
      return {
        ok: false as const,
        error:
          "AI is not configured — set AGENTROUTER_API_KEY (Tor/relay) or LOVABLE_API_KEY. No mock brief.",
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
        // Do not silently fall back to Lovable if AgentRouter was configured but failed
        if (!process.env["LOVABLE_API_KEY"]) {
          return {
            ok: false as const,
            error: `AgentRouter unavailable (${chat.path}): ${chat.error}`,
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

    const { data: saved, error } = await context.supabase
      .from("trade_briefs")
      .insert({
        user_id: context.userId,
        symbol: data.symbol,
        session_state: data.sessionState,
        thesis: data.thesis,
        brief: briefText,
      })
      .select("id, symbol, session_state, thesis, brief, created_at")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("activity_history").insert({
      user_id: context.userId,
      event_type: "trade_brief",
      symbol: data.symbol,
      state: "Briefed",
      detail: `${data.sessionState} session · AI risk brief saved · ${path}`,
    });
    return { ok: true as const, brief: saved, path };
  });

export const listTradeBriefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trade_briefs")
      .select("id, symbol, session_state, thesis, brief, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data;
  });
