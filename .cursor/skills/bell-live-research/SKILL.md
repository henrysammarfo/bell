---
name: bell-live-research
description: Fact-check BELL claims with Tavily then TinyFish. Use when verifying hackathon dates, RWA APIs, eligibility, or before README/DX claims.
---

# BELL live research

1. Prefer **Tavily** search (`TAVILY_API_KEY`).
2. If Tavily fails/quota: **TinyFish Search** `GET https://api.search.tinyfish.ai?query=…` with `X-API-Key`.
3. For page extraction: TinyFish Fetch `POST https://api.fetch.tinyfish.ai` body `{ "urls": [...], "format": "markdown", "ttl": 0 }`.
4. Write verified claims into `docs/memory/FACT_CHECK.md` with **date + URL**.
5. Unverified → say so. Never invent deadlines, prizes, or API behavior.
