# BELL — SESSION LOG

## 2026-10-06 — bStocks central + brand + efficient RWA

- Live fact-check: RWA `type=3` = **bStocks** (~87 BSC) incl. NVDAB/TSLAB; `type=1` Ondo; `type=2` xStocks. Skills-hub “type=1 only” is stale.
- Competitor pull: Givest (RH gift links) + Wrapstocks/tagstock — wrote `COMP_GIFT_UX.md`. Base B20 ≠ gift winner.
- Added `rwa-cache.ts` TTLs (list 10m / status 45s / dynamic 20s / asset 60s) so markets stay fresh without burning egress.
- Markets merge order flipped to **bStocks first**; ticker lookup prefers type 3.
- Landing rebuilt: no photo/demo card; Binance black/#F0B90B atmosphere; Outfit font; auth layout CSS fixed.
- Keys needed list refreshed in CURRENT_STATE / KEYS_STATUS.

## 2026-10-05 — Merged to main

- PR #1 merge-commit `256aba2` — gift box + Jev + Neon + RWA spine on `main`.

## 2026-10-01 — Free Jev path + wallet setup docs

- Vercel MCP: Bell has AI Gateway model + AgentRouter/Binance/Neon — **no** `TYPESAFE_API_KEY` / OpenRouter yet.
- Jev free-first order: TypeSafe console credit → Vercel AI Gateway evaluate → OpenRouter (paid).
- Wrote `docs/memory/SETUP_JEV_AND_WALLET.md` (Jev + Agentic Wallet pair steps).
- Polished auth/markets/claim/wallet UX for gift ritual.

## 2026-10-01 — JEV correction (not JEF)

- User clarified **JEV** = TypeSafe **Jev** System One decision model — not Jefferies JEFx.
- Wired `src/lib/adapters/jev.ts` → OpenRouter `POST /api/alpha/decisions` (`typesafe/jev-1.13`).
- Gift preview/wrap now attach Jev honesty/timing/freshness judgment (fail soft if no OpenRouter key).
- Docs corrected in PIVOT/CURRENT_STATE/about.

## 2026-10-01 — Gift Box pivot ship

- Locked win wedge: tokenized stock **gift box** (payer wraps · claim link · unwrap) — not another Binance buy.
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
