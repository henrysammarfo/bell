/**
 * Fail-closed session honesty gate — BELL mandatory spine.
 * DENY unless cash session is honest AND asset not halted/paused,
 * OR user explicitly enables weekend-gap mode after acknowledgement.
 */
import { evaluateCashSession, type CashSession } from "./cash-session";
import {
  fetchRwaAssetStatus,
  isAssetPausedOrHalted,
  type RwaAssetStatus,
} from "./rwa-asset-status";
import { computeGapPct, fetchRwaDynamic, type RwaDynamic } from "./rwa-dynamic";
import { fetchRwaList, findByTicker, type RwaListItem } from "./rwa-list";
import { fetchRwaMarketStatus, type RwaMarketStatus } from "./rwa-market-status";
import { errResult, okResult, type AdapterResult } from "./types";

/** Absolute gap % above which we treat the print as toxic without gap mode. */
export const DEFAULT_TOXIC_GAP_PCT = 2;

export type GateDecision = "ALLOW" | "DENY";

export type GateInput = {
  ticker: string;
  /** Explicit weekend-gap mode — requires acknowledgement. */
  gapMode: boolean;
  gapAcknowledged: boolean;
  toxicGapPct?: number;
  chainId?: string;
};

export type GateExplanation = {
  decision: GateDecision;
  reasons: string[];
  ticker: string;
  symbol: string | null;
  contractAddress: string | null;
  providerType: number | null;
  cashSession: CashSession | null;
  rwaMarket: RwaMarketStatus | null;
  assetStatus: RwaAssetStatus | null;
  dynamic: RwaDynamic | null;
  gapPct: number | null;
  gapLabel: string;
  mode: "mainnet-read" | "unavailable";
  /** Soft UI session label */
  sessionLabel: "open" | "closed" | "halted" | "gap";
};

function gapLabel(gapPct: number | null): string {
  if (gapPct == null) return "n/a";
  const sign = gapPct > 0 ? "+" : "";
  return `${sign}${gapPct.toFixed(2)}%`;
}

export function decideGate(opts: {
  cashOpen: boolean;
  assetHalted: boolean;
  gapPct: number | null;
  toxicGapPct: number;
  gapMode: boolean;
  gapAcknowledged: boolean;
  rwaMarketStatus?: string | null;
}): { decision: GateDecision; reasons: string[]; sessionLabel: GateExplanation["sessionLabel"] } {
  const reasons: string[] = [];

  if (opts.assetHalted) {
    reasons.push("Underlying or token asset paused/halted (corporate action or maintenance).");
    return { decision: "DENY", reasons, sessionLabel: "halted" };
  }

  const status = (opts.rwaMarketStatus ?? "").toLowerCase();
  const overnightOrClosed =
    !opts.cashOpen ||
    status.includes("overnight") ||
    status.includes("closed") ||
    status.includes("pre") ||
    status.includes("post");

  const toxic = opts.gapPct != null && Math.abs(opts.gapPct) >= opts.toxicGapPct;

  if (!overnightOrClosed && !toxic) {
    reasons.push("Cash session open and gap within tolerance.");
    return { decision: "ALLOW", reasons, sessionLabel: "open" };
  }

  if (opts.gapMode && opts.gapAcknowledged) {
    reasons.push(
      "Weekend-gap mode ON with explicit acknowledgement — proceeding despite closed/overnight session or toxic gap.",
    );
    if (toxic) reasons.push(`Toxic gap ${gapLabel(opts.gapPct)} vs API referencePrice.`);
    if (!opts.cashOpen) reasons.push("Cash session not open (NY regular hours).");
    return { decision: "ALLOW", reasons, sessionLabel: "gap" };
  }

  if (!opts.cashOpen || overnightOrClosed) {
    reasons.push(
      "Underlying cash session is not in regular hours — on-chain may print against a stale reference.",
    );
  }
  if (toxic) {
    reasons.push(
      `Toxic gap ${gapLabel(opts.gapPct)} between on-chain token price and API referencePrice (threshold ±${opts.toxicGapPct}%).`,
    );
  }
  reasons.push("Enable weekend-gap mode and acknowledge risk to continue (no silent bypass).");
  return {
    decision: "DENY",
    reasons,
    sessionLabel: toxic ? "closed" : "closed",
  };
}

export async function evaluateSessionGate(
  input: GateInput,
): Promise<AdapterResult<GateExplanation>> {
  const ticker = input.ticker.trim().toUpperCase();
  if (!ticker) {
    return errResult("bell.session-gate", "missing_ticker", "ticker required");
  }

  const toxicGapPct = input.toxicGapPct ?? DEFAULT_TOXIC_GAP_PCT;
  const cash = evaluateCashSession();
  const market = await fetchRwaMarketStatus();
  const list = await fetchRwaList({ chainId: input.chainId });

  if (!list.ok) {
    return errResult("bell.session-gate", list.reason, list.detail);
  }

  const item: RwaListItem | undefined = findByTicker(list.data.items, ticker);
  if (!item) {
    return errResult(
      "bell.session-gate",
      "ticker_not_on_bsc",
      `No BSC tokenized stock found for ${ticker}`,
    );
  }

  const [asset, dynamic] = await Promise.all([
    fetchRwaAssetStatus({
      contractAddress: item.contractAddress,
      chainId: item.chainId,
    }),
    fetchRwaDynamic({
      contractAddress: item.contractAddress,
      chainId: item.chainId,
    }),
  ]);

  const assetHalted = asset.ok ? isAssetPausedOrHalted(asset.data) : true;
  if (!asset.ok) {
    // Fail closed if we cannot prove asset is tradable
    return okResult("mainnet-read", "bell.session-gate", {
      decision: "DENY",
      reasons: [`Asset status unavailable — fail closed (${asset.reason}).`, asset.detail],
      ticker,
      symbol: item.symbol,
      contractAddress: item.contractAddress,
      providerType: item.type,
      cashSession: cash.ok ? cash.data : null,
      rwaMarket: market.ok ? market.data : null,
      assetStatus: null,
      dynamic: dynamic.ok ? dynamic.data : null,
      gapPct: null,
      gapLabel: "n/a",
      mode: "mainnet-read",
      sessionLabel: "halted",
    });
  }

  const gapPct = dynamic.ok
    ? computeGapPct(dynamic.data.tokenPrice, dynamic.data.referencePrice)
    : null;

  const decided = decideGate({
    cashOpen: cash.ok ? cash.data.open : false,
    assetHalted,
    gapPct,
    toxicGapPct,
    gapMode: input.gapMode,
    gapAcknowledged: input.gapAcknowledged,
    rwaMarketStatus: market.ok ? market.data.marketStatus : null,
  });

  return okResult("mainnet-read", "bell.session-gate", {
    decision: decided.decision,
    reasons: decided.reasons,
    ticker,
    symbol: item.symbol,
    contractAddress: item.contractAddress,
    providerType: item.type,
    cashSession: cash.ok ? cash.data : null,
    rwaMarket: market.ok ? market.data : null,
    assetStatus: asset.data,
    dynamic: dynamic.ok ? dynamic.data : null,
    gapPct,
    gapLabel: gapLabel(gapPct),
    mode: "mainnet-read",
    sessionLabel: decided.sessionLabel,
  });
}
