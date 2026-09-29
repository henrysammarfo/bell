import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNeonAuth } from "@/integrations/neon/auth-middleware";
import { evaluateSessionGate } from "@/lib/adapters/session-gate";
import { quoteAndSimulate } from "@/lib/adapters/binance-trading";

const SimInput = z.object({
  ticker: z.string().trim().min(1).max(16),
  amountUsdt: z.string().trim().min(1).max(32),
  gapMode: z.boolean().default(false),
  gapAcknowledged: z.boolean().default(false),
});

const BroadcastInput = z.object({
  ticker: z.string().trim().min(1).max(16),
  amountUsdt: z.string().trim().min(1).max(32),
  gapMode: z.boolean().default(false),
  gapAcknowledged: z.boolean().default(false),
  /** Explicit — never auto-broadcast. */
  confirmBroadcast: z.literal(true),
});

export const simulateTrade = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) => SimInput.parse(input))
  .handler(async ({ data }) => {
    const gate = await evaluateSessionGate({
      ticker: data.ticker,
      gapMode: data.gapMode,
      gapAcknowledged: data.gapAcknowledged,
    });
    if (!gate.ok) {
      return {
        ok: false as const,
        mode: "unavailable" as const,
        reason: gate.reason,
        detail: gate.detail,
      };
    }
    if (gate.data.decision === "DENY") {
      return {
        ok: false as const,
        mode: "unavailable" as const,
        reason: "gate_deny",
        detail: gate.data.reasons.join(" "),
      };
    }
    const sim = await quoteAndSimulate({
      ticker: data.ticker,
      amountUsdt: data.amountUsdt,
      contractAddress: gate.data.contractAddress,
      symbol: gate.data.symbol,
      referencePrice: gate.data.dynamic?.referencePrice ?? null,
      tokenPrice: gate.data.dynamic?.tokenPrice ?? null,
    });
    return sim;
  });

/**
 * Broadcast path — fail-closed until Binance Web3 signing + wallet are configured.
 * Never invents a tx hash.
 */
export const broadcastTrade = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) => BroadcastInput.parse(input))
  .handler(async ({ data }) => {
    const gate = await evaluateSessionGate({
      ticker: data.ticker,
      gapMode: data.gapMode,
      gapAcknowledged: data.gapAcknowledged,
    });
    if (!gate.ok || gate.data.decision === "DENY") {
      return {
        ok: false as const,
        mode: "unavailable" as const,
        reason: "gate_deny",
        detail: !gate.ok ? gate.detail : gate.data.reasons.join(" "),
      };
    }
    const { broadcastSwap } = await import("@/lib/adapters/binance-trading");
    return broadcastSwap({
      ticker: data.ticker,
      amountUsdt: data.amountUsdt,
      contractAddress: gate.data.contractAddress,
      symbol: gate.data.symbol,
    });
  });
