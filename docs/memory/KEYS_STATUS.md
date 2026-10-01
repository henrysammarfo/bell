# BELL — KEYS STATUS (names only — never paste values)

| Env name | Purpose | Ready? |
|---|---|---|
| `DATABASE_URL` / Neon PG vars | Neon Postgres (Marketplace on Bell) | **Set on Vercel** |
| `NEON_AUTH_BASE_URL` / `VITE_NEON_AUTH_URL` | Managed Better Auth | **Set** |
| `NEON_AUTH_COOKIE_SECRET` | Server session_data cookie (≥32 chars) | **Set on Vercel** |
| `BELL_SESSION_SECRET` | httpOnly desk HMAC (≥16 chars) | **Set on Vercel** |
| `AGENTROUTER_API_KEY` | LLM via AgentRouter | **Set on Vercel** |
| `AGENTROUTER_USE_TOR` | Cloud WAF bypass (Cursor/GCP) | Local `1`; Vercel `0` (AI Gateway) |
| `BELL_LLM_RELAY_URL` | Optional clean-egress relay | Optional |
| `BELL_AI_GATEWAY_MODEL` / OIDC | Novel WAF bypass on Vercel | Model set; OIDC auto on Vercel |
| `BELL_LLM_MODEL` | AgentRouter default `deepseek-v4-flash` | Set |
| `TAVILY_API_KEY` / `TINYFISH_API_KEY` | Research | Operator-supplied locally |
| `BINANCE_WEB3_API_KEY` | Signed Trading/Transaction | **Set on Bell Vercel** (rotate — pasted in chat) |
| `BINANCE_WEB3_API_SECRET` | Request signing | **Set on Bell Vercel** (rotate — pasted in chat) |
| `OPENROUTER_API_KEY` / `BELL_JEV_API_KEY` | TypeSafe **Jev** Decisions API (gift second opinion) | **Needed** — not set yet |
| `BELL_JEV_MODEL` | Default `typesafe/jev-1.13` | Optional |
| `VENICE_API_KEY` | Optional LLM failover | Optional |
| Legacy `SUPABASE_*` | Unused when Neon Auth live | Optional |

Never commit values. Never put private keys in `VITE_*`.

**Ops note:** Cursor/cloud egress often gets Binance `451` geo eligibility on `/api/v1/swap/quote` + `/api/v1/transaction/simulate`. Keys are wired; live signed success needs allowed-region deploy egress (Vercel) or operator VPN.
