# BELL — CURRENT STATE

> Updated: 2026-09-29 · Neon Marketplace + Neon Auth live on Bell Vercel  
> Bible: `docs/BELL_BIBLE.md` · Threat: `THREAT_MODEL.md`  
> Soft pitch: When Wall Street is closed, BELL won’t let you buy a stock token at a fake weekend price.

## Soft pitch (lock)

Closed-session honesty for BSC tokenized stocks. Fail closed on stale weekend prints unless weekend-gap is explicit.

## What exists in repo

| Area | Status |
|---|---|
| Cinematic UI routes | Implemented |
| Live RWA adapters + server session gate | **Live** — desk/markets/simulate rewired |
| Neon Postgres (Vercel Marketplace) | **Live** on project `bell` — tenants + trader tables applied |
| Neon Managed Better Auth | **Live** — `VITE_NEON_AUTH_URL` / JWKS / email auth UI |
| httpOnly multi-tenant sessions | `BELL_SESSION_SECRET` set on Bell Vercel |
| AI trade briefs | AgentRouter+Tor (Cursor) · **Vercel AI Gateway** WAF bypass (prod) · optional relay |
| Binance Trading / Transaction | **Keys on Bell Vercel** · OpenAPI `/api/v1/swap/quote` + `/transaction/simulate` · Cursor egress often `451` geo · broadcast still needs Agentic Wallet |
| Agentic Wallet broadcast | Fail-closed `agentic_wallet_not_connected` |
| Session watcher / DX evidence | Live |

## Honesty

Receipt never invents `0x…` hashes. Mode badges required. Residual risk in `THREAT_MODEL.md`.

## Blocked on Henry

1. **Rotate** Binance Web3 keys (pasted in chat) after hack; click portal “I have Saved”
2. Agentic Wallet connect for broadcast (keys alone ≠ tx hash)
3. Optional: Neon Auth custom SMTP for production email verification links 
