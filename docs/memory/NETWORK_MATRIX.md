# BELL — NETWORK MATRIX

| Capability | Network | Mode when live | Mode if missing keys |
|---|---|---|---|
| RWA token list | BSC 56 (+ ETH 1 listed) | `mainnet-read` | `unavailable` |
| RWA market / asset status | Public Binance bapi | `mainnet-read` | `unavailable` |
| RWA dynamic price / reference | Public Binance bapi | `mainnet-read` | `unavailable` |
| Session gate | Server | `mainnet-read` | DENY |
| Trading quote | `GET /api/v1/swap/quote` | `simulate` / `quote-only` | `unavailable` / geo `451` |
| Transaction simulate | `GET /api/v1/transaction/simulate` | `simulate` | `unavailable` / geo `451` |
| Broadcast / swap | Agentic Wallet / signed | `broadcast` | `unavailable` |
| Agent Studio watcher | BNB Agent Studio / cron | labeled runtime | `unavailable` |
| LLM briefs | AgentRouter (+ Tor/relay) | live model | `unavailable` (no mock) |
| Jev gift judgment | OpenRouter Decisions `typesafe/jev-1.13` | live typed answers | `unavailable` if no key |

BSC chainId = **56**. Spot only. No perps.
