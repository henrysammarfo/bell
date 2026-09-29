# BELL — CURRENT STATE

> Updated: 2026-09-29 · Doctrine + live spine implementation in progress  
> Bible: `docs/BELL_BIBLE.md` · Threat: `THREAT_MODEL.md`  
> Soft pitch: When Wall Street is closed, BELL won’t let you buy a stock token at a fake weekend price.

## Soft pitch (lock)

Closed-session honesty for BSC tokenized stocks. Fail closed on stale weekend prints unless weekend-gap is explicit.

## What exists in repo

| Area | Status |
|---|---|
| Cinematic UI routes | Implemented |
| Live RWA adapters + server session gate | **Live** — desk/markets/simulate rewired |
| httpOnly multi-tenant sessions | Implemented (`BELL_SESSION_SECRET` + tenants migration) |
| Auth storage | Production uses **sessionStorage** (not localStorage); preview keeps Lovable broker |
| AI trade briefs | AgentRouter primary (Tor/relay); Lovable optional; no mock |
| Binance Trading / Transaction | Fail-closed until `BINANCE_WEB3_*`; quote-only from live RWA price when keys missing |
| Agentic Wallet broadcast | Fail-closed `agentic_wallet_not_connected` — no fake tx hash |
| Session watcher | Live RWA re-check on `/watchers` |
| DX evidence | Live HTTP probes on `/dx-report` |

## Honesty

Receipt never invents `0x…` hashes. Mode badges required. Residual risk in `THREAT_MODEL.md`.

## Blocked on Henry

1. `BINANCE_WEB3_API_KEY` + `SECRET` for signed Transaction simulate / broadcast  
2. Confirm Bell Vercel project (vs Vigil `cyber-ronin-nexus`) + optional `BELL_LLM_RELAY_URL`
