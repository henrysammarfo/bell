# AI trade briefs and persistent trader accounts

## What will be built
- Add a dedicated Trade Brief page where a trader enters a market symbol, chooses the underlying session state, and writes a thesis.
- Generate a concise, risk-aware brief with Lovable AI. The result will separate thesis, session risk, key invalidation conditions, and a clear non-advice boundary.
- Add email/password and Google account access, with account controls in the shared BELL navigation.
- Require sign-in for saving personal data while keeping the public BELL introduction available.
- Persist each trader’s watchlist, simulation results, activity history, generated trade briefs, and editable DX report entries across sessions.
- Replace prototype-only local state on the affected pages with saved user records and clear empty/loading/error states.

## User flow
1. A trader signs in or creates an account.
2. They create a trade brief from symbol, session state, and thesis.
3. The AI result appears with explicit session and uncertainty warnings, then saves to their history.
4. Watchers and simulations save automatically to that trader’s account.
5. Activity and DX Report show only that trader’s records and allow appropriate edits or deletion.

## Safety and privacy
- Every personal table will use row-level access rules so traders can only read and change their own records.
- AI requests run on the server; keys and prompts never enter the browser.
- The model will not invent live prices, execution status, fills, or personalized financial advice.
- Closed or halted sessions remain prominent and cannot be reframed as current market conditions.

## Technical details
- Use Lovable Cloud authentication and database storage.
- Add private tables for profiles, watchlist items, simulations, activity records, trade briefs, and DX report entries, each with timestamps and owner-only policies.
- Use a protected server function for AI generation with the default reasoning model through the AI Gateway Responses API.
- Keep the existing TanStack route structure, add `/auth` and `/brief`, and preserve route-specific metadata.
- Verify sign-up/sign-in UI, private persistence, AI generation, navigation, and responsive layouts.
