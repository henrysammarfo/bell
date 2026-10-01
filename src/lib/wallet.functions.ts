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
        "Install Binance Wallet / open Binance app with Agentic Wallet support",
        "On the server/dev host: bash scripts/baw-connect.sh",
        "Scan or enter the pairing code from the terminal",
        "Confirm in the app — status should read CONNECTED",
        "Then wrap a gift with “Fund now via Agentic Wallet” if you want on-chain funding",
      ],
    };
  });
