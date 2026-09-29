/**
 * Approximate US equities regular session (America/New_York).
 * Holidays are residual risk — labeled, not silently ignored.
 */
import { errResult, okResult, type AdapterResult } from "./types";

export type CashSession = {
  open: boolean;
  nyWeekday: string;
  nyClock: string;
  label: string;
};

function nyParts(now = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(now);
  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return { weekday, clock };
}

/** Regular session ≈ 09:30–16:00 ET · Mon–Fri. */
export function evaluateCashSession(now = new Date()): AdapterResult<CashSession> {
  const { weekday, clock } = nyParts(now);
  const [hhRaw, mmRaw] = clock.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  const mins = hh * 60 + mm;
  const weekdayOpen = !["Sat", "Sun"].includes(weekday);
  const inBell = mins >= 9 * 60 + 30 && mins < 16 * 60;
  const open = weekdayOpen && inBell;
  const label = open
    ? "Cash session open"
    : weekdayOpen
      ? "Cash session closed — overnight / after hours"
      : "Weekend — cash session closed";

  return okResult("mainnet-read", "bell.cash-session", {
    open,
    nyWeekday: weekday,
    nyClock: clock,
    label,
  });
}

export function cashSessionHolidayResidual(): AdapterResult<never> {
  return errResult(
    "bell.cash-session",
    "holiday_calendar_unwired",
    "NYSE holidays not modeled — treat as residual risk",
  );
}
