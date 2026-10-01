/**
 * TypeSafe Jev (System One) — gift wrap second opinion.
 * Hard session gate still owns ALLOW/DENY.
 *
 * Free-first provider order:
 *  1) TypeSafe console key (`TYPESAFE_API_KEY`) — new accounts get ~$5 credit
 *  2) Vercel AI Gateway `experimental_evaluate` (`typesafe-ai/jev`) — OIDC on Vercel
 *  3) OpenRouter Decisions API — needs prepaid credits (not free)
 */
import { errResult, okResult, type AdapterResult } from "./types";

const TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone";
const OPENROUTER_URL = "https://openrouter.ai/api/alpha/decisions";
const GATEWAY_MODEL = "typesafe-ai/jev";
const TYPESAFE_MODEL = "jev-latest";
const OPENROUTER_MODEL = "typesafe/jev-1.13";

export type JevGiftJudgment = {
  wrapHonest: number | null;
  timing: "send_now" | "wait_for_open" | "gap_ack_only" | null;
  timingConfidence: number | null;
  freshnessRisk: number | null;
  freshnessLabel: string | null;
  model: string;
  costUsd: number | null;
  mode: "live" | "unavailable";
  detail: string;
  provider: "typesafe" | "vercel-ai-gateway" | "openrouter" | "none";
};

