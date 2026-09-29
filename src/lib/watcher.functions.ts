/**
 * Agent Studio–style session watcher — re-checks RWA gate for watchlist symbols.
 * Fail closed if list/gate unavailable. No fake notifications.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { evaluateSessionGate } from "@/lib/adapters/session-gate";

const RunInput = z.object({
  gapMode: z.boolean().default(false),
});

export type WatcherHit = {
  symbol: string;
  decision: "ALLOW" | "DENY";
  sessionLabel: string;
  gapLabel: string;
  reasons: string[];
  mode: string;
};

export const runSessionWatcher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: items, error } = await context.supabase
      .from("watchlist_items")
      .select("id, symbol, rule, active")
      .eq("user_id", context.userId)
      .eq("active", true)
      .limit(20);
    if (error) {
      return {
        ok: false as const,
        mode: "unavailable" as const,
        reason: "watchlist_fetch_failed",
        detail: error.message,
        hits: [] as WatcherHit[],
      };
    }
    if (!items?.length) {
      return {
        ok: true as const,
        mode: "mainnet-read" as const,
        hits: [] as WatcherHit[],
        detail: "No active watchers — add symbols on /watchers",
      };
    }

    const hits: WatcherHit[] = [];
    for (const item of items) {
      const gate = await evaluateSessionGate({
        ticker: item.symbol,
        gapMode: data.gapMode,
        gapAcknowledged: data.gapMode,
      });
      if (!gate.ok) {
        hits.push({
          symbol: item.symbol,
          decision: "DENY",
          sessionLabel: "halted",
          gapLabel: "n/a",
          reasons: [`Fail closed: ${gate.reason}`, gate.detail],
          mode: "unavailable",
        });
        continue;
      }
      hits.push({
        symbol: item.symbol,
        decision: gate.data.decision,
        sessionLabel: gate.data.sessionLabel,
        gapLabel: gate.data.gapLabel,
        reasons: gate.data.reasons,
        mode: gate.data.mode,
      });
      await context.supabase.from("activity_history").insert({
        user_id: context.userId,
        event_type: "watcher_check",
        symbol: item.symbol,
        state: gate.data.decision,
        detail: `Watcher · ${gate.data.sessionLabel} · gap ${gate.data.gapLabel}`,
      });
    }

    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      hits,
      detail: `Checked ${hits.length} watchers against live RWA status`,
    };
  });
