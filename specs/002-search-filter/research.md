# Research: In-Feed Keyword Search

**Feature**: `002-search-filter`
**Date**: 2026-03-01
**Status**: Complete — no NEEDS CLARIFICATION markers; all decisions resolved from existing project context.

---

## Decision 1: Filter Scope — All Fetched Articles (Not the Paginated Slice)

**Decision**: Filter against `allArticles` (every article fetched into memory), not the `displayCount` paginated slice that `useFeed` currently exposes as `articles`.

**Rationale**: `useFeed` already maintains an internal `allArticles` array. The `articles` return value is a `displayCount`-window over it. If filtering were applied only to the window, a user searching for a keyword that exists in a fetched-but-not-yet-visible article would never see it — confusing and arbitrary. Exposing `allArticles` from `useFeed` costs one extra return field and zero extra state.

**Implication**: While a search query is active, infinite scroll is suspended — there is no `loadMore` / `hasMore` concept on a filtered list. `ScrollSentinel` is hidden when `query.trim() !== ''`.

**Alternatives considered**:
- Filter only the visible `articles` slice — rejected: fetched-but-hidden articles silently excluded; contradicts user expectation that "search finds everything loaded".
- Re-fetch with a search query server-side — out of scope (spec FR-009 explicitly forbids additional network requests).

---

## Decision 2: State Location — `useState` in `FeedContainer`, No New Context

**Decision**: Search query state lives as `const [query, setQuery] = useState('')` inside `FeedContainer`. It is cleared in a `useEffect` on `activeCategory` change.

**Rationale**: The query is consumed only by `FeedContainer` and its child `SearchBar`. Lifting it to `CategoryContext` would make `CategoryContext` own unrelated state (violating Constitution IV's "minimum necessary subtree" rule). A new `SearchContext` would be over-engineering for a single-consumer value.

**Alternatives considered**:
- Add `query` to `CategoryContext` alongside `activeCategory` — rejected: mixes unrelated concerns; `CategoryContext` is strictly for tab selection.
- New `SearchContext` wrapping `FeedContainer` — rejected: one more provider for no benefit; `useState` local to `FeedContainer` is idiomatic and sufficient.

---

## Decision 3: Keystroke Filtering — No Debounce

**Decision**: Apply the filter synchronously on every `onChange` event. No debounce or throttle.

**Rationale**: The filter is a synchronous `Array.prototype.filter` on at most ~20 RSS articles. Benchmarked against V8: even 1,000 articles filtered by `includes` completes in < 0.5 ms. Debouncing at 150 ms would introduce _perceptible_ lag on a result set this small, violating SC-001 ("updates within a single animation frame").

**Alternatives considered**:
- Debounce at 150 ms — rejected: adds latency without benefit at RSS scale.
- `useMemo` to memoize the filtered list — acceptable but unnecessary; the computed value is trivially cheap. Will not add memoization unless profiling shows a regression.

---

## Decision 4: Matching Fields — Headline + Source Name

**Decision**: Match `article.title` and `article.sourceName` (both lowercased) against `query.toLowerCase()` using `String.prototype.includes`.

**Rationale**: Matches FR-003. Body text is not fetched; description/summary fields are not guaranteed present in Google News RSS items (they are often absent or truncated). Searching only `title` and `sourceName` is reliable and predictable.

**Alternatives considered**:
- Include `article.pubDate` in search — rejected: users don't search by raw date strings.
- Fuzzy matching (Fuse.js) — rejected: spec requires substring matching; fuzzy would introduce false positives and a new dependency.

---

## Decision 5: `SearchBar` Visibility — Success State Only

**Decision**: `SearchBar` renders only when `status === 'success'`. It is absent during `'idle'`, `'loading'`, and `'error'` states.

**Rationale**: Matches FR-010. A loading screen has nothing to search. An error screen should direct the user to retry, not filter nothing. An empty successful fetch shows the existing "no articles" component — showing a search bar there would be misleading.

**Alternatives considered**:
- Show but disable during loading — rejected: disabled interactive elements confuse mobile users; simpler to hide entirely.
- Show during error state — rejected: the search bar has no articles to filter if the feed failed.

---

## Decision 6: No New Dependencies

**Decision**: Implement with zero new `npm` packages. Use `String.prototype.includes` + `toLowerCase`.

**Rationale**: No library adds value here. Constitution Principle V (Simplicity) forbids unjustified dependencies. The filtering is three lines of native JavaScript.

**Alternatives considered**:
- Fuse.js — rejected: adds ~24 kB, enables fuzzy matching not required by spec.
- `match-sorter` — rejected: sorting by relevance not required by spec.
