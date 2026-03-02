# Research: 005-24h-filter

## Decision 1 — Where to apply the filter

**Decision**: Apply in `useFeed.ts` after fetch, using a pure utility function from `src/utils/articleAge.ts`.

**Rationale**: Date filtering is a business rule ("what counts as fresh news"), not a fetch concern and not a render concern. Placing it in `useFeed.ts` means both `allArticles` (used by keyword search) and `articles` (the paginated slice) are always pre-filtered. No downstream component needs to know about the rule.

**Alternatives considered**:
- In `rssService.ts` / `fetchFeed()` — rejected because fetchFeed's responsibility is fetching and parsing, not applying freshness policies. Would also make the service harder to test in isolation.
- In `FeedContainer.tsx` at render time — rejected because it leaks a business rule into the UI layer and would leave stale articles in `allArticles` (affecting search results).

---

## Decision 2 — Parsing pubDate for comparison

**Decision**: Use `new Date(pubDate).getTime()` and treat `NaN` (invalid date) or missing string as "always show".

**Rationale**: `new Date()` handles RFC 2822 dates (used by RSS) and ISO 8601 natively in all modern browsers. `isNaN(date.getTime())` is the standard guard for unparseable strings. No external date library is needed — `date-fns` is already a dependency but is overkill for a simple epoch comparison.

**Alternatives considered**:
- `date-fns/parseISO` — not useful here because RSS dates are RFC 2822 not ISO 8601.
- External RSS date normaliser — unjustified dependency for a single comparison.

---

## Decision 3 — Threshold definition

**Decision**: `Date.now() - date.getTime() <= 24 * 60 * 60 * 1000` (rolling 86,400 second window). Articles where the difference is exactly 86,400,000 ms are included (`<=` not `<`).

**Rationale**: Matches spec FR-006 (rolling window, not calendar day) and the edge-case note ("strictly more than 24 hours old to be hidden"). Using a constant avoids magic numbers.

---

## Decision 4 — Empty-state message when all articles are filtered

**Decision**: When `status === 'success'` but filtered `allArticles.length === 0`, render a non-retryable paragraph: "No recent articles. Check back later." — not the existing `ErrorState` component (which implies a retry is useful).

**Rationale**: A successful fetch with zero recent articles is not an error state. Offering a "Tap to retry" button would be confusing — retrying the fetch will return the same stale articles. A simple informational message is the correct response.

**Alternatives considered**:
- Re-using `ErrorState` with no retry prop — `ErrorState` always renders a retry button by its current design; modifying it adds complexity for a one-off case.
- Showing a spinner indefinitely — wrong; the data is fresh and complete, just empty.

---

## Decision 5 — Auto-refresh interaction

**Decision**: The filter is applied inside `setAllArticles` whenever articles are set, including during auto-refresh. No separate refresh-time filter needed.

**Rationale**: Because `setAllArticles` always receives the full fetched array and immediately filters it, articles that age out between refreshes will be removed on the next refresh cycle (every 10 minutes). This is acceptable given the use case (news consumption, not real-time trading).
