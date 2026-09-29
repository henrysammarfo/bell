/**
 * Binance Web3 Trading + Transaction adapters.
 * Fail closed when BINANCE_WEB3_API_KEY / SECRET missing — never invent quotes or tx hashes.
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

/** HMAC signing helper for Binance Web3 REST (when keys present). */
export function signQuery(secret: string, query: string): string {
  return createHmac("sha256", secret).update(query).digest("hex");
}

/**
 * When keys are present, call Trading quote + Transaction simulate against
 * Binance Web3 REST. Until the exact catalog paths are configured for this
 * project key, we still refuse to invent fills — we attempt the documented
 * endpoints and surface real HTTP/status errors.
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
    // Fail closed for "live quote" — but allow a labeled estimate ONLY when
    // we have live token price from public RWA dynamic (still not a fill).
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

  // Signed path — attempt Transaction simulate via Web3 API catalog.
  // Docs: https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/transaction-api
  try {
    const base = process.env["BINANCE_WEB3_API_BASE"]?.trim() || "https://web3.binance.com";
    const timestamp = Date.now();
    const params = new URLSearchParams({
      chainId: BSC_CHAIN_ID,
      timestamp: String(timestamp),
      amount: opts.amountUsdt,
      toTokenAddress: opts.contractAddress ?? "",
      fromTokenAddress: "0x55d398326f99059fF775485246999027B3197955", // USDT BSC
    });
    const signature = signQuery(creds.secret, params.toString());
    params.set("signature", signature);

    const res = await fetch(
      `${base}/bapi/defi/v1/private/wallet-direct/buw/wallet/tx/simulate?${params}`,
      {
        headers: {
          "X-MBX-APIKEY": creds.key,
          Accept: "application/json",
          "User-Agent": "bell-web3/1.0",
        },
      },
    );
    const text = await res.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    if (!res.ok) {
      return errResult(
        "bell.trading",
        "transaction_simulate_http_error",
        `HTTP ${res.status}: ${text.slice(0, 400)}`,
      );
    }
    const spend = Number(opts.amountUsdt);
    const expected = opts.tokenPrice && Number.isFinite(spend) ? spend / opts.tokenPrice : null;
    return okResult("simulate", "bell.trading", {
      mode: "simulate",
      symbol,
      expectedOut: expected != null ? `${expected.toFixed(6)} ${symbol}` : `simulate ok · see raw`,
      referenceLabel: ref,
      priceImpact: "from simulate response",
      networkFee: "from simulate response",
      detail: `Transaction simulate HTTP ${res.status} — no broadcast.`,
      simulateRaw: body,
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
      "Broadcast requires BINANCE_WEB3_API_KEY/SECRET and Agentic Wallet — no fake tx hash.",
    );
  }
  // Agentic Wallet path placeholder — fail closed until wallet session wired.
  return errResult(
    "bell.broadcast",
    "agentic_wallet_not_connected",
    `Keys present but Agentic Wallet session not connected for ${opts.symbol ?? opts.ticker}. Connect Binance Web3 Wallet, then retry. Amount ${opts.amountUsdt} USDT · contract ${opts.contractAddress ?? "n/a"}.`,
  );
}
