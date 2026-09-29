# BELL — KEYS STATUS (names only — never paste values)

| Env name | Purpose | Ready? |
|---|---|---|
| `DATABASE_URL` / Neon PG vars | Neon Postgres (Marketplace on Bell) | **Set on Vercel** |
| `NEON_AUTH_BASE_URL` / `VITE_NEON_AUTH_URL` | Managed Better Auth | **Set** (live URL, not provisioning) |
| `NEON_AUTH_COOKIE_SECRET` | Server session_data cookie (≥32 chars) | **Set on Vercel** |
| `BELL_SESSION_SECRET` | httpOnly desk HMAC (≥16 chars) | **Set on Vercel** |
| `AGENTROUTER_API_KEY` | LLM via AgentRouter | **Set on Vercel** |
| `AGENTROUTER_USE_TOR` | Cloud WAF bypass (Cursor/GCP) | Local `1`; Vercel `0` (use AI Gateway) |
| `BELL_LLM_RELAY_URL` | Optional clean-egress relay | Optional |
| `BELL_AI_GATEWAY_MODEL` / OIDC | Novel WAF bypass on Vercel | Model set; OIDC auto on Vercel |
| `BELL_LLM_MODEL` | AgentRouter default `deepseek-v4-flash` | Set |
| `TAVILY_API_KEY` / `TINYFISH_API_KEY` | Research | Operator-supplied locally |
| `BINANCE_WEB3_API_KEY` | Signed Trading/Transaction | **Still needed** |
| `BINANCE_WEB3_API_SECRET` | Request signing | **Still needed** |
| `VENICE_API_KEY` | Optional LLM failover | Optional |
| Legacy `SUPABASE_*` | Cut over — unused when Neon Auth live | Keep optional |

Never commit values. Never put private keys in `VITE_*`.
