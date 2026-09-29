/**
 * Agent Studio–style session watcher — re-checks RWA gate for watchlist symbols.
 * Fail closed if list/gate unavailable. No fake notifications.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNeonAuth } from "@/integrations/neon/auth-middleware";
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
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data, context }) => {
    const items = await context.sql`
      SELECT id, symbol, rule, active
      FROM public.watchlist_items
      WHERE user_id = ${context.userId} AND active = true
      LIMIT 20
    `;

    if (!items.length) {
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
        ticker: String(item.symbol),
        gapMode: data.gapMode,
        gapAcknowledged: data.gapMode,
      });
      if (!gate.ok) {
        hits.push({
          symbol: String(item.symbol),
          decision: "DENY",
          sessionLabel: "halted",
          gapLabel: "n/a",
          reasons: [`Fail closed: ${gate.reason}`, gate.detail],
          mode: "unavailable",
        });
        continue;
      }
      hits.push({
        symbol: String(item.symbol),
        decision: gate.data.decision,
        sessionLabel: gate.data.sessionLabel,
        gapLabel: gate.data.gapLabel,
        reasons: gate.data.reasons,
        mode: gate.data.mode,
      });
      await context.sql`
        INSERT INTO public.activity_history (
          user_id, event_type, symbol, state, detail
        )
        VALUES (
          ${context.userId},
          ${"watcher_check"},
          ${String(item.symbol)},
          ${gate.data.decision},
          ${`Watcher · ${gate.data.sessionLabel} · gap ${gate.data.gapLabel}`}
        )
      `;
    }

    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      hits,
      detail: `Checked ${hits.length} watchers against live RWA status`,
    };
  });
