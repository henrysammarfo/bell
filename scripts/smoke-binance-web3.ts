/**
 * Probe Binance Web3 signed Trading/Transaction paths.
 * Expect: keys present; may return geo_restricted from cloud VMs.
 */
import { probeBinanceWeb3Signing } from "../src/lib/adapters/binance-trading";

const probe = await probeBinanceWeb3Signing();
console.log(JSON.stringify(probe, null, 2));
if (!probe.keysPresent) {
  console.error("smoke_binance_keys_missing");
  process.exit(1);
}
// Keys wired = pass. Geo 451 is honest fail-closed, not a missing-key failure.
console.log("smoke_binance_keys_ok");
if (probe.detail.includes("geo-restricted")) {
  console.log("smoke_binance_geo_note");
}
