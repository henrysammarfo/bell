# BELL — Submission pack (lock 2026-10-11 12:00 UTC)

## Forms (do these now)

1. **Project submission:** https://forms.gle/yToDUzaDMwWnq6R6A  
2. **DX report form:** https://forms.gle/EUQ39xf54GHjC2ys5  
3. Hack page: https://www.bnbchain.org/en/hackathons/tokenized-stocks  

## Paste-ready answers

| Field | Value |
|---|---|
| Project name | **BELL** |
| One-liner | Wrap a tokenized stock as a gift. They unwrap the link — BELL won’t wrap a fake weekend price unless you say so. |
| Repo | https://github.com/henrysammarfo/bell (**must be public**) |
| Deployed demo | https://bell-eta-five.vercel.app |
| Central asset | **bStocks** (primary) + Ondo on BSC mainnet |
| Video | ≤4 min: home → gift DENY on weekend → gap-ack wrap → claim link unwrap → desk/DX |

## Demo script (~3 min)

1. Home: gift pitch + Binance black/yellow  
2. Markets: show bStocks (`NVDAB` etc.) live  
3. Gift: session check → **DENY** while `marketStatus: closed` (weekend)  
4. Toggle weekend-gap + ack → wrap → copy claim URL  
5. Incognito claim page → paste BSC address → honest claim (pending if wallet unpaired)  
6. `/dx-report` → real HTTP/status + signed-auth notes  
7. `/wallet` → Agentic Wallet pair instructions  

## DX report bullets (honest)

- RWA public list `type=3` = bStocks (~87 BSC); skills-hub “type=1 only” was stale vs live API  
- Market status AI returns `MARKET_CLOSED` / nextOpen — gate DENY without gap-ack  
- Dynamic V2 path under `/bapi/defi/v2/.../dynamic/ai`  
- Signed quote/simulate: HMAC on `web3.binance.com` — Cursor egress often HTTP **451** geo; Vercel deploy is the honest path  
- Never invent tx hashes; claim records pending until `baw` send finishes  
- Auth: Neon Managed Better Auth + httpOnly desk session — no production secrets in localStorage  
- TTL cache: list 10m / status 45s / dynamic 20s to stay fresh without hammering free public APIs  

## Still operator-owned before lock

- [ ] Make GitHub repo **public**  
- [ ] Submit both Google forms  
- [ ] Record ≤4 min demo video + link  
- [ ] Optional: pair Agentic Wallet for a small mainnet claim tx  
- [ ] Optional: `TYPESAFE_API_KEY` on Vercel for live Jev line  
