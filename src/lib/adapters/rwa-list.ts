import { errResult, okResult, type AdapterResult } from "./types";
import { rwaCached, RWA_TTL } from "./rwa-cache";
import { BSC_CHAIN_ID, RWA_LIST_URL, rwaFetchJson } from "./rwa-endpoints";

export type RwaListItem = {
  chainId: string;
  contractAddress: string;
  symbol: string;
  ticker: string;
  /** 1=Ondo · 2=xStocks-style · 3=bStocks (verified live 2026-10-06). */
  type: number;
  multiplier: string;
  assetType?: number;
  decimals?: number;
  /** Spot pair hint when present (bStocks often ship `cs` e.g. NVDABUSDT). */
  cs?: string;
  asset?: string;
};

export type RwaListData = {
  items: RwaListItem[];
  bscCount: number;
};

type ApiEnvelope = {
  code?: string;
  success?: boolean;
  data?: RwaListItem[];
};

/**
 * type filter (live 2026-10-06): 1=Ondo (~458 BSC), 2=xStocks (~130 BSC), 3=bStocks (~87 BSC).
 * Skills-hub docs still say “type=1 only” — that claim is stale; prefer live counts.
 * Omit type to fetch all platforms, then filter BSC.
 */
export async function fetchRwaList(opts?: {
  type?: 1 | 2 | 3;
  chainId?: string;
}): Promise<AdapterResult<RwaListData>> {
  const chainId = opts?.chainId ?? BSC_CHAIN_ID;
  const typeKey = opts?.type == null ? "all" : String(opts.type);
  return rwaCached(`rwa-list:${typeKey}:${chainId}`, RWA_TTL.list, async () => {
    try {
      const qs = new URLSearchParams();
      if (opts?.type != null) qs.set("type", String(opts.type));
      const url = qs.size ? `${RWA_LIST_URL}?${qs}` : RWA_LIST_URL;
      const { status, body } = await rwaFetchJson<ApiEnvelope>(url);
      if (status !== 200 || body.code !== "000000" || !Array.isArray(body.data)) {
        return errResult(
          "bell.rwa-list",
          "rwa_list_bad_response",
          `HTTP ${status} code=${body.code ?? "n/a"}`,
        );
      }
      const items = body.data.filter((i) => String(i.chainId) === chainId);
      return okResult("mainnet-read", "bell.rwa-list", {
        items,
        bscCount: items.length,
      });
    } catch (e) {
      return errResult(
        "bell.rwa-list",
        "rwa_list_fetch_failed",
        e instanceof Error ? e.message : String(e),
      );
    }
  });
}

/** Prefer bStocks (type 3) when the same underlying ticker exists on multiple rails. */
export function findByTicker(items: RwaListItem[], ticker: string): RwaListItem | undefined {
  const t = ticker.trim().toUpperCase();
  const matches = items.filter(
    (i) =>
      i.ticker?.toUpperCase() === t ||
      i.symbol?.toUpperCase() === t ||
      i.symbol?.toUpperCase() === `${t}ON` ||
      i.symbol?.toUpperCase() === `${t}B` ||
      i.asset?.toUpperCase() === t,
  );
  if (!matches.length) return undefined;
  return (
    matches.find((i) => i.type === 3) ??
    matches.find((i) => i.type === 1) ??
    matches[0]
  );
}
