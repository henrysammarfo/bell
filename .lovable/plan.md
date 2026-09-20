# BELL — Complete Product Experience

## Goal
Build a polished BELL product and merch-ready identity using the supplied cinematic dark template language. The experience will lead with BELL’s core promise: tokenized-stock trades fail closed when the underlying market session is not honest.

## Brand and visual system
- Create a distinctive BELL symbol that reads at favicon, app-icon, and hoodie scale: a circular market-bell mark with a deliberate open/closed cut and a compact BELL wordmark.
- Use a black cinematic foundation, warm-white type, signal red for denied sessions, and restrained green for verified open sessions.
- Use the requested glass language, precise entrance choreography, premium Lucide icons, crisp borders, and tactile controls.
- Generate an original full-bleed still background plus a matching demo visual; preserve legibility with the requested vignette.
- Keep the landing screen focused and non-scrolling, while product pages use a consistent app shell.

## Pages and flows
1. **Home `/`** — cinematic BELL landing screen, session-status story, call to enter the desk, and demo preview.
2. **Desk `/desk`** — natural-language or structured buy intent, asset selection, amount, live/closed market signal, and explicit weekend-gap control.
3. **Simulation `/simulate`** — quote, reference-price timestamp, fees, route, safeguards, and a step-by-step transaction dry run.
4. **Review `/review`** — final allow/deny gate with reasons; denied orders cannot continue unless the user deliberately enables gap mode.
5. **Receipt `/receipt`** — small-mainnet-proof style receipt, transaction details, status timeline, and explorer affordance.
6. **Markets `/markets`** — searchable tokenized-stock catalogue with source, BSC availability, underlying-session status, spread, and freshness.
7. **Watchers `/watchers`** — persistent Agent Studio watcher concepts, notification state, and create/pause flows.
8. **Activity `/activity`** — simulated, denied, and broadcast activity with clear labels and no fake fills or PnL claims.
9. **DX Report `/dx-report`** — honest integration report covering status codes, signed authentication, gaps, and implementation evidence.
10. **About `/about`** — problem, architecture, safety model, BNB Chain context, and disclaimers.

## Interaction model
- Make the core demo functional in the browser with prefilled sample intents and deterministic state transitions.
- Friday/closed example defaults to DENIED and shows the stale-reference gap clearly.
- Enabling weekend-gap mode requires an explicit acknowledgement and changes the review state without disguising the risk.
- Monday/open example progresses through quote, simulation, review, and receipt.
- Wallet connection, watcher creation, filters, tabs, menus, and mobile navigation will behave as polished prototype interactions.
- All transaction data is clearly marked as demo/simulated unless it is a genuine mainnet record; no backend or real broadcast will be invented.

## Technical details
- Build with the existing TanStack Start structure and Tailwind v4 design tokens, not a standalone HTML file, because the selected scope requires full routes and flows.
- Use reusable brand, navigation, status, market, order, and transaction components.
- Add unique metadata for every public route.
- Verify desktop and mobile rendering, navigation, gating behavior, and current preview health.
