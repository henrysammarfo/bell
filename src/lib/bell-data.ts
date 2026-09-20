export type SessionState = "open" | "closed" | "halted";

export const markets = [
  { symbol: "AAPL", name: "Apple", token: "AAPLon", provider: "Ondo", price: "$248.31", gap: "+1.84%", session: "closed" as SessionState, freshness: "Fri 20:00 UTC" },
  { symbol: "TSLA", name: "Tesla", token: "TSLAon", provider: "Ondo", price: "$421.08", gap: "−0.42%", session: "closed" as SessionState, freshness: "Fri 20:00 UTC" },
  { symbol: "NVDA", name: "NVIDIA", token: "NVDAb", provider: "bStocks", price: "$179.66", gap: "+0.67%", session: "open" as SessionState, freshness: "12 sec ago" },
  { symbol: "SPY", name: "S&P 500 ETF", token: "SPYon", provider: "Ondo", price: "$663.70", gap: "+0.11%", session: "open" as SessionState, freshness: "9 sec ago" },
  { symbol: "META", name: "Meta", token: "METAb", provider: "bStocks", price: "$778.24", gap: "+2.02%", session: "halted" as SessionState, freshness: "18 min ago" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", token: "QQQon", provider: "Ondo", price: "$602.88", gap: "+0.23%", session: "open" as SessionState, freshness: "15 sec ago" },
];

export const activity = [
  { id: "BL-0918", asset: "AAPLon", amount: "20 USDT", state: "Denied", time: "Fri · 22:00 UTC", detail: "Underlying session closed" },
  { id: "BL-0917", asset: "NVDAb", amount: "35 USDT", state: "Simulated", time: "Fri · 18:42 UTC", detail: "No broadcast" },
  { id: "BL-0916", asset: "SPYon", amount: "25 USDT", state: "Broadcast", time: "Fri · 16:08 UTC", detail: "BSC mainnet · confirmed" },
  { id: "BL-0915", asset: "METAon", amount: "15 USDT", state: "Denied", time: "Thu · 15:31 UTC", detail: "Underlying halted" },
];
