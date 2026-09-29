/** Canonical Binance public RWA AI endpoints (BSC focus). */

export const RWA_BASE =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa";

export const RWA_LIST_URL = `${RWA_BASE}/stock/detail/list/ai`;
export const RWA_MARKET_STATUS_URL = `${RWA_BASE}/market/status/ai`;
export const RWA_ASSET_STATUS_URL = `${RWA_BASE}/asset/market/status/ai`;
export const RWA_META_URL = `${RWA_BASE}/meta/ai`;
/** Dynamic V2 lives under /bapi/defi/v2/… (not v1). */
export const RWA_DYNAMIC_URL =
  "https://www.binance.com/bapi/defi/v2/public/wallet-direct/buw/wallet/market/token/rwa/dynamic/ai";

export const BSC_CHAIN_ID = "56";

export const RWA_HEADERS: Record<string, string> = {
  "Accept-Encoding": "identity",
  Accept: "application/json",
  "User-Agent": "bell-web3/1.0 (Skill)",
};

export async function rwaFetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const res = await fetch(url, {
    ...init,
    headers: { ...RWA_HEADERS, ...(init?.headers as Record<string, string>) },
  });
  const body = (await res.json()) as T;
  return { status: res.status, body };
}
