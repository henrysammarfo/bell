/** Shared fail-closed adapter result shapes (Folio-compatible). */

export type AdapterMode = "mainnet-read" | "quote-only" | "simulate" | "broadcast" | "unavailable";

export type AdapterOk<T> = {
  ok: true;
  mode: AdapterMode;
  source: string;
  data: T;
  fetchedAt: string;
};

export type AdapterErr = {
  ok: false;
  mode: "unavailable";
  source: string;
  reason: string;
  detail: string;
  fetchedAt: string;
};

export type AdapterResult<T> = AdapterOk<T> | AdapterErr;

export function okResult<T>(
  mode: Exclude<AdapterMode, "unavailable">,
  source: string,
  data: T,
): AdapterOk<T> {
  return { ok: true, mode, source, data, fetchedAt: new Date().toISOString() };
}

export function errResult(source: string, reason: string, detail: string): AdapterErr {
  return {
    ok: false,
    mode: "unavailable",
    source,
    reason,
    detail,
    fetchedAt: new Date().toISOString(),
  };
}
