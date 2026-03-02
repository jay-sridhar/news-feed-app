# Quickstart: In-Feed Keyword Search

**Feature**: `002-search-filter`
**Date**: 2026-03-01

---

## Pre-requisites

- App running: `npm run dev` → http://localhost:5173
- Open Chrome DevTools, set device to iPhone 14 (390 × 844) or any 375 px viewport
- Disable network throttling (search is client-side; latency is irrelevant)

---

## Scenario 1: Real-Time Filter (US1 — P1)

1. Open the app. Wait for Top Stories to load (cards visible).
2. The **search bar** appears below the tab bar, above the first card.
3. Type `"tech"` into the search bar.
4. **Expected**: Only cards whose headline or source contains "tech" (case-insensitive) remain visible. All others disappear immediately — no button press required.
5. Delete one character (now `"tec"`). **Expected**: list updates again (may show more cards).
6. Type `"TECH"` (uppercase). **Expected**: same results as lowercase `"tech"`.

**Failure indicators**: No search bar visible; articles don't filter; list updates only after pressing Enter.

---

## Scenario 2: Clear Button (US2 — P2)

1. Type any keyword (e.g. `"india"`) so the list is filtered.
2. **Expected**: A **×** (clear) button appears inside the search input on the right.
3. Tap the × button.
4. **Expected**: Input empties; × button disappears; full (paginated) article list restores instantly — no loading state.
5. Manually type a keyword, then delete all characters one by one.
6. **Expected**: × button disappears when input becomes empty; full list restores.

**Failure indicators**: No × button; clearing causes a spinner; full list doesn't restore.

---

## Scenario 3: No Results State (US3 — P3)

1. Type `"zzzzzzzzz"` (guaranteed no match).
2. **Expected**: Article list is replaced by a **"No articles match your search"** message (or equivalent). No blank screen.
3. Edit the query to something that will match (e.g. delete back to `"z"`).
4. **Expected**: Article list reappears immediately with matching cards.
5. Tap × to clear.
6. **Expected**: Full article list restores.

**Failure indicators**: Blank screen instead of "no results" message; app crashes.

---

## Scenario 4: Tab Switch Resets Search (US4 — P4)

1. On Top Stories, type `"sport"` into the search bar (filters the list).
2. Tap the **Technology & AI** tab.
3. **Expected**: Search bar is **empty**; Technology & AI articles load and are shown **unfiltered**.
4. Confirm there is no lingering filter from the previous tab.
5. Type a query on the new tab, then tap back to **Top Stories**.
6. **Expected**: Top Stories loads with an empty search bar.

**Failure indicators**: Query carries over to the new tab; new tab articles are pre-filtered.

---

## Scenario 5: Edge Cases

### Whitespace-only query
1. Press Space a few times in the search bar.
2. **Expected**: Article list shows all articles (whitespace = no filter); × button may or may not appear (implementation may trim before showing it — either is acceptable).

### Search during auto-refresh
1. Set `REFRESH_INTERVAL_MS = 10_000` temporarily in `src/constants/feed.ts`.
2. Type a query. Wait 10 seconds.
3. **Expected**: Refresh completes silently; new articles (if any) that match the query appear; those that don't are still hidden.
4. Restore `REFRESH_INTERVAL_MS = 10 * 60 * 1000` afterwards.

---

## Validate the Setup

Run through each scenario above. Check off when passing:

- [ ] Search bar appears below tab bar when articles are loaded
- [ ] Filtering is instant (no lag) on every keystroke
- [ ] Matching is case-insensitive
- [ ] Headline and source name are both matched
- [ ] × button appears only when input is non-empty
- [ ] × button clears input and restores full list instantly
- [ ] "No results" message shows when query has no matches
- [ ] Switching tabs clears the search query
- [ ] Search bar is absent on the loading spinner screen
- [ ] Search bar is absent on the error/retry screen
- [ ] No horizontal scroll or layout overflow at 375 px with the search bar visible

---

## Running the E2E Tests

```bash
npm test                    # run all Playwright tests (includes search.spec.ts)
npm run test:ui             # interactive mode — watch individual tests
npm run test:headed         # see browser window during test run
```

Test file: `tests/e2e/search.spec.ts`
