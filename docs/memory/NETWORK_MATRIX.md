# BELL — NETWORK MATRIX

| Capability | Network | Mode when live | Mode if missing keys |
|---|---|---|---|
| RWA token list | BSC 56 (+ ETH 1 listed) | `mainnet-read` | `unavailable` |
| RWA market / asset status | Public Binance bapi | `mainnet-read` | `unavailable` |
| RWA dynamic price / reference | Public Binance bapi | `mainnet-read` | `unavailable` |
| Session gate | Server | `mainnet-read` | DENY |
| Trading quote | Binance Web3 Trading API | `quote-only` | `unavailable` |
| Transaction simulate | Binance Web3 Transaction API | `simulate` | `unavailable` |
| Broadcast / swap | Agentic Wallet / signed | `broadcast` | `unavailable` |
| Agent Studio watcher | BNB Agent Studio / cron | labeled runtime | `unavailable` |
| LLM briefs | AgentRouter (+ Tor/relay) | live model | `unavailable` (no mock) |

BSC chainId = **56**. Spot only. No perps.
