import { errResult, okResult, type AdapterResult } from "./types";
import { BSC_CHAIN_ID, RWA_LIST_URL, rwaFetchJson } from "./rwa-endpoints";

export type RwaListItem = {
  chainId: string;
  contractAddress: string;
  symbol: string;
  ticker: string;
  type: number;
  multiplier: string;
  assetType?: number;
  decimals?: number;
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
 * type filter: 1=Ondo, 2=xStocks-style, 3=bStock (per Binance skills hub).
 * Omit type to fetch all, then filter BSC.
 */
export async function fetchRwaList(opts?: {
  type?: 1 | 2 | 3;
  chainId?: string;
}): Promise<AdapterResult<RwaListData>> {
  const chainId = opts?.chainId ?? BSC_CHAIN_ID;
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
}

export function findByTicker(items: RwaListItem[], ticker: string): RwaListItem | undefined {
  const t = ticker.trim().toUpperCase();
  return items.find(
    (i) =>
      i.ticker?.toUpperCase() === t ||
      i.symbol?.toUpperCase() === t ||
      i.symbol?.toUpperCase() === `${t}ON` ||
      i.symbol?.toUpperCase() === `${t}B`,
  );
}
