/**
 * Binance Web3 Trading + Transaction adapters.
 * Fail closed when BINANCE_WEB3_API_KEY / SECRET missing — never invent quotes or tx hashes.
 *
 * OpenAPI host: https://web3.binance.com
 * Paths (developer portal BX- keys + HMAC SHA256):
 *   GET /api/v1/swap/quote
 *   GET /api/v1/transaction/simulate
 */
import { createHmac } from "node:crypto";
import { errResult, okResult, type AdapterResult } from "./types";
import { BSC_CHAIN_ID } from "./rwa-endpoints";

export type QuoteSimulateData = {
  mode: "simulate" | "quote-only";
  symbol: string;
  expectedOut: string;
  referenceLabel: string;
  priceImpact: string;
  networkFee: string;
  detail: string;
  quoteRaw?: unknown;
  simulateRaw?: unknown;
};

export type BroadcastData = {
  mode: "broadcast";
  txHash: string;
  explorerUrl: string;
  detail: string;
};

function keys(): { key: string; secret: string } | null {
  const key = process.env["BINANCE_WEB3_API_KEY"]?.trim();
  const secret = process.env["BINANCE_WEB3_API_SECRET"]?.trim();
  if (!key || !secret) return null;
  return { key, secret };
}

export function web3ApiBase(): string {
  return (process.env["BINANCE_WEB3_API_BASE"]?.trim() || "https://web3.binance.com").replace(
    /\/$/,
    "",
  );
}

/** HMAC SHA256 hex over sorted key=value&… payload (signature param excluded). */
export function signQuery(secret: string, query: string): string {
  return createHmac("sha256", secret).update(query).digest("hex");
}

