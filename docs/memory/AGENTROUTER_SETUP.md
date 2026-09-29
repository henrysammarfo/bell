# AgentRouter setup for BELL (VIGIL-aligned)

Never put real API keys in git.

## Goal

Make AgentRouter return JSON chat completions from cloud VMs and Vercel.

Direct cloud egress to `agentrouter.org` is often Aliyun WAF captcha HTML — not a bad key.
Fix = Tor SOCKS (Cursor VM / workers) or clean-egress relay (Vercel).

## Non-negotiables

- Host `https://agentrouter.org` (OpenAI base `…/v1`). Prefer not `co.agentrouter.org`.
- Stainless / QwenCode-style headers (see `src/lib/llm/agent-router.ts`).
- Cloud IPs: `AGENTROUTER_USE_TOR=1` + Tor `socks5h://127.0.0.1:9050`.
- Bun must not use undici+SocksProxyAgent for Tor — tunnel with Node `https` + `SocksProxyAgent`.
- Default model: `deepseek-v4-flash`.
- Never put `AGENTROUTER_API_KEY` in `VITE_*`.

## Env

```bash
AGENTROUTER_API_KEY=
AGENTROUTER_BASE_URL=https://agentrouter.org/v1
AGENTROUTER_USE_TOR=1
AGENTROUTER_TOR_SOCKS=socks5h://127.0.0.1:9050
BELL_LLM_MODEL=deepseek-v4-flash
# Vercel:
# BELL_LLM_RELAY_URL=https://YOUR_RELAY/v1
# BELL_LLM_RELAY_KEY=
```

## Path A — Cursor / local Tor

```bash
sudo apt-get update && sudo apt-get install -y tor
bash scripts/tor-start.sh
export AGENTROUTER_USE_TOR=1
bun run smoke:llm   # expect smoke_llm_tor_ok
```

## Path C — Vercel

Deploy `worker/llm-relay.ts` on Cloudflare Workers; set `BELL_LLM_RELAY_URL`.
Serverless cannot run Tor.
