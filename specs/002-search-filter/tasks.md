---
description: "Task list for In-Feed Keyword Search"
---

# Tasks: In-Feed Keyword Search

**Input**: Design documents from `specs/002-search-filter/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | research.md ✅ | contracts/ ✅

**Tests**: Playwright tests included — the project has an established E2E suite (`tests/e2e/`) and the plan explicitly calls for `search.spec.ts`. Tests are added per user story after implementation.

**Organization**: Tasks are grouped by user story. US2 (clear) and US4 (tab reset) are implemented in the same components as US1 (filter) and have no separate implementation tasks — they are noted as co-implemented in Phase 2. US3 (no results) has its own render case and lives in Phase 3.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US1–US4)
- Paths relative to repo root; all source files under `src/`

---

## Phase 1: Foundational (Blocking Prerequisite)

**Purpose**: Expose the full fetched article array from `useFeed` so `FeedContainer` can filter
against all articles in memory (not just the current paginated window). This is the only
prerequisite for all user story work.

**⚠️ CRITICAL**: No user story work can begin until this task is complete.

- [X] T001 Expose `allArticles` in `useFeed.ts` — add `allArticles: NewsArticle[]` to the `UseFeedReturn` interface (after `articles`), then add `allArticles` to the return statement on the last line of `useFeed`: `return { articles: visibleArticles, allArticles, status, error, lastRefreshed, hasMore, loadMore, retry }`. The internal `allArticles` state variable is already present — this is a purely additive change exposing it to callers.

**Checkpoint**: Foundation ready — `useFeed` now exposes `allArticles`. User story implementation can begin.

---

## Phase 2: User Story 1 — Real-Time Keyword Filter (Priority: P1) 🎯 MVP

**Goal**: A search bar appears below the tab bar when articles are loaded. Typing any keyword
immediately filters the article list to show only cards whose headline or source contains
that keyword (case-insensitive). Deleting characters progressively restores more results.

**Note**: US2 (clear button) and US4 (tab reset) are **co-implemented** in this phase:
- US2 — the clear button is part of `SearchBar` (T002)
- US4 — the tab-reset `useEffect` is part of `FeedContainer` (T003)

No separate implementation phases are needed for US2 or US4.

**Independent Test**: Load app at 375px, wait for articles. Type a word in the search bar —
only matching cards remain. Delete characters — more cards reappear. Tap the × button —
all articles restore. Switch tabs — search bar empties.

### Implementation for User Story 1 (+ US2 + US4)

- [X] T002 [P] [US1] Create `SearchBar` in `src/components/SearchBar/SearchBar.tsx` — define `interface SearchBarProps { value: string; onChange: (value: string) => void; onClear: () => void; placeholder?: string }`; export `function SearchBar({ value, onChange, onClear, placeholder }: SearchBarProps): JSX.Element`; render a full-width `<div className="relative px-3 py-2">` containing: an `<input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? 'Search articles…'} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none focus:border-blue-400 focus:bg-white" />`; when `value.length > 0`, render `<button onClick={onClear} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label="Clear search">×</button>` inside the wrapper div; no internal state — fully controlled; entire input has minimum 44px effective touch height

- [X] T003 [US1] Update `src/components/FeedContainer/FeedContainer.tsx` to wire search:
  1. Add `useState` to the React import
  2. Destructure `allArticles` from `useFeed(activeCategory)` (alongside existing `articles, status, error, hasMore, loadMore, retry`)
  3. Add `const [query, setQuery] = useState<string>('')` after the hook call
  4. Add `useEffect(() => { setQuery('') }, [activeCategory])` directly after the existing scroll-reset `useEffect` (this handles US4 — tab switch reset)
  5. Add `import { SearchBar } from '../SearchBar/SearchBar'` to imports
  6. Derive filtered articles: `const normalizedQuery = query.trim().toLowerCase()` then `const filteredArticles = normalizedQuery ? allArticles.filter(a => a.title.toLowerCase().includes(normalizedQuery) || a.sourceName.toLowerCase().includes(normalizedQuery)) : articles`
  7. Replace `articles.map(...)` with `filteredArticles.map(...)`
  8. In the success branch (the `<div className="pb-4">` block), render `<SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />` as the first child, before the article list (this handles US2 — clear button)
  9. Change the `ScrollSentinel` render condition from `status === 'success'` to `status === 'success' && !normalizedQuery` — infinite scroll is suspended while a filter is active

