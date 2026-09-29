import { errResult, okResult, type AdapterResult } from "./types";
import { BSC_CHAIN_ID, RWA_HEADERS, rwaFetchJson } from "./rwa-endpoints";

/** Correct path from binance-tokenized-securities-info skill (API 5). */
export const RWA_DYNAMIC_URL =
  "https://www.binance.com/bapi/defi/v2/public/wallet-direct/buw/wallet/market/token/rwa/dynamic/ai";

export type RwaDynamic = {
  chainId: string;
  contractAddress: string;
  /** On-chain token price (tokenInfo.price). */
  tokenPrice: number | null;
  /**
   * Underlying stock price from stockInfo.price when present.
   * NOT an official NYSE print — may be null outside hours.
   * When null, referencePrice derived via tokenPrice / sharesMultiplier.
   */
  referencePrice: number | null;
  multiplier: number | null;
  holders: number | null;
  raw: Record<string, unknown>;
};

type ApiEnvelope = {
  code?: string;
  success?: boolean;
  data?: {
    tokenInfo?: Record<string, unknown>;
    stockInfo?: Record<string, unknown>;
    statusInfo?: Record<string, unknown>;
    [k: string]: unknown;
  };
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function fetchRwaDynamic(opts: {
  contractAddress: string;
  chainId?: string;
}): Promise<AdapterResult<RwaDynamic>> {
  const chainId = opts.chainId ?? BSC_CHAIN_ID;
  const contractAddress = opts.contractAddress.trim();
  if (!contractAddress) {
    return errResult("bell.rwa-dynamic", "missing_contract", "contractAddress required");
  }
  try {
    const qs = new URLSearchParams({ chainId, contractAddress });
    const { status, body } = await rwaFetchJson<ApiEnvelope>(`${RWA_DYNAMIC_URL}?${qs}`, {
      headers: RWA_HEADERS,
    });
    if (status !== 200 || body.code !== "000000" || !body.data) {
      return errResult(
        "bell.rwa-dynamic",
        "rwa_dynamic_bad_response",
        `HTTP ${status} code=${body.code ?? "n/a"}`,
      );
    }
    const d = body.data;
    const tokenInfo = (d.tokenInfo ?? {}) as Record<string, unknown>;
    const stockInfo = (d.stockInfo ?? {}) as Record<string, unknown>;
    const tokenPrice = num(tokenInfo["price"]);
    const multiplier = num(tokenInfo["sharesMultiplier"]);
    const holders = num(tokenInfo["totalHolders"]);
    let referencePrice = num(stockInfo["price"]);
    // When cash print is null (closed hours), derive economic reference from
    // on-chain token price / multiplier — labeled as API-derived, not NYSE.
    if (referencePrice == null && tokenPrice != null && multiplier && multiplier > 0) {
      referencePrice = tokenPrice / multiplier;
    }

    return okResult("mainnet-read", "bell.rwa-dynamic", {
      chainId,
      contractAddress,
      tokenPrice,
      referencePrice,
      multiplier,
      holders,
      raw: d as Record<string, unknown>,
    });
  } catch (e) {
    return errResult(
      "bell.rwa-dynamic",
      "rwa_dynamic_fetch_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}

/** Gap percent: (token - reference) / reference * 100. Null if either missing. */
export function computeGapPct(
  tokenPrice: number | null,
  referencePrice: number | null,
): number | null {
  if (
    tokenPrice == null ||
    referencePrice == null ||
    !Number.isFinite(tokenPrice) ||
    !Number.isFinite(referencePrice) ||
    referencePrice === 0
  ) {
    return null;
  }
  return ((tokenPrice - referencePrice) / referencePrice) * 100;
}

export function formatGapPct(gap: number | null): string {
  if (gap == null) return "n/a";
  const sign = gap > 0 ? "+" : "";
  return `${sign}${gap.toFixed(2)}%`;
}
