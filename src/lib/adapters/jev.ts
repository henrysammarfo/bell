/**
 * TypeSafe Jev (System One) via OpenRouter Decisions API.
 * Not an LLM — typed noul/choice/score answers with probabilities.
 * Docs: https://openrouter.ai/docs/guides/community/jev
 *
 * Hard session gate still owns ALLOW/DENY. Jev is the second opinion
 * on whether a gift wrap is honest enough to send.
 */
import { errResult, okResult, type AdapterResult } from "./types";

const DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";
const DEFAULT_MODEL = "typesafe/jev-1.13";

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
};

export function getJevApiKey(): string | null {
  return (
    process.env["OPENROUTER_API_KEY"]?.trim() ||
    process.env["BELL_JEV_API_KEY"]?.trim() ||
    null
  );
}

export function getJevModel(): string {
  return process.env["BELL_JEV_MODEL"]?.trim() || DEFAULT_MODEL;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Pure parse helper — unit-tested. */
export function parseJevGiftAnswers(
  answers: unknown,
  meta?: { model?: string; cost?: number },
): JevGiftJudgment {
  const root = asRecord(answers) ?? {};
  const honest = asRecord(root["wrap_honest"]);
  const timing = asRecord(root["gift_timing"]);
  const fresh = asRecord(root["freshness_risk"]);

  const wrapHonest =
    typeof honest?.["noul"] === "number" ? (honest["noul"] as number) : null;
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
  }

  return {
    wrapHonest,
    timing: timingChoice,
    timingConfidence,
    freshnessRisk,
    freshnessLabel,
    model: meta?.model ?? DEFAULT_MODEL,
    costUsd: meta?.cost ?? null,
    mode: "live",
    detail: "Jev typed judgment",
  };
}

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

export async function judgeGiftWrapWithJev(
  state: JevGiftState,
): Promise<AdapterResult<JevGiftJudgment>> {
  const key = getJevApiKey();
  if (!key) {
    return errResult(
      "bell.jev",
      "jev_not_configured",
      "Set OPENROUTER_API_KEY (or BELL_JEV_API_KEY) for TypeSafe Jev Decisions API",
    );
  }

  const body = {
    model: getJevModel(),
    state: {
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
    },
    questions: {
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
          gap_ack_only: "Only wrap if the sender explicitly acknowledges weekend/overnight gap mode.",
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
    },
  };

  try {
    const res = await fetch(DECISIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env["BELL_PUBLIC_ORIGIN"]?.trim() || "https://bell.vercel.app",
        "X-Title": "BELL Gift Box",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return errResult(
        "bell.jev",
        "jev_bad_json",
        `HTTP ${res.status}: ${text.slice(0, 160)}`,
      );
    }
    if (!res.ok) {
      const errObj = asRecord(json);
      const msg =
        (typeof errObj?.["error"] === "object" &&
          asRecord(errObj["error"])?.["message"]) ||
        text.slice(0, 200);
      return errResult("bell.jev", "jev_http_error", `HTTP ${res.status}: ${String(msg)}`);
    }
    const root = asRecord(json);
    const usage = asRecord(root?.["usage"]);
    const judgment = parseJevGiftAnswers(root?.["answers"], {
      model: typeof root?.["model"] === "string" ? root["model"] : getJevModel(),
      cost: typeof usage?.["cost"] === "number" ? (usage["cost"] as number) : null,
    });
    return okResult("bell.jev", judgment, "live");
  } catch (e) {
    return errResult(
      "bell.jev",
      "jev_fetch_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}
