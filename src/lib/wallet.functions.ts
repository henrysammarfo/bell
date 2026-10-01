/**
 * Agentic Wallet status for BELL UI — never invents addresses or hashes.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireNeonAuth } from "@/integrations/neon/auth-middleware";
import { getAgenticWalletStatus } from "@/lib/adapters/agentic-wallet";

export const fetchAgenticWalletStatus = createServerFn({ method: "GET" })
  .middleware([requireNeonAuth])
  .handler(async () => {
    const status = await getAgenticWalletStatus();
    return {
      connected: status.connected,
      address: status.address,
      detail: status.detail,
      howTo: [
        "Install Binance app with Agentic Wallet / Web3 for your region",
        "On your laptop: bash scripts/baw-connect.sh",
        "Open the printed URL or enter the pairing code in the app",
        "If the code is wrong/expired, re-run the script for a fresh one",
        "Confirm until CONNECTED, then Refresh status in BELL /wallet",
        "Optional: on /gift enable Fund now via Agentic Wallet for on-chain wrap",
      ],
    };
  });
