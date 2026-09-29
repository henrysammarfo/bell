# BELL — KEYS STATUS (names only — never paste values)

| Env name | Purpose | Ready? |
|---|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Auth + DB | Present in Lovable env |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_*` | Client publishable | Present |
| `LOVABLE_API_KEY` | Legacy AI gateway | Optional if AgentRouter works |
| `AGENTROUTER_API_KEY` | LLM (no OpenAI) | Operator-supplied (chat — rotate) |
| `AGENTROUTER_USE_TOR` | Cloud WAF bypass | Set `1` on Cursor/GCP |
| `AGENTROUTER_TOR_SOCKS` | Default `socks5h://127.0.0.1:9050` | With Tor |
| `BELL_LLM_RELAY_URL` | Vercel clean egress | Optional |
| `BELL_LLM_MODEL` | Default `deepseek-v4-flash` | Recommended |
| `TAVILY_API_KEY` | Research | Operator-supplied |
| `TINYFISH_API_KEY` | Research (`X-API-Key`) | Operator-supplied |
| `BELL_SESSION_SECRET` | httpOnly session HMAC (≥16 chars) | Generate for prod |
| `BINANCE_WEB3_API_KEY` | Signed Trading/Transaction | **Still needed** |
| `BINANCE_WEB3_API_SECRET` | Request signing | **Still needed** |
| `VENICE_API_KEY` | Optional LLM failover | Optional |

Never commit values. Never put private keys in `VITE_*`.
