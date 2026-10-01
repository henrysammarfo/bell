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
| Binance Trading / Transaction | Keys on Vercel · quote + simulate · Cursor often `451` |
| Agentic Wallet (`/wallet` + `baw`) | Status UI + bridge · needs live pair for broadcast |
| Session watcher / DX evidence | Live |

## Honesty

Receipt / claim never invents `0x…` hashes. Mode badges required. Residual risk in `THREAT_MODEL.md`.

## JEF note

Jefferies JEFx exists elsewhere; beachhead stays Ondo / bStock on BSC 56. Demo AAPL/NVDA unless JEF is live on BSC RWA list.

## Blocked on Henry

1. **Rotate** Binance Web3 keys (pasted in chat) after hack
2. Agentic Wallet pair for funded wrap + send proof
3. Optional: Neon Auth custom SMTP
