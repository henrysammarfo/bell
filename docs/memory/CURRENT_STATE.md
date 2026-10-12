# BELL — CURRENT STATE

> Updated: 2026-10-11 · Submit day · tests 22/22 · build green · SUBMISSION.md  
> Bible: `docs/BELL_BIBLE.md` · Pivot: `PIVOT_GIFTBOX.md` · Comp: `COMP_GIFT_UX.md` · Threat: `THREAT_MODEL.md`  
> Soft pitch: Wrap a tokenized stock as a gift. They unwrap the link — BELL won’t wrap it at a fake weekend price unless you say so.

## Soft pitch (lock)

**Session-honest gift boxes for BSC tokenized stocks — bStocks first, then Ondo.** Payer wraps · receiver claims. Fail closed on stale weekend prints unless weekend-gap is explicit. Not another Binance buy UI.

## What exists in repo

| Area | Status |
|---|---|
| Gift Box UX (`/gift`, `/gift/claim/$code`) | **Shipped** — wrap ritual + unwrap claim |
| Gift Neon schema `gift_boxes` | **Applied** on Bell Neon |
| Live RWA adapters + TTL cache | **Live** — list 10m · status 45s · dynamic 20s · asset 60s |
| Markets order | **bStocks → Ondo → xStocks** (live type 3/1/2) |
| Landing / auth / shell | **Binance black · #F0B90B · white** · Outfit + IBM Plex Mono |
| Neon Postgres + Managed Better Auth | **Live** on project `bell` |
| httpOnly multi-tenant sessions | `BELL_SESSION_SECRET` on Bell Vercel |
| AI trade briefs | AgentRouter+Tor · Vercel AI Gateway prod |
| **Jev** (TypeSafe) gift judgment | Free-first: `TYPESAFE_API_KEY` → AI Gateway → OpenRouter |
| Setup runbook | `docs/memory/SETUP_JEV_AND_WALLET.md` |
| Binance Trading / Transaction | Keys on Vercel · quote + simulate · Cursor often `451` |
| Agentic Wallet (`/wallet` + `baw`) | Status UI + bridge · needs live pair for broadcast |
| Session watcher / DX evidence | Live |

## Honesty

Receipt / claim never invents `0x…` hashes. Mode badges required. Residual risk in `THREAT_MODEL.md`.

## JEV note (correction)

Earlier “JEF/Jefferies” was wrong. **JEV = TypeSafe Jev** decision model. Hard gate DENY still wins; Jev scores wrap honesty / timing / freshness for the gift UX.

## Keys Henry still owes (names only)

1. **`TYPESAFE_API_KEY`** — free Jev path (~$5 console credit) — not on Vercel yet  
2. Pair Agentic Wallet (`bash scripts/baw-connect.sh`) for live claim broadcast  
3. **Rotate** Binance Web3 keys (pasted in chat earlier)  
4. Optional: Neon Auth custom SMTP  

Already live / free public: Binance RWA list/status/dynamic (no key). Signed quote/sim needs `BINANCE_WEB3_*` (set). Research: `TAVILY_API_KEY` / `TINYFISH_API_KEY` local.

## Prod URL note

Vercel project `bell` production alias observed as **`https://bell-eta-five.vercel.app`**. `bell.vercel.app` may be a different/older surface — re-check before demo day.
