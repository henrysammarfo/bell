# BELL — CURRENT STATE

> Updated: 2026-10-01 · Gift Box pivot locked + schema live on Neon  
> Bible: `docs/BELL_BIBLE.md` · Pivot: `PIVOT_GIFTBOX.md` · Threat: `THREAT_MODEL.md`  
> Soft pitch: Wrap a tokenized stock as a gift. They unwrap the link — BELL won’t wrap it at a fake weekend price unless you say so.

## Soft pitch (lock)

**Session-honest gift boxes for BSC tokenized stocks.** Payer wraps · receiver claims. Fail closed on stale weekend prints unless weekend-gap is explicit. Not another Binance buy UI.

## What exists in repo

| Area | Status |
|---|---|
| Gift Box UX (`/gift`, `/gift/claim/$code`) | **Shipped** — wrap ritual + unwrap claim |
| Gift Neon schema `gift_boxes` | **Applied** on Bell Neon |
| Live RWA adapters + server session gate | **Live** — gate on wrap |
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

## Blocked on Henry

1. Add **`TYPESAFE_API_KEY`** from [console.typesafe.ai](https://console.typesafe.ai) (~$5 free credit) on Bell Vercel
2. Pair Agentic Wallet: `bash scripts/baw-connect.sh` → confirm in Binance app → `/wallet` refresh
3. **Rotate** Binance Web3 keys (pasted in chat) after hack
4. Optional: Neon Auth custom SMTP