export function signedQuery(
  secret: string,
  params: Record<string, string | number>,
): { payload: string; signature: string; search: string } {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v).length > 0)
    .map(([k, v]) => [k, String(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const payload = entries.map(([k, v]) => `${k}=${v}`).join("&");
  const signature = signQuery(secret, payload);
  return { payload, signature, search: `${payload}&signature=${signature}` };
}

async function signedGet(
  path: string,
  params: Record<string, string | number>,
  creds: { key: string; secret: string },
): Promise<{ status: number; text: string; json: unknown }> {
  const { search } = signedQuery(creds.secret, {
    ...params,
    timestamp: Date.now(),
    recvWindow: 5000,
  });
  const url = `${web3ApiBase()}${path}?${search}`;
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": creds.key,
      Accept: "application/json",
      "User-Agent": "binance-web3/1.1 (Skill)",
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, text, json };
}

function isGeoBlocked(status: number, text: string): boolean {
  return (
    status === 451 ||
    text.toLowerCase().includes("restricted location") ||
    text.toLowerCase().includes("eligibility")
  );
}

/**
 * When keys are present, call Trading quote + Transaction simulate against
 * Binance Web3 OpenAPI. Refuse to invent fills — surface real HTTP/geo errors.
 */
export async function quoteAndSimulate(opts: {
  ticker: string;
  amountUsdt: string;
  contractAddress: string | null;
  symbol: string | null;
  referencePrice: number | null;
  tokenPrice: number | null;
}): Promise<AdapterResult<QuoteSimulateData>> {
  const creds = keys();
  const symbol = opts.symbol ?? opts.ticker;
  const ref =
    opts.referencePrice != null
      ? `$${opts.referencePrice.toFixed(2)} · API referencePrice (≠ NYSE)`
      : "reference unavailable";

  if (!creds) {
    if (opts.tokenPrice == null || !Number.isFinite(opts.tokenPrice)) {
      return errResult(
        "bell.trading",
        "binance_web3_keys_missing",
        "Set BINANCE_WEB3_API_KEY and BINANCE_WEB3_API_SECRET for Trading/Transaction simulate. No invented quote.",
      );
    }
    const spend = Number(opts.amountUsdt);
    if (!Number.isFinite(spend) || spend <= 0) {
      return errResult("bell.trading", "invalid_amount", "amountUsdt must be a positive number");
    }
    const expected = spend / opts.tokenPrice;
    return okResult("quote-only", "bell.trading", {
      mode: "quote-only",
      symbol,
      expectedOut: `${expected.toFixed(6)} ${symbol}`,
      referenceLabel: ref,
      priceImpact: "n/a · keys missing for DEX quote",
      networkFee: "n/a",
      detail:
        "Quote-only from live RWA token price. BINANCE_WEB3 keys required for Transaction simulate — not a fill.",
    });
  }

  if (!opts.contractAddress) {
    return errResult(
      "bell.trading",
      "missing_contract",
      "No BSC contractAddress from live RWA list — refuse signed quote.",
    );
  }

  const spend = Number(opts.amountUsdt);
  if (!Number.isFinite(spend) || spend <= 0) {
    return errResult("bell.trading", "invalid_amount", "amountUsdt must be a positive number");
  }

  const common = {
    chainId: BSC_CHAIN_ID,
    fromTokenAddress: "0x55d398326f99059fF775485246999027B3197955", // USDT BSC
    toTokenAddress: opts.contractAddress,
    fromTokenQty: opts.amountUsdt,
    amount: opts.amountUsdt,
  };

  try {
    const quote = await signedGet("/api/v1/swap/quote", common, creds);
    if (isGeoBlocked(quote.status, quote.text)) {
      return errResult(
        "bell.trading",
        "binance_geo_restricted",
        `Swap quote blocked by Binance geo eligibility (HTTP ${quote.status}). Deploy from an allowed region or use VPN egress — no invented quote.`,
      );
    }
    if (quote.status >= 400) {
      return errResult(
        "bell.trading",
        "swap_quote_http_error",
        `HTTP ${quote.status}: ${quote.text.slice(0, 400)}`,
      );
    }

    const simulate = await signedGet("/api/v1/transaction/simulate", common, creds);
    if (isGeoBlocked(simulate.status, simulate.text)) {
      return errResult(
        "bell.trading",
        "binance_geo_restricted",
        `Transaction simulate blocked by Binance geo eligibility (HTTP ${simulate.status}). Keys accepted path but region denied — no invented fill.`,
      );
    }
    if (simulate.status >= 400) {
      return errResult(
        "bell.trading",
        "transaction_simulate_http_error",
        `HTTP ${simulate.status}: ${simulate.text.slice(0, 400)}`,
      );
    }

    const expected =
      opts.tokenPrice && Number.isFinite(spend) ? spend / opts.tokenPrice : null;

    return okResult("simulate", "bell.trading", {
      mode: "simulate",
      symbol,
      expectedOut:
        expected != null ? `${expected.toFixed(6)} ${symbol}` : "see quoteRaw / simulateRaw",
      referenceLabel: ref,
      priceImpact: "from Binance Web3 quote/simulate",
      networkFee: "from simulate response",
      detail: `Signed swap quote + transaction simulate OK — no broadcast.`,
      quoteRaw: quote.json,
      simulateRaw: simulate.json,
    });
  } catch (e) {
    return errResult(
      "bell.trading",
      "transaction_simulate_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}

export async function broadcastSwap(opts: {
  ticker: string;
  amountUsdt: string;
  contractAddress: string | null;
  symbol: string | null;
}): Promise<AdapterResult<BroadcastData>> {
  const creds = keys();
  if (!creds) {
    return errResult(
      "bell.broadcast",
      "binance_web3_keys_missing",
      "Set BINANCE_WEB3_API_KEY/SECRET (developer portal) — still required alongside Agentic Wallet.",
    );
  }
  if (!opts.contractAddress) {
    return errResult(
      "bell.broadcast",
      "missing_contract",
      "No BSC contract from live RWA list — refuse broadcast.",
    );
  }

  const { agenticMarketSwap } = await import("./agentic-wallet");
  const res = await agenticMarketSwap({
    amountUsdt: opts.amountUsdt,
    toTokenAddress: opts.contractAddress,
    symbol: opts.symbol ?? opts.ticker,
  });
  if (!res.ok) return res;
  return okResult("broadcast", "bell.broadcast", {
    mode: "broadcast",
    txHash: res.data.txHash,
    explorerUrl: res.data.explorerUrl,
    detail: res.data.detail,
  });
}

/** Readiness probe for DX / smokes — never invents a fill. */
export async function probeBinanceWeb3Signing(): Promise<{
  keysPresent: boolean;
  quoteStatus: number | null;
  simulateStatus: number | null;
  detail: string;
}> {
  const creds = keys();
  if (!creds) {
    return {
      keysPresent: false,
      quoteStatus: null,
      simulateStatus: null,
      detail: "BINANCE_WEB3_API_KEY/SECRET missing",
    };
  }
  try {
    const common = {
      chainId: BSC_CHAIN_ID,
      fromTokenAddress: "0x55d398326f99059fF775485246999027B3197955",
      toTokenAddress: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4", // AAPLon BSC
      fromTokenQty: "1",
      amount: "1",
    };
    const quote = await signedGet("/api/v1/swap/quote", common, creds);
    const simulate = await signedGet("/api/v1/transaction/simulate", common, creds);
    return {
      keysPresent: true,
      quoteStatus: quote.status,
      simulateStatus: simulate.status,
      detail: isGeoBlocked(quote.status, quote.text)
        ? "Keys present · Binance geo-restricted from this egress"
        : `quote=${quote.status} simulate=${simulate.status}`,
    };
  } catch (e) {
    return {
      keysPresent: true,
      quoteStatus: null,
      simulateStatus: null,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
