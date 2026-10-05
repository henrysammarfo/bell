# BELL — FACT CHECK

> Only verified claims. Date + URL required. Unverified → say so.

## 2026-09-29 — Hackathon page (TinyFish Fetch + official URL)

| Claim | Status | Source |
|---|---|---|
| Submit lock Sun 11 Oct 2026 12:00 UTC | Verified | https://www.bnbchain.org/en/hackathons/tokenized-stocks |
| Judging 12–23 Oct; winners week of 26 Oct | Verified | same |
| Scoring Tech 30 / Creativity 25 / DX 25 / UX 20 | Verified | same |
| Specials Agentic Wallet/Skills $2k + Agent Studio $2k | Verified | same |
| Spot only; BSC mainnet; bStocks/Ondo/xStocks | Verified | same |
| Geo: US, CA, NL, UK, JP + Iran, Cuba, NK, Crimea, Donetsk, Luhansk | Verified | same |
| Organizer problem = weekend stale reference gap | Verified | same page opening copy |

## 2026-09-29 — RWA public APIs

| Claim | Status | Source |
|---|---|---|
| Token list AI returns Ondo (`type=1`) on chainId `56` and `1` | Verified live curl | `.../rwa/stock/detail/list/ai` |
| Market status AI returns `marketStatus`, `openState`, `nextOpen` | Verified live | `.../v1/.../rwa/market/status/ai` |
| Dynamic V2 URL is under **/bapi/defi/v2/** not v1 | Verified live | `.../v2/.../rwa/dynamic/ai` |
| AAPL BSC dynamic returns tokenInfo.price + stockInfo.price | Verified 2026-09-29 | Gap computable; stock price may be null off-hours |
| `smoke_rwa_ok` · Ondo BSC count ~458 · gate DENY in premarket/closed | Verified | `bun run smoke:rwa` |
| Live sample can show `marketStatus: overnight` or `premarket` with openState true | Verified | Gate uses cash session + status + gap — not openState alone |

## 2026-10-01 — JEV (TypeSafe Jev), not JEF

| Claim | Status | Source |
|---|---|---|
| Jev is a System One decision model (typed noul/choice/score), not an LLM | Verified | https://openrouter.ai/docs/guides/community/jev |
| Decisions API: `POST https://openrouter.ai/api/alpha/decisions` model `typesafe/jev-1.13` | Verified | https://openrouter.ai/docs/guides/community/jev-tutorial |
| Jefferies JEFx was a mistaken reading of “JEV” | Corrected | Operator clarification 2026-10-01 |

## 2026-09-29 — Tooling

| Claim | Status |
|---|---|
| Tavily new key returns search results | Verified |
| TinyFish Search with `X-API-Key` returns results | Verified |
| AgentRouter direct from cloud IP returns Aliyun WAF HTML | Verified |
| Binance signed Trading/Transaction | Paths live: `/api/v1/swap/quote` + `/api/v1/transaction/simulate` on `web3.binance.com` · keys set · Cursor egress `451` geo |
