import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNeonAuth } from "@/integrations/neon/auth-middleware";

const symbolSchema = z.string().trim().toUpperCase().min(1).max(16);
const sessionSchema = z.enum(["open", "closed", "halted", "gap"]);

export const listWatchlist = createServerFn({ method: "GET" })
  .middleware([requireNeonAuth])
  .handler(async ({ context }) => {
    const rows = await context.sql`
      SELECT id, symbol, rule, active, created_at
      FROM public.watchlist_items
      WHERE user_id = ${context.userId}
      ORDER BY created_at DESC
    `;
    return rows;
  });

export const createWatchlistItem = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        symbol: symbolSchema,
        rule: z.string().trim().min(3).max(180).default("Notify when session opens"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const rows = await context.sql`
      INSERT INTO public.watchlist_items (user_id, symbol, rule)
      VALUES (${context.userId}, ${data.symbol}, ${data.rule})
      RETURNING id, symbol, rule, active, created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("watchlist insert failed");
    return row;
  });

export const updateWatchlistItem = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.sql`
      UPDATE public.watchlist_items
      SET active = ${data.active}, updated_at = now()
      WHERE id = ${data.id} AND user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const deleteWatchlistItem = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.sql`
      DELETE FROM public.watchlist_items
      WHERE id = ${data.id} AND user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const saveSimulation = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        symbol: symbolSchema,
        sessionState: sessionSchema,
        amount: z.string().max(40),
        outcome: z.string().max(100),
        details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const rows = await context.sql`
      INSERT INTO public.simulation_results (
        user_id, symbol, session_state, amount, outcome, details
      )
      VALUES (
        ${context.userId},
        ${data.symbol},
        ${data.sessionState},
        ${data.amount},
        ${data.outcome},
        ${JSON.stringify(data.details)}::jsonb
      )
      RETURNING id
    `;
    const row = rows[0];
    if (!row) throw new Error("simulation insert failed");
    await context.sql`
      INSERT INTO public.activity_history (
        user_id, event_type, symbol, amount, state, detail
      )
      VALUES (
        ${context.userId},
        ${"simulation"},
        ${data.symbol},
        ${data.amount},
        ${"Simulated"},
        ${"Dry run complete · no broadcast"}
      )
    `;
    return row;
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireNeonAuth])
  .handler(async ({ context }) => {
    return context.sql`
      SELECT id, symbol, amount, state, detail, created_at
      FROM public.activity_history
      WHERE user_id = ${context.userId}
      ORDER BY created_at DESC
    `;
  });

export const listDxReports = createServerFn({ method: "GET" })
  .middleware([requireNeonAuth])
  .handler(async ({ context }) => {
    return context.sql`
      SELECT id, title, content, status, updated_at
      FROM public.dx_reports
      WHERE user_id = ${context.userId}
      ORDER BY updated_at DESC
    `;
  });

export const saveDxReport = createServerFn({ method: "POST" })
  .middleware([requireNeonAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable(),
        title: z.string().trim().min(3).max(120),
        content: z.string().trim().min(10).max(8000),
        status: z.enum(["draft", "final"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const rows = await context.sql`
        UPDATE public.dx_reports
        SET title = ${data.title},
            content = ${data.content},
            status = ${data.status},
            updated_at = now()
        WHERE id = ${data.id} AND user_id = ${context.userId}
        RETURNING id, title, content, status, updated_at
      `;
      const row = rows[0];
      if (!row) throw new Error("dx report update failed");
      return row;
    }
    const rows = await context.sql`
      INSERT INTO public.dx_reports (user_id, title, content, status)
      VALUES (${context.userId}, ${data.title}, ${data.content}, ${data.status})
      RETURNING id, title, content, status, updated_at
    `;
    const row = rows[0];
    if (!row) throw new Error("dx report insert failed");
    return row;
  });
