import { errResult, okResult, type AdapterResult } from "./types";
import { rwaCached, RWA_TTL } from "./rwa-cache";
import { BSC_CHAIN_ID, RWA_ASSET_STATUS_URL, rwaFetchJson } from "./rwa-endpoints";

export type RwaAssetStatus = {
  chainId: string;
  contractAddress: string;
  openState: boolean;
  reasonCode: string | null;
  reasonMsg: string | null;
  marketStatus: string | null;
};

type ApiEnvelope = {
  code?: string;
  success?: boolean;
  data?: {
    openState?: boolean;
    reasonCode?: string | null;
    reasonMsg?: string | null;
    marketStatus?: string | null;
  };
};

export async function fetchRwaAssetStatus(opts: {
  contractAddress: string;
  chainId?: string;
}): Promise<AdapterResult<RwaAssetStatus>> {
  const chainId = opts.chainId ?? BSC_CHAIN_ID;
  const contractAddress = opts.contractAddress.trim();
  if (!contractAddress) {
    return errResult("bell.rwa-asset-status", "missing_contract", "contractAddress required");
  }
  return rwaCached(
    `rwa-asset:${chainId}:${contractAddress.toLowerCase()}`,
    RWA_TTL.assetStatus,
    async () => {
      try {
        const qs = new URLSearchParams({
          chainId,
          contractAddress,
        });
        const { status, body } = await rwaFetchJson<ApiEnvelope>(`${RWA_ASSET_STATUS_URL}?${qs}`);
        if (status !== 200 || body.code !== "000000" || !body.data) {
          return errResult(
            "bell.rwa-asset-status",
            "rwa_asset_status_bad_response",
            `HTTP ${status} code=${body.code ?? "n/a"}`,
          );
        }
        const d = body.data;
        return okResult("mainnet-read", "bell.rwa-asset-status", {
          chainId,
          contractAddress,
          openState: Boolean(d.openState),
          reasonCode: d.reasonCode ?? null,
          reasonMsg: d.reasonMsg ?? null,
          marketStatus: d.marketStatus ?? null,
        });
      } catch (e) {
        return errResult(
          "bell.rwa-asset-status",
          "rwa_asset_status_fetch_failed",
          e instanceof Error ? e.message : String(e),
        );
      }
    },
  );
}

export function isAssetPausedOrHalted(status: RwaAssetStatus): boolean {
  const code = (status.reasonCode ?? "").toUpperCase();
  if (!status.openState) return true;
  return (
    code.includes("PAUSE") ||
    code.includes("HALT") ||
    code.includes("EARNINGS") ||
    code.includes("DIVIDEND") ||
    code.includes("SPLIT") ||
    code.includes("MERGER")
  );
}
