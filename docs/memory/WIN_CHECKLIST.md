# BELL — WIN CHECKLIST

Submit target: **2026-10-11 12:00 UTC**

## Product wedge

- [x] Gift Box pivot locked (`PIVOT_GIFTBOX.md`) — not a Markets clone
- [x] Soft pitch: wrap / claim link / session honesty
- [x] `/gift` compose + `/gift/claim/$code` unwrap
- [x] Neon `gift_boxes` applied
- [x] **Jev** (TypeSafe) adapter on gift preview/wrap — needs OpenRouter key for live

## Infra / spine

- [x] Neon Marketplace on Bell Vercel + schema applied
- [x] Neon Managed Better Auth wired (no localStorage auth)
- [x] `BELL_SESSION_SECRET` + AgentRouter + AI Gateway WAF path
- [x] Register + Binance Web3 API key (on Bell Vercel; rotate after chat paste)
- [x] Live RWA status → DENY path (server) on wrap
- [x] Weekend-gap explicit acknowledgement
- [~] Trading quote + Transaction simulate (signed; Cursor geo `451` — verify from Vercel)
- [ ] Small BSC mainnet proof tx (labeled) via gift fund/claim
- [~] Agentic Wallet / Skills path (`/wallet` + `baw-connect.sh`)
- [x] Agent Studio watcher (in-app live re-check)
- [x] DX report with real status codes + signed-auth notes
- [ ] Public repo + deployed demo link
- [ ] Demo video ≤ 4 min (gift wrap → deny weekend → Monday wrap → unwrap)
- [ ] Submission form + DX form
- [x] Geo / not-advice disclaimers visible
- [x] `bun run test` 19/19 + `bun run build` green after gift ship
- [x] No secrets in git / screenshots
