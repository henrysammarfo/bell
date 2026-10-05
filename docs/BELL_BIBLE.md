# BELL — Extreme Win Bible (FINAL · BNB Hack: Tokenized Stocks) · EMPIRE

> **Deep:** [`docs/memory/`](memory/)  
> **Host:** BNB Chain + Binance Web3 Wallet · https://www.bnbchain.org/en/hackathons/tokenized-stocks  
> **Submit:** **11 Oct 2026 12:00 UTC** · judging 12–23 Oct · winners week of 26 Oct  
> **Assets:** **bStocks / Ondo** central (xStocks only if live on BSC)  
> **Network:** **BSC mainnet** · Transaction API dry-run first · small live $  
> **Specials chase:** Agentic Wallet / Skills **$2k** · Agent Studio **$2k**  
> **≠ FOLIO:** Solana honest desk · this is **session honesty on BSC**  
> **Eligibility:** Not US/CA/UK/JP/NL, and not Iran/Cuba/North Korea/Crimea/Donetsk/Luhansk — Accra OK if laws allow  

---

## Soft (plain — anyone)

**Wrap a tokenized stock as a gift. They unwrap the link — BELL won’t wrap it at a fake weekend price unless you say so.**

## Unique job

**Session-honest gift boxes for BSC tokenized stocks.**  
Not another Binance buy screen. Payer wraps; receiver claims. Organiser problem (weekend stale print) is enforced at wrap time — fail closed unless open or explicit weekend-gap.

Deep notes: [`docs/memory/PIVOT_GIFTBOX.md`](memory/PIVOT_GIFTBOX.md)

## 8-second

Friday: gift AAPL $20 → **Denied** (session closed). Monday: wrap → share claim link → friend unwraps into their wallet.

## Beachhead

EU/APAC non-restricted users buying Ondo/bStocks on BSC via Binance Wallet. Accra = build base.

## Pitch order

1. Gift box ritual (you pay · they unwrap) · 2. Weekend fake price pain at wrap · 3. RWA status APIs · 4. Quote/sim · 5. Claim link · 6. Agentic Wallet · 7. Honest DX · 8. **Jev** (TypeSafe) typed second opinion on wrap honesty  

**JEV ≠ JEF:** Jev is TypeSafe’s System One decision model (`typesafe/jev-1.13` / OpenRouter Decisions API) — not Jefferies, not an LLM. Hard gate still owns DENY.

Never lead FOLIO share-counts, PnL bots, or “another buy UI.”

## Scoring map

| Criterion | Weight | Hit |
|---|---:|---|
| Technical | 30% | RWA + Trading + Transaction sim + Wallet + Skills |
| Creativity | 25% | Fail-closed on the landing-page gap |
| DX Report | 25% | Human, specific, signed-auth + status codes |
| UX | 20% | Soft · red/green session · intentional gap toggle |

## Architecture

```
Intent (buy ticker)
  → RWA search (BSC 56) + underlying-market / status skill
  → if closed/halted/toxic gap → DENY + explain (no broadcast)
  → if ALLOW or gap-mode ON → Trading quote → Transaction simulate
  → Agentic Wallet / signed swap → small mainnet proof
  → optional Agent Studio persistent watcher
```

## Mandatory spine

RWA platforms/search/price/status · fail-closed gate · Transaction simulate · Trading API · Agentic Wallet + `binance-tokenized-securities-info` · DX report · public repo · deployed demo · BSC mainnet tx  

## Honesty

Not advice · geo · mainnet labeled · `referencePrice` field ≠ official NYSE (API doc) — use status + gap carefully · no fake fills · no PnL claims · never claim unhackable  

## Kill list

Chat-only buy · FOLIO clone · perps · dashboard-only · AI-generated DX fluff · silent mocks  

## Build

| Phase | Ship |
|---|---|
| 0 | Doctrine + memory + RWA status→DENY path |
| 1 | Simulate + small ALLOW buy (Ondo or bStock) |
| 2 | Agentic Wallet skill path · Agent Studio deploy |
| ≤ 11 Oct 12:00 | Video · DX report · submit forms |

## Pitch (15s)

Send someone a real tokenized stock as a gift box. BELL wraps it only when the session is honest — or you flip weekend-gap on purpose.

## Identity

Henry Sam Marfo · @henrysammarfo · jasonneil4040@gmail.com
