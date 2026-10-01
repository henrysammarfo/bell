# BELL — Gift Box Pivot (locked)

> Updated: 2026-10-01 · Win concept for Tokenized Stocks hackathon

## Soft pitch (anyone)

**Wrap a real tokenized stock as a gift. They unwrap the link — BELL won’t wrap it at a fake weekend price unless you say so.**

## Why this wins (not “another buy”)

| Binance / wallet already does | BELL Gift Box does instead |
|---|---|
| Buy / swap tokenized stocks in Markets | **Gift composition** — payer ≠ receiver |
| Send tokens to address-book contacts | **Claim link** — share before they have a wallet book entry |
| 24/7 trading UI | **Session-honest wrap** — fail-closed on stale gap |
| Generic transfer | **Ritual unwrap** — note, ticker, session badge, receipt |

Inspiration (RH Chain peers like Givest / Wrapstocks / tagstock): gift metaphor.  
**Our wedge on BSC:** Binance RWA session gate + Agentic Wallet + claim link — not a Folio/RH clone.

## JEV / Jev note (not JEF)

**Jev** = TypeSafe System One decision model (`typesafe/jev-1.13` via OpenRouter Decisions API) — typed noul/choice/score, **not** an LLM and **not** Jefferies JEFx.

BELL uses Jev as a **second opinion** on gift wrap honesty (timing + freshness risk). Hard RWA session gate still owns ALLOW/DENY. Needs `OPENROUTER_API_KEY` (or `BELL_JEV_API_KEY`).

## User story (8s)

Friday: you pick AAPL + $20 + “congrats”. Session closed → **Denied** until Monday or gap-ack.  
Monday: wrap → share `/gift/claim/….` Friend opens → unwrap → stocks land (or honest pending if wallet not ready).

## Technical spine (hidden complexity)

1. Live RWA list/status/dynamic → session gate per wrap  
2. Trading quote + Transaction simulate (signed keys)  
3. Neon gift row + unguessable claim code  
4. Agentic Wallet swap (payer) → `wallet send` (claimer) when connected  
5. Mode badges · never invent tx hash · DX evidence  

## Product surfaces

| Route | Job |
|---|---|
| `/` | Brand + gift CTA (one composition) |
| `/gift` | Compose + wrap (auth) |
| `/gift/claim/$code` | Unwrap / claim (public) |
| `/desk` … `/receipt` | Keep as power / DX spine |

## Kill list (still)

Another Binance Markets clone · silent mock fills · “unhackable” · FOLIO share-counts  
