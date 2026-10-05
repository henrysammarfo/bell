# BELL — Free Jev + Agentic Wallet (operator steps)

> Updated: 2026-10-01

## 1) Jev — free path (no card purchase required)

**Fact:** Jev itself is usage-priced (~$0.042 / 1M input tokens). There is **no unlimited free tier**.  
**Free start:** TypeSafe console signup credit (~**$5**) ≈ enough for a huge demo run.

### Recommended (free credit)

1. Open [console.typesafe.ai](https://console.typesafe.ai/login) → sign up / sign in  
2. Create an API key under **API Keys**  
3. In Vercel → project **bell** → Settings → Environment Variables:  
   - `TYPESAFE_API_KEY` = your key (Production + Preview)  
4. Redeploy preview  
5. On `/gift` → **Check session** — you should see `Jev · honest …` (provider TypeSafe)

Optional alias: `BELL_TYPESAFE_API_KEY`.

### What Vercel MCP shows today (Bell)

Already present: Neon, AgentRouter, Binance Web3, `BELL_AI_GATEWAY_MODEL`, session secrets.  
**Missing for Jev:** `TYPESAFE_API_KEY` / `OPENROUTER_API_KEY` — **not set**.

### Other paths (not free / not preferred)

| Path | Free? | Notes |
|---|---|---|
| TypeSafe console `$5` credit | **Yes (signup credit)** | Preferred — BELL tries this first |
| Vercel AI Gateway `typesafe-ai/jev` | Maybe | Uses team AI Gateway credits; Jev may not be in “free models” subset |
| OpenRouter `typesafe/jev-1.13` | **No** | Needs prepaid credits; 402 if empty |

BELL order: **TypeSafe → Vercel AI Gateway → OpenRouter**. Hard gate still owns DENY if Jev is offline.

---

## 2) Agentic Wallet — how you get it + pair

Agentic Wallet is Binance’s CLI/session for signed swaps/sends (`baw`). Keys alone ≠ broadcast.

### Get it

1. Install **Binance App** (mobile) with Agentic Wallet / Web3 support for your region  
2. On your laptop (where BELL can run `baw`):

```bash
bash scripts/baw-connect.sh
```

That script installs `@binance/agentic-wallet@1.10.0` if needed, prints a **pairing URL + code**, then waits for phone confirm.

### Pair (important)

1. Run `bash scripts/baw-connect.sh`  
2. Open the printed URL on phone **or** enter the pairing code in Binance  
3. **Codes expire fast** — if app says “wrong”, re-run the script for a fresh code  
4. Confirm in the app until `baw wallet status --json` shows `CONNECTED`  
5. In BELL open `/wallet` → **Refresh status** → should show connected + address  
6. On `/gift`, optionally enable **Fund now via Agentic Wallet**, wrap, then share claim link  

### Proof tx (hackathon)

Small labeled BSC mainnet wrap/fund (or claim send) with real `0x…` hash — never invent one.  
Cursor cloud VMs often cannot hold a persistent phone-paired session; pair on the machine that will broadcast (or your always-on host with `baw`).

---

## 3) After both are live

Demo path: weekend DENY → Monday ALLOW + Jev honest → wrap → claim link → unwrap.  
Submit deadline: **2026-10-11 12:00 UTC**.