export type JevGiftState = {
  ticker: string;
  symbol: string | null;
  sessionLabel: string;
  gapLabel: string;
  gateDecision: "ALLOW" | "DENY" | "PENDING";
  gapMode: boolean;
  gapAcknowledged: boolean;
  reasons: string[];
  amountUsdt?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function getTypeSafeApiKey(): string | null {
  return (
    process.env["TYPESAFE_API_KEY"]?.trim() ||
    process.env["BELL_TYPESAFE_API_KEY"]?.trim() ||
    null
  );
}

export function getOpenRouterApiKey(): string | null {
  return (
    process.env["OPENROUTER_API_KEY"]?.trim() ||
    process.env["BELL_JEV_API_KEY"]?.trim() ||
    null
  );
}

/** @deprecated use getOpenRouterApiKey / getTypeSafeApiKey */
export function getJevApiKey(): string | null {
  return getTypeSafeApiKey() || getOpenRouterApiKey();
}

export function getJevModel(): string {
  return process.env["BELL_JEV_MODEL"]?.trim() || OPENROUTER_MODEL;
}

function giftStatePayload(state: JevGiftState) {
  return {
    product: "BELL gift box — session-honest tokenized stock wrap on BSC",
    ticker: state.ticker,
    symbol: state.symbol,
    session_label: state.sessionLabel,
    gap_label: state.gapLabel,
    hard_gate_decision: state.gateDecision,
    gap_mode: state.gapMode,
    gap_acknowledged: state.gapAcknowledged,
    gate_reasons: state.reasons,
    amount_usdt: state.amountUsdt ?? null,
    doctrine:
      "Hard DENY means do not wrap. Soft ALLOW with toxic/overnight gap needs explicit gap ack. Never invent prices.",
  };
}

function giftQuestionsOpenApi() {
  return {
    wrap_honest: {
      type: "noul",
      instructions:
        "Is it honest to wrap this tokenized stock as a gift for a non-expert recipient right now?",
      criteria: {
        true: "Session is open or gap is explicitly acknowledged; reference is not misleading.",
        false:
          "Closed/overnight/halted session or toxic gap without acknowledgement would mislead the recipient.",
      },
    },
    gift_timing: {
      type: "choice",
      instructions: "What should the sender do with this gift wrap?",
      criteria: {
        send_now: "Safe to wrap and share the claim link now.",
        wait_for_open: "Wait until the cash/RWA session is clearly open.",
        gap_ack_only:
          "Only wrap if the sender explicitly acknowledges weekend/overnight gap mode.",
      },
    },
    freshness_risk: {
      type: "score",
      instructions: "How risky is a stale or gap reference for this gift?",
      criteria: [
        "Low — reference looks session-honest",
        "Medium — watch overnight or mild gap",
        "High — closed session or toxic gap risk",
      ],
    },
  };
}

function giftQuestionsAiSdk() {
  return {
    wrap_honest: {
      type: "boolean" as const,
      instructions:
        "Is it honest to wrap this tokenized stock as a gift for a non-expert recipient right now?",
      criteria: {
        true: "Session is open or gap is explicitly acknowledged; reference is not misleading.",
        false:
          "Closed/overnight/halted session or toxic gap without acknowledgement would mislead the recipient.",
      },
    },
    gift_timing: {
      type: "choice" as const,
      instructions: "What should the sender do with this gift wrap?",
      criteria: {
        send_now: "Safe to wrap and share the claim link now.",
        wait_for_open: "Wait until the cash/RWA session is clearly open.",
        gap_ack_only:
          "Only wrap if the sender explicitly acknowledges weekend/overnight gap mode.",
      },
    },
    freshness_risk: {
      type: "score" as const,
      instructions: "How risky is a stale or gap reference for this gift?",
      criteria: [
        "Low — reference looks session-honest",
        "Medium — watch overnight or mild gap",
        "High — closed session or toxic gap risk",
      ],
    },
  };
}

/** Pure parse helper — unit-tested. Handles OpenAPI noul + AI SDK boolean.probability */
export function parseJevGiftAnswers(
  answers: unknown,
  meta?: {
    model?: string;
    cost?: number;
    provider?: JevGiftJudgment["provider"];
    detail?: string;
  },
): JevGiftJudgment {
  const root = asRecord(answers) ?? {};
  const honest = asRecord(root["wrap_honest"]);
  const timing = asRecord(root["gift_timing"]);
  const fresh = asRecord(root["freshness_risk"]);

  let wrapHonest: number | null = null;
  if (typeof honest?.["noul"] === "number") wrapHonest = honest["noul"] as number;
  else if (typeof honest?.["probability"] === "number")
    wrapHonest = honest["probability"] as number;

  const choice = typeof timing?.["choice"] === "string" ? timing["choice"] : null;
  const timingChoice =
    choice === "send_now" || choice === "wait_for_open" || choice === "gap_ack_only"
      ? choice
      : null;
  const timingConfidence =
    typeof timing?.["confidence"] === "number"
      ? (timing["confidence"] as number)
      : null;
  const freshnessRisk =
    typeof fresh?.["score"] === "number" ? (fresh["score"] as number) : null;
  const legend = asRecord(fresh?.["legend"]);
  let freshnessLabel: string | null = null;
  if (freshnessRisk != null && legend) {
    const idx = String(Math.round(freshnessRisk));
    const label = legend[idx];
    freshnessLabel = typeof label === "string" ? label : null;
  } else if (freshnessRisk != null) {
    const labels = [
      "Low — reference looks session-honest",
      "Medium — watch overnight or mild gap",
      "High — closed session or toxic gap risk",
    ];
    freshnessLabel = labels[Math.min(2, Math.max(0, Math.round(freshnessRisk)))] ?? null;
  }

  return {
    wrapHonest,
    timing: timingChoice,
    timingConfidence,
    freshnessRisk,
    freshnessLabel,
    model: meta?.model ?? TYPESAFE_MODEL,
    costUsd: meta?.cost ?? null,
    mode: "live",
    detail: meta?.detail ?? "Jev typed judgment",
    provider: meta?.provider ?? "none",
  };
}

async function judgeViaTypeSafe(
  state: JevGiftState,
): Promise<AdapterResult<JevGiftJudgment>> {
  const key = getTypeSafeApiKey();
  if (!key) {
    return errResult("bell.jev", "typesafe_not_configured", "TYPESAFE_API_KEY unset");
  }
  try {
    const res = await fetch(TYPESAFE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env["BELL_TYPESAFE_MODEL"]?.trim() || TYPESAFE_MODEL,
        state: giftStatePayload(state),
        questions: giftQuestionsOpenApi(),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return errResult("bell.jev", "typesafe_bad_json", `HTTP ${res.status}: ${text.slice(0, 160)}`);
    }
    if (!res.ok) {
      const errObj = asRecord(json);
      const msg =
        (typeof errObj?.["error"] === "object" &&
          asRecord(errObj["error"])?.["message"]) ||
        text.slice(0, 200);
      return errResult("bell.jev", "typesafe_http_error", `HTTP ${res.status}: ${String(msg)}`);
    }
    const root = asRecord(json);
    const usage = asRecord(root?.["usage"]);
    return okResult(
      "bell.jev",
      parseJevGiftAnswers(root?.["answers"], {
        model: typeof root?.["model"] === "string" ? root["model"] : TYPESAFE_MODEL,
        cost: typeof usage?.["cost"] === "number" ? (usage["cost"] as number) : null,
        provider: "typesafe",
        detail: "TypeSafe console (free credit path)",
      }),
      "live",
    );
  } catch (e) {
    return errResult(
      "bell.jev",
      "typesafe_fetch_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}

async function judgeViaVercelGateway(
  state: JevGiftState,
): Promise<AdapterResult<JevGiftJudgment>> {
  const hasOidc = Boolean(process.env["VERCEL_OIDC_TOKEN"]?.trim());
  const hasKey = Boolean(process.env["AI_GATEWAY_API_KEY"]?.trim());
  if (!hasOidc && !hasKey && process.env["VERCEL"] !== "1") {
    return errResult(
      "bell.jev",
      "gateway_not_configured",
      "Vercel AI Gateway OIDC/key unavailable locally",
    );
  }
  try {
    const { experimental_evaluate: evaluate } = await import("ai");
    const result = await evaluate({
      model: process.env["BELL_JEV_GATEWAY_MODEL"]?.trim() || GATEWAY_MODEL,
      state: giftStatePayload(state),
      questions: giftQuestionsAiSdk(),
    });
    const answers = (result as { answers?: unknown }).answers;
    return okResult(
      "bell.jev",
      parseJevGiftAnswers(answers, {
        model: GATEWAY_MODEL,
        provider: "vercel-ai-gateway",
        detail: "Vercel AI Gateway evaluate (typesafe-ai/jev)",
      }),
      "live",
    );
  } catch (e) {
    return errResult(
      "bell.jev",
      "gateway_evaluate_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}

async function judgeViaOpenRouter(
  state: JevGiftState,
): Promise<AdapterResult<JevGiftJudgment>> {
  const key = getOpenRouterApiKey();
  if (!key) {
    return errResult("bell.jev", "openrouter_not_configured", "OPENROUTER_API_KEY unset");
  }
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env["BELL_PUBLIC_ORIGIN"]?.trim() || "https://bell.vercel.app",
        "X-Title": "BELL Gift Box",
      },
      body: JSON.stringify({
        model: getJevModel(),
        state: giftStatePayload(state),
        questions: giftQuestionsOpenApi(),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return errResult("bell.jev", "openrouter_bad_json", `HTTP ${res.status}: ${text.slice(0, 160)}`);
    }
    if (!res.ok) {
      const errObj = asRecord(json);
      const msg =
        (typeof errObj?.["error"] === "object" &&
          asRecord(errObj["error"])?.["message"]) ||
        text.slice(0, 200);
      return errResult("bell.jev", "openrouter_http_error", `HTTP ${res.status}: ${String(msg)}`);
    }
    const root = asRecord(json);
    const usage = asRecord(root?.["usage"]);
    return okResult(
      "bell.jev",
      parseJevGiftAnswers(root?.["answers"], {
        model: typeof root?.["model"] === "string" ? root["model"] : getJevModel(),
        cost: typeof usage?.["cost"] === "number" ? (usage["cost"] as number) : null,
        provider: "openrouter",
        detail: "OpenRouter Decisions (prepaid credits)",
      }),
      "live",
    );
  } catch (e) {
    return errResult(
      "bell.jev",
      "openrouter_fetch_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}

export async function judgeGiftWrapWithJev(
  state: JevGiftState,
): Promise<AdapterResult<JevGiftJudgment>> {
  const attempts: string[] = [];

  const ts = await judgeViaTypeSafe(state);
  if (ts.ok) return ts;
  attempts.push(`${ts.reason}`);

  const gw = await judgeViaVercelGateway(state);
  if (gw.ok) return gw;
  attempts.push(`${gw.reason}`);

  const or = await judgeViaOpenRouter(state);
  if (or.ok) return or;
  attempts.push(`${or.reason}`);

  return errResult(
    "bell.jev",
    "jev_not_configured",
    `No free/live Jev path. Tried: ${attempts.join(" → ")}. Get free TypeSafe credit at console.typesafe.ai then set TYPESAFE_API_KEY on Bell Vercel.`,
  );
}
