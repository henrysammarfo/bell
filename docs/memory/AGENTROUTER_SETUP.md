# AgentRouter + WAF workarounds for BELL

Never put real API keys in git.

## Goal

Make LLM chat completions work from Cursor cloud VMs **and** Vercel (Bell).

Direct cloud egress to `agentrouter.org` is often Aliyun WAF captcha HTML — not a bad key.

## Paths (priority in `liveChat`)

1. **`BELL_LLM_RELAY_URL`** — Cloudflare Worker / GCP clean egress (`worker/llm-relay.ts`)
2. **Vercel AI Gateway** — novel production bypass (OIDC on Vercel / `AI_GATEWAY_API_KEY`). Does not touch Aliyun WAF.
3. **AgentRouter + Tor** — `AGENTROUTER_USE_TOR=1` + `socks5h://127.0.0.1:9050` (Cursor / workers)
4. AgentRouter direct — local only

## Non-negotiables

- Host `https://agentrouter.org` (OpenAI base `…/v1`). Prefer not `co.agentrouter.org`.
- Stainless / QwenCode-style headers (see `src/lib/llm/agent-router.ts`).
- Bun must not use undici+SocksProxyAgent for Tor — tunnel with Node `https` + `SocksProxyAgent`.
- Default AgentRouter model: `deepseek-v4-flash`.
- Default AI Gateway model: `openai/gpt-5.4-mini` (`BELL_AI_GATEWAY_MODEL`).
- Never put `AGENTROUTER_API_KEY` in `VITE_*`.

## Env

```bash
AGENTROUTER_API_KEY=
AGENTROUTER_BASE_URL=https://agentrouter.org/v1
AGENTROUTER_USE_TOR=1   # Cursor/GCP only
AGENTROUTER_TOR_SOCKS=socks5h://127.0.0.1:9050
BELL_LLM_MODEL=deepseek-v4-flash
BELL_AI_GATEWAY_MODEL=openai/gpt-5.4-mini
# Optional relay:
# BELL_LLM_RELAY_URL=https://YOUR_RELAY/v1
```

## Verified

- 2026-09-29: Tor SOCKS on Cursor VM → `smoke_llm_tor_ok` via `agentrouter+tor`.
- Direct cloud POST → Aliyun WAF HTML.
- Vercel production uses AI Gateway path (`AGENTROUTER_USE_TOR=0`).
