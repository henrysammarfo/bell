import { createOpenAI } from "@ai-sdk/openai";
import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  symbol: z.string().trim().toUpperCase().min(1).max(16),
  sessionState: z.enum(["open", "closed", "halted"]),
  thesis: z.string().trim().min(10).max(2000),
});

function safeGatewayMessage(error: unknown) {
  const fallback = "The trade brief could not be generated. Your thesis was not saved.";
  if (!(error instanceof Error)) return fallback;
  const message = error.message;
  if (message.includes("402")) return "AI credits are unavailable. Add workspace credits, then try again.";
  if (message.includes("429")) return "AI is temporarily busy. Wait a moment, then try again.";
  if (message.includes("401")) return "AI is not configured for this workspace.";
  if (message.includes("403")) return "AI access is currently unavailable for this workspace.";
  return fallback;
}

export const generateTradeBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { ok: false as const, error: "AI is not configured for this workspace." };
    try {
      const { createLovableAiGatewayRunIdFetch } = await import("./ai-gateway.server");
      const runIdFetch = createLovableAiGatewayRunIdFetch();
      const lovable = createOpenAI({
        baseURL: "https://ai.gateway.lovable.dev/v1",
        apiKey: key,
        headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        fetch: runIdFetch.fetch,
      });
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        system: "You write concise, risk-aware trade briefs for BELL, a closed-session honesty product for BSC tokenized stocks. Never provide personalized financial advice, invent prices, imply execution, or call a reference price an official exchange price. Treat the supplied session state as authoritative. Use exactly four short sections with these headings: SETUP, SESSION RISK, INVALIDATION, BEFORE ACTING. Keep the entire response under 180 words. If closed, stress stale-reference and reopening-gap risk. If halted, stress that no action should proceed until status clears. End with: Not investment advice.",
        prompt: `Market symbol: ${data.symbol}\nUnderlying session: ${data.sessionState}\nTrader thesis: ${data.thesis}\nProduce the brief now.`,
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
      });
      const brief = (await result.text).trim();
      if (!brief) return { ok: false as const, error: "AI returned no brief. Please try a more specific thesis." };
      const { data: saved, error } = await context.supabase.from("trade_briefs").insert({ user_id: context.userId, symbol: data.symbol, session_state: data.sessionState, thesis: data.thesis, brief }).select("id, symbol, session_state, thesis, brief, created_at").single();
      if (error) throw new Error(error.message);
      await context.supabase.from("activity_history").insert({ user_id: context.userId, event_type: "trade_brief", symbol: data.symbol, state: "Briefed", detail: `${data.sessionState} session · AI risk brief saved` });
      return { ok: true as const, brief: saved };
    } catch (error) {
      console.error("Trade brief generation failed", error);
      return { ok: false as const, error: safeGatewayMessage(error) };
    }
  });

export const listTradeBriefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("trade_briefs").select("id, symbol, session_state, thesis, brief, created_at").order("created_at", { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    return data;
  });
