/** Live RWA smoke — no secrets required. */
import { fetchRwaList } from "../src/lib/adapters/rwa-list";
import { fetchRwaMarketStatus } from "../src/lib/adapters/rwa-market-status";
import { evaluateSessionGate } from "../src/lib/adapters/session-gate";

async function main() {
  const market = await fetchRwaMarketStatus();
  console.log("market", market.ok ? market.data.marketStatus : market.reason);
  const list = await fetchRwaList({ type: 1 });
  console.log("ondo_bsc", list.ok ? list.data.bscCount : list.reason);
  const gate = await evaluateSessionGate({
    ticker: "AAPL",
    gapMode: false,
    gapAcknowledged: false,
  });
  if (!gate.ok) {
    console.error("gate_fail", gate.reason, gate.detail);
    process.exit(1);
  }
  console.log(
    "gate",
    gate.data.decision,
    gate.data.sessionLabel,
    gate.data.gapLabel,
    gate.data.symbol,
  );
  console.log("smoke_rwa_ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
