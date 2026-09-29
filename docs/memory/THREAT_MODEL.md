# BELL — THREAT MODEL (honest)

BELL is **not** unhackable. Residual risk remains against skilled attackers, including well-resourced ones.

## Assets

- User session cookies / Supabase JWTs
- API keys in server env (AgentRouter, Binance Web3, Tavily, TinyFish)
- Gate integrity (user may be misled if we lie about session honesty)
- Future: wallet signatures for swaps

## Threats & mitigations

| Threat | Mitigation | Residual |
|---|---|---|
| Secret leak via git/chat | `.env` gitignored; rotate chat-pasted keys | Human paste risk |
| XSS → session theft | httpOnly cookies; no auth secrets in localStorage (prod) | Browser 0-days |
| Fake fills / wrong session | Fail-closed server gate; labeled modes | Oracle/API downtime |
| Client-only DENY bypass | Server re-check before simulate/broadcast | Misconfigured deploy |
| LLM overclaim / advice | Strict prompts; fail closed if LLM unavailable | Prompt injection |
| WAF blocks AgentRouter | Tor (workers) or clean-egress relay (Vercel) | Relay compromise |
| Supply-chain npm | Lockfile; minimize new deps | Always present |

## Explicit non-claims

Do **not** say: unhackable, NK-proof, military-grade absolute, zero bugs forever.  
Do say: fail-closed, residual risk documented, tests + BUGS when found.
