# BELL — WIN CHECKLIST

Submit target: **2026-10-11 12:00 UTC**

## Product wedge

- [x] Gift Box pivot locked (`PIVOT_GIFTBOX.md`) — not a Markets clone
- [x] Soft pitch: wrap / claim link / session honesty
- [x] `/gift` compose + `/gift/claim/$code` unwrap
- [x] Neon `gift_boxes` applied
- [x] **Jev** (TypeSafe) adapter on gift preview/wrap — needs TypeSafe key for live line
- [x] bStocks central in Markets + ticker lookup (live `type=3`)

## Infra / spine

- [x] Neon Marketplace on Bell Vercel + schema applied
- [x] Neon Managed Better Auth wired (no localStorage auth)
- [x] `BELL_SESSION_SECRET` + AgentRouter + AI Gateway WAF path
- [x] Binance Web3 API key on Bell Vercel
- [x] Live RWA status → DENY path (server) on wrap
- [x] Weekend-gap explicit acknowledgement
- [x] RWA TTL cache (efficient 24/7 reads)
- [~] Trading quote + Transaction simulate (signed; Cursor geo `451` — verify from Vercel)
- [ ] Small BSC mainnet proof tx (labeled) via gift fund/claim
- [~] Agentic Wallet / Skills path (`/wallet` + `baw-connect.sh`)
- [x] Agent Studio watcher (in-app live re-check)
- [x] DX report with real status codes + signed-auth notes
- [x] Deployed demo: https://bell-eta-five.vercel.app
- [ ] Public repo (must flip GitHub visibility before form submit)
- [ ] Demo video ≤ 4 min
- [ ] Submission form + DX form
- [x] Geo / not-advice disclaimers visible
- [x] `bun run test` 22/22 + `bun run build` green (2026-10-11)
- [x] No secrets in git / screenshots
- [x] Judge README (not Lovable template junk)

## Operator actions left (Henry)

1. `gh repo edit henrysammarfo/bell --visibility public`  
2. https://forms.gle/yToDUzaDMwWnq6R6A  
3. https://forms.gle/EUQ39xf54GHjC2ys5  
4. Record demo video (weekend DENY is live today)  
