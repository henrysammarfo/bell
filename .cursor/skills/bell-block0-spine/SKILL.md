---
name: bell-block0-spine
description: Build BELL Block 0 live spine — RWA status, fail-closed gate, Trading quote, Transaction simulate on BSC. Use when wiring the desk truth path or replacing demo fixtures.
---

# BELL Block 0 spine

1. Read `docs/memory/CURRENT_STATE.md` + `docs/BELL_BIBLE.md`.
2. Implement/verify adapters under `src/lib/adapters/`:
   - `rwa-list.ts` — BSC `chainId=56` Ondo/bStocks
   - `rwa-market-status.ts` / `rwa-asset-status.ts`
   - `rwa-dynamic.ts` — on-chain vs reference + gap
   - `session-gate.ts` — DENY unless ALLOW or explicit gap mode
3. Wire desk / markets / review / simulate to **server functions** — no hardcoded prices as truth.
4. Badge every panel with mode (`mainnet-read` | `simulate` | `unavailable`).
5. Add vitest for gap math + gate matrix.
6. Log live vs prior claims in `docs/memory/FACT_CHECK.md`.
