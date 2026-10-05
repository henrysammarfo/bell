import { errResult, okResult, type AdapterResult } from "./types";
import { RWA_MARKET_STATUS_URL, rwaFetchJson } from "./rwa-endpoints";

export type RwaMarketStatus = {
  marketStatus: string;
  openState: boolean;
  reasonCode: string | null;
  reasonMsg: string | null;
  nextOpen: string | null;
  nextClose: string | null;
  nextOpenTime: number | null;
  nextCloseTime: number | null;
  offhoursOpenState: boolean | null;
};

type ApiEnvelope = {
  code?: string;
  success?: boolean;
  data?: {
    marketStatus?: string;
    openState?: boolean;
    reasonCode?: string | null;
    reasonMsg?: string | null;
    nextOpen?: string | null;
    nextClose?: string | null;
    nextOpenTime?: number | null;
    nextCloseTime?: number | null;
    offhours?: { openState?: boolean };
  };
};

export async function fetchRwaMarketStatus(): Promise<AdapterResult<RwaMarketStatus>> {
  try {
    const { status, body } = await rwaFetchJson<ApiEnvelope>(RWA_MARKET_STATUS_URL);
    if (status !== 200 || body.code !== "000000" || !body.data) {
      return errResult(
        "bell.rwa-market-status",
        "rwa_market_status_bad_response",
        `HTTP ${status} code=${body.code ?? "n/a"}`,
      );
    }
    const d = body.data;
    return okResult("mainnet-read", "bell.rwa-market-status", {
      marketStatus: String(d.marketStatus ?? "unknown"),
      openState: Boolean(d.openState),
      reasonCode: d.reasonCode ?? null,
      reasonMsg: d.reasonMsg ?? null,
      nextOpen: d.nextOpen ?? null,
      nextClose: d.nextClose ?? null,
      nextOpenTime: d.nextOpenTime ?? null,
      nextCloseTime: d.nextCloseTime ?? null,
      offhoursOpenState: d.offhours?.openState ?? null,
    });
  } catch (e) {
    return errResult(
      "bell.rwa-market-status",
      "rwa_market_status_fetch_failed",
      e instanceof Error ? e.message : String(e),
    );
  }
}