**Checkpoint**: US1 + US2 + US4 complete. `npm run dev` → type in search bar → only matching
articles visible. × button clears the input. Switching tabs empties the search bar.

---

## Phase 3: User Story 3 — No Results State (Priority: P3)

**Goal**: When the active filter matches zero articles, display a "no results" message
instead of a blank list. Message disappears immediately when the query is edited to match
at least one article or cleared.

**Independent Test**: Type "zzzzzzzzz" into the search bar — a "No articles match" message
appears. Edit the query so it matches something — message disappears, articles reappear.

### Implementation for User Story 3

- [X] T004 [US3] Update `src/components/FeedContainer/FeedContainer.tsx` — in the success JSX block (the `<div className="pb-4">`), after rendering `<SearchBar>` and before `filteredArticles.map(...)`, add a conditional render: `{status === 'success' && normalizedQuery && filteredArticles.length === 0 && ( <p className="px-4 py-12 text-center text-sm text-gray-400">No articles match "{query.trim()}"</p> )}`. Wrap `filteredArticles.map(...)` and `ScrollSentinel` in `{filteredArticles.length > 0 && ( ... )}` so they are hidden when the no-results message is shown.

**Checkpoint**: US3 complete. Nonsense search query shows "No articles match…" message.
Editing or clearing the query restores the article list.

---

## Phase 4: Playwright Tests (All User Stories)

**Goal**: Add `tests/e2e/search.spec.ts` covering all acceptance scenarios from the spec.
Tests use `mockFeed` from `tests/helpers/mockRss.ts` with predictable article data to
enable reliable assertions.

- [X] T005 [US1] Create `tests/e2e/search.spec.ts` with the US1 `describe` block —
  Mock feed with 3 articles with distinct keywords (e.g. `{ title: 'React Hooks Deep Dive', source: 'Tech Insider', link: 'https://example.com/1' }`, `{ title: 'Cricket World Cup', source: 'Sports Weekly', link: 'https://example.com/2' }`, `{ title: 'Budget Analysis', source: 'Finance Daily', link: 'https://example.com/3' }`); `test.beforeEach` calls `mockFeed` then `page.goto('/')`;
  Include these tests:
  - `search bar is visible when articles are loaded` — `expect(page.getByPlaceholder('Search articles…')).toBeVisible()`
  - `typing filters articles by headline (case-insensitive)` — fill `'CRICKET'`, assert Cricket World Cup visible and others not visible
  - `typing filters articles by source name` — fill `'Finance'`, assert Budget Analysis visible and others not visible
  - `whitespace-only query shows all articles` — fill `'   '`, assert all 3 articles visible
  - `search bar is not shown on loading screen` — use `mockFeedError` and navigate, assert search bar not visible
  - `search bar is not shown on error screen` — same setup, assert placeholder absent

- [X] T006 [US2] Add US2 `describe` block to `tests/e2e/search.spec.ts` —
  Same `beforeEach` (3 distinct articles, `mockFeed`, `goto`);
  Include these tests:
  - `clear button (×) appears when input contains text` — fill `'cricket'`, assert button with `aria-label="Clear search"` is visible
  - `clear button is absent when input is empty` — assert `getByLabel('Clear search')` not visible on fresh load
  - `tapping clear restores full article list` — fill keyword, click clear button, assert all 3 articles visible
  - `manually deleting all characters restores full list` — fill keyword, clear with `triple-click + Backspace`, assert all 3 articles visible and clear button gone

- [X] T007 [US3] Add US3 `describe` block to `tests/e2e/search.spec.ts` —
  Same `beforeEach`;
  Include these tests:
  - `shows no-results message for unmatched query` — fill `'zzzzz'`, assert `getByText('No articles match', { exact: false })` visible, assert no article cards visible
  - `no-results message disappears when query is edited to match` — fill `'zzzzz'`, then clear and fill `'cricket'`, assert Cricket World Cup visible and no-results message absent
  - `clearing search from no-results state restores all articles` — fill `'zzzzz'`, click clear button, assert all 3 articles visible

