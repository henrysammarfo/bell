import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const symbolSchema = z.string().trim().toUpperCase().min(1).max(16);
const sessionSchema = z.enum(["open", "closed", "halted", "gap"]);

export const listWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("watchlist_items").select("id, symbol, rule, active, created_at").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createWatchlistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ symbol: symbolSchema, rule: z.string().trim().min(3).max(180).default("Notify when session opens") }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("watchlist_items").insert({ ...data, user_id: context.userId }).select("id, symbol, rule, active, created_at").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateWatchlistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("watchlist_items").update({ active: data.active }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWatchlistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("watchlist_items").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSimulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ symbol: symbolSchema, sessionState: sessionSchema, amount: z.string().max(40), outcome: z.string().max(100), details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("simulation_results").insert({ user_id: context.userId, symbol: data.symbol, session_state: data.sessionState, amount: data.amount, outcome: data.outcome, details: data.details }).select("id").single();
    if (error) throw new Error(error.message);
    const { error: activityError } = await context.supabase.from("activity_history").insert({ user_id: context.userId, event_type: "simulation", symbol: data.symbol, amount: data.amount, state: "Simulated", detail: "Dry run complete · no broadcast" });
    if (activityError) throw new Error(activityError.message);
    return row;
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("activity_history").select("id, symbol, amount, state, detail, created_at").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const listDxReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("dx_reports").select("id, title, content, status, updated_at").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const saveDxReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid().nullable(), title: z.string().trim().min(3).max(120), content: z.string().trim().min(10).max(8000), status: z.enum(["draft", "final"]) }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { data: row, error } = await context.supabase.from("dx_reports").update({ title: data.title, content: data.content, status: data.status }).eq("id", data.id).eq("user_id", context.userId).select("id, title, content, status, updated_at").single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase.from("dx_reports").insert({ user_id: context.userId, title: data.title, content: data.content, status: data.status }).select("id, title, content, status, updated_at").single();
    if (error) throw new Error(error.message);
    return row;
  });
