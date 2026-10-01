# BELL — SESSION LOG

## 2026-10-01 — Gift Box pivot ship

- Locked win wedge: tokenized stock **gift box** (payer wraps · claim link · unwrap) — not another Binance buy.
- Researched JEF/Jefferies JEFx — beachhead stays Ondo/bStock on BSC; demos AAPL/NVDA.
- Shipped `gift_boxes` Neon migration (applied), `gift.functions`, `/gift`, `/gift/claim/$code`, `/wallet`.
- Fun ritual UX (box + ribbon + steps) with full session gate + quote/sim + optional Agentic fund.
- Updated bible soft pitch, about, landing, WIN_CHECKLIST, PIVOT_GIFTBOX.md.

## 2026-09-30 — Binance Web3 keys wired

- Received developer-portal BX- API key (Trade/Transaction/Wallet/Market/DeFi).
- Stored on Bell Vercel + local `.env` / `.env.local` only — **not git**.
- Confirmed OpenAPI paths: `GET https://web3.binance.com/api/v1/swap/quote` and `/api/v1/transaction/simulate` (HMAC + `X-MBX-APIKEY`).
- Cursor VM egress → Binance `451` geo eligibility (honest fail-closed). Keys present smoke: `smoke_binance_keys_ok`.
- Broadcast still fail-closed until Agentic Wallet session.

## 2026-09-29 — Neon Marketplace + Auth + WAF bypass

- Confirmed Vercel project **bell** (not Vigil) · team `teamtitanlink`.
- Neon Marketplace resource live: `DATABASE_URL`, Auth URL (post-provisioning).
- Applied `20260929120000_bell_tenants.sql` to Neon (no Supabase RLS — app-enforced `user_id`).
- Cut auth to Neon Managed Better Auth end-to-end (client, middleware JWKS, serverFns, shell).
- Set on Bell Vercel: `BELL_SESSION_SECRET`, `NEON_AUTH_COOKIE_SECRET`, `AGENTROUTER_*`, `BELL_AI_GATEWAY_MODEL`.
- Novel AgentRouter WAF fix: **Vercel AI Gateway** as production path; Tor for Cursor (`smoke_llm_tor_ok`).
- Still blocked: `BINANCE_WEB3_*` for signed simulate/broadcast.

## 2026-09-29 — Win spine kickoff

- Imported BELL Bible; fact-checked hackathon page via TinyFish Fetch + WebSearch.
- Confirmed submit **2026-10-11 12:00 UTC**, scoring 30/25/25/20, specials $2k+$2k.
- Confirmed public RWA list + market status APIs live (Ondo on BSC 56).
- AgentRouter direct cloud egress = Aliyun WAF (VIGIL Tor/relay pattern required).
- Created Cursor rules/skills + `docs/memory/*` + corrected Bible.
- Shipped live adapters, httpOnly tenants, AgentRouter client, trading fail-closed stubs.
- `bun run test` 15/15 · `smoke_rwa_ok` · `bun run build` green.
- Dynamic API path corrected to `/bapi/defi/v2/.../rwa/dynamic/ai`.
- Untracked committed `.env`; ship `.env.example` only.