- [X] T008 [US4] Add US4 `describe` block to `tests/e2e/search.spec.ts` —
  Same `beforeEach`;
  Include these tests:
  - `switching tabs clears the search query` — fill `'cricket'`, click `getByRole('tab', { name: 'Technology & AI' })`, assert `getByPlaceholder('Search articles…')` has empty value (`toHaveValue('')`)
  - `new tab's feed is shown unfiltered after tab switch` — fill keyword, switch tab, assert search input empty and mock articles for new tab are shown (or at least not filtered)
  - `switching back to original tab shows empty search` — fill keyword on Top Stories, switch to Tech, switch back, assert search bar empty

**Checkpoint**: Run `npm test`. All 4 new `describe` blocks in `search.spec.ts` pass alongside the existing 24 tests (total ≥ 24 + new count).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript compliance, layout verification, and final validation.

- [X] T009 [P] TypeScript strict compliance — run `npx tsc --noEmit`; resolve all type errors; verify `SearchBar.tsx` has explicit return type `JSX.Element`, `onChange` and `onClear` props are typed correctly, and no `any` appears in modified files
- [X] T010 [P] Mobile layout audit at 375px — open DevTools device toolbar at iPhone 14 (390×844); verify: search bar has no horizontal overflow, input touch target is ≥ 44px, × button is reachable and doesn't overlap text, "No articles match" message wraps gracefully, no scrollbar appears on the body; fix any Tailwind classes causing layout issues
- [X] T011 Run quickstart.md validation — work through each scenario in `specs/002-search-filter/quickstart.md` → `Validate the Setup` checklist; check off each passing item

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (US1 + US2 + US4)**: Requires Phase 1 complete (needs `allArticles` from `useFeed`)
- **Phase 3 (US3)**: Requires Phase 2 complete (`filteredArticles` must exist in `FeedContainer`)
- **Phase 4 (Tests)**: Requires Phase 2 + Phase 3 complete — tests validate all behaviour
- **Phase 5 (Polish)**: Requires all phases complete

### User Story Dependencies

- **US1 (P1)**: Phase 1 done → standalone MVP
- **US2 (P2)**: Co-implemented in US1 (Phase 2) — no extra dependencies
- **US3 (P3)**: US1 done (Phase 2) → extends same `FeedContainer`
- **US4 (P4)**: Co-implemented in US1 (Phase 2) — no extra dependencies

### Within Phase 2

- T002 (`SearchBar`) and Phase 1 (T001) are independent — T002 can run in parallel with T001
- T003 (`FeedContainer`) requires T001 (needs `allArticles`) **and** T002 (`SearchBar` must exist to import)

### Parallel Opportunities

```
T001 (useFeed) ──────────────────┐
T002 (SearchBar) [P] can start   ├── both done → T003 (FeedContainer) → T004 (no-results)
immediately alongside T001       ┘                                      → T005→T006→T007→T008 (tests, sequential same file)
```

---

## Implementation Strategy

### MVP First (US1 only — T001, T002, T003)

1. Complete Phase 1: T001 (expose `allArticles`)
2. Complete Phase 2: T002 (SearchBar) + T003 (FeedContainer filter wiring)
3. **STOP and validate**: `npm run dev`, open at 375px, type in search bar — articles filter live
4. Verify tab switch clears search and clear button works

### Incremental Delivery

| Milestone | Tasks | Deliverable |
|-----------|-------|-------------|
| MVP | T001–T003 | Working real-time filter + clear button + tab reset |
| + No Results | T004 | "No articles match" state instead of blank screen |
| + Tests | T005–T008 | Full Playwright coverage for all 4 user stories |
| + Polish | T009–T011 | Production-ready, TypeScript clean |

---

## Notes

- `[P]` tasks = different files, no incomplete dependencies — safe to parallelise
- `useFeed.ts` change (T001) is additive only — existing callers are unaffected
- `FeedContainer.tsx` is modified in both Phase 2 (T003) and Phase 3 (T004) — these are sequential
- The `normalizedQuery` derivation (`query.trim().toLowerCase()`) is the single source of truth for "is a filter active"; reuse it for both the filter logic and the ScrollSentinel/no-results conditions
- When `query` is active, `filteredArticles` is derived from `allArticles` (bypasses `displayCount`) — infinite scroll is meaningless for a small filtered set and is intentionally suspended
- Playwright tests: React Strict Mode double-invokes `useEffect` in dev — `mockFeed` sets up a persistent route handler so all calls are served correctly; no special `callCount` guard needed here (unlike error tests that need `callCount <= 2`)
