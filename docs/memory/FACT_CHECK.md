# BELL — FACT CHECK

> Only verified claims. Date + URL required. Unverified → say so.

## 2026-10-06 — bStocks live in Binance RWA list API

| Claim | Status | Source |
|---|---|---|
| `type=3` returns bStocks on BSC (chainId 56), ~87 rows | **Verified live curl** | `.../rwa/stock/detail/list/ai?type=3` |
| Sample symbols include `NVDAB`, `TSLAB`, `CRCLB`, `MUB`, `SPCXB`, `MSFTB` | Verified | same response |
| `type=1` Ondo ~1366 rows / ~458 BSC; `type=2` ~269 / ~130 BSC | Verified | live 2026-10-06 |
| Skills-hub text “type=1 is currently the only supported provider” is **stale** | Corrected | binance-skills-hub tokenized-securities skill vs live API |
| Market status AI can report `marketStatus: regular`, `openState: true` mid-week | Verified | `.../rwa/market/status/ai` 2026-10-06 |
| bStocks = 1:1-backed BEP-20 on BSC; Spot + wallet self-custody push | Verified | https://www.bnbchain.org/en/blog/introducing-bstocks-on-bnb-chain-trade-24-7-with-zero-fees-deploy-across-defi-protocols-with-full-self-custody · https://www.bstocks.finance/en/ |

## 2026-10-06 — Gift competitor research

| Claim | Status | Source |
|---|---|---|
| Givest = RH Chain stock gift links (escrow + claim) | Verified | https://usegivest.app/ · https://github.com/usegivest/givest |
| Wrapstocks / tagstock are RH gift/handle peers | Verified | wrapstocks.org · tagstock.fun |
| Base stock page is Coinbase B20 — not the gift-box winner | Verified | https://www.base.org/stocks · https://blog.base.org/tokenized-stocks |

## 2026-10-05 — Submit lock reconfirmed

| Claim | Status | Source |
|---|---|---|
| Submit lock Sun 11 Oct 2026 12:00 UTC | Verified | https://www.bnbchain.org/en/hackathons/tokenized-stocks |

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
| Binance signed Trading/Transaction | Paths live: `/api/v1/swap/quote` + `/api/v1/transaction/simulate` on `web3.binance.com` · keys set · Cursor often `451` geo |
