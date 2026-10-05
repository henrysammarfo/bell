/** UI session labels. Live markets come from `listBscMarkets` — not this file. */
export type SessionState = "open" | "closed" | "halted" | "gap";

/** Legacy demo activity — prefer `activity_history` for authenticated users. */
export const activity = [
  {
    id: "BL-0918",
    asset: "AAPLon",
    amount: "20 USDT",
    state: "Denied",
    time: "Fri · 22:00 UTC",
    detail: "Underlying session closed",
  },
  {
    id: "BL-0917",
    asset: "NVDAb",
    amount: "35 USDT",
    state: "Simulated",
    time: "Fri · 18:42 UTC",
    detail: "No broadcast",
  },
  {
    id: "BL-0916",
    asset: "SPYon",
    amount: "25 USDT",
    state: "Broadcast",
    time: "Fri · 16:08 UTC",
    detail: "BSC mainnet · confirmed",
  },
  {
    id: "BL-0915",
    asset: "METAon",
    amount: "15 USDT",
    state: "Denied",
    time: "Thu · 15:31 UTC",
    detail: "Underlying halted",
  },
];
