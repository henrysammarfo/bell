# BELL — Wrap a stock. They unwrap it.

**Session-honest gift boxes for BSC tokenized stocks** (bStocks first, then Ondo).  
Payer wraps → share a claim link → receiver unwraps. BELL fails closed on fake weekend prices unless weekend-gap mode is explicitly acknowledged.

> Not another Binance buy / markets clone. Soft pitch only — no FOLIO share-counts, no invented fills.

## Live demo

| | |
|---|---|
| **Deployed app** | https://bell-eta-five.vercel.app |
| **Public repo** | https://github.com/henrysammarfo/bell |
| **Hackathon** | [BNB Hack: Tokenized Stocks](https://www.bnbchain.org/en/hackathons/tokenized-stocks) · submit lock **2026-10-11 12:00 UTC** |

### Demo path (judges)

1. Open `/` → **Wrap a gift box**
2. Sign in (`/auth`) → `/gift` — pick a bStock ticker (e.g. `NVDA` → `NVDAB`)
3. **Weekend / closed session:** Check session → expect **DENY** (live Binance RWA market status)
4. Optional: enable weekend-gap + acknowledge → wrap proceeds with labeled gap mode
5. Share `/gift/claim/<code>` → unwrap UI (claim records honestly; Agentic Wallet send when paired)
6. Power path: `/markets` (bStocks first) · `/desk` · `/dx-report` · `/wallet`

## Stack

- **TanStack Start** (SSR) on Vercel · **Bun**
- **Neon Postgres** + Managed Better Auth (httpOnly cookies — no auth secrets in `localStorage`)
- **Binance Web3 public RWA** list/status/dynamic (TTL-cached) · signed Trading quote + Transaction simulate
- **Agentic Wallet** (`baw`) bridge for fund/claim broadcast — fail-closed until paired
- **TypeSafe Jev** second-opinion on wrap honesty (hard gate still owns ALLOW/DENY)

## Commands

```bash
bun install
bun run test          # unit: session gate, gift code, Jev shapes, cookies
bun run smoke:rwa     # live public RWA + gate
bun run smoke:binance # signed key readiness
bun run dev
bun run build
```

## Honesty / residual risk

Receipts never invent `0x…` hashes. Missing keys → labeled unavailable mode.  
See `docs/memory/THREAT_MODEL.md`, `docs/memory/FACT_CHECK.md`, `docs/BELL_BIBLE.md`.

Not investment advice. Tokenized securities may be unavailable in restricted jurisdictions (incl. US, CA, UK, JP, NL).

## Docs

- `docs/BELL_BIBLE.md` — doctrine  
- `docs/memory/CURRENT_STATE.md` · `FACT_CHECK.md` · `SUBMISSION.md` · `THREAT_MODEL.md`
