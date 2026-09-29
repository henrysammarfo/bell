---
name: bell-agentrouter
description: Set up AgentRouter for BELL LLM (Tor on cloud VMs, relay on Vercel). Use when wiring trade briefs, DX assist, or smoke:llm. No OpenAI key required.
---

# BELL AgentRouter (VIGIL pattern)

1. Host: `https://agentrouter.org` only (not `co.agentrouter.org`).
2. Cloud VM / Cursor: `AGENTROUTER_USE_TOR=1` + Tor `socks5h://127.0.0.1:9050`.
3. Use Node `https` + `SocksProxyAgent` for Tor — not Bun undici.
4. Stainless / QwenCode headers on requests.
5. Default model: `deepseek-v4-flash`.
6. Vercel: set `BELL_LLM_RELAY_URL` (clean egress) — serverless cannot run Tor.
7. Never put `AGENTROUTER_API_KEY` in `VITE_*`.
8. Smoke: `bun run smoke:llm` → expect `smoke_llm_tor_ok` (or relay OK).
9. Fail closed if no Tor/relay path — never mock a brief.
