# BELL — SESSION LOG

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
