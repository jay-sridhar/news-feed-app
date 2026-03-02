# Tasks: 24-Hour News Filter (005-24h-filter)

**Input**: Design documents from `/specs/005-24h-filter/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/component-props.md ✓, quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in all task descriptions

---

## Phase 1: Setup

**Purpose**: Add the freshness constant and utility that all other tasks depend on.

- [X] T001 Add `export const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000` to `src/constants/feed.ts`
- [X] T002 Create `src/utils/articleAge.ts` — export `FRESHNESS_WINDOW_MS` (re-export from constants) and `isRecent(pubDate: string): boolean`: return `true` if `pubDate` is empty/blank or `isNaN(new Date(pubDate).getTime())`; return `true` if `Date.now() - new Date(pubDate).getTime() <= FRESHNESS_WINDOW_MS`; return `false` otherwise

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the test helper so freshness tests can inject articles with controlled pubDates.

**⚠️ CRITICAL**: Test tasks in Phase 3 depend on this helper change.

- [X] T003 Update `makeArticles` in `tests/helpers/mockRss.ts` — add optional third argument `pubDateOverride?: string`; when provided, set `pubDate: pubDateOverride` on every generated article; existing call sites with 1–2 arguments are unaffected

**Checkpoint**: Utility + helper ready — Phase 3 and Phase 4 can proceed.

---

## Phase 3: User Story 1 — Fresh Feed Only (Priority: P1) 🎯 MVP

**Goal**: Articles older than 24 hours are hidden from all category tabs; zero stale articles visible.

**Independent Test**: Load the feed with a mix of recent and 48-hour-old articles — only recent ones appear.

- [X] T004 [US1] Modify `src/hooks/useFeed.ts` — import `isRecent` from `src/utils/articleAge.ts`; in `doFetch`, on initial fetch change `setAllArticles(fetched)` to `setAllArticles(fetched.filter(a => isRecent(a.pubDate)))`; on refresh, add `.filter(a => isRecent(a.pubDate))` to the `newItems` computation before the dedup filter
- [X] T005 [US1] Modify `src/components/FeedContainer/FeedContainer.tsx` — after the existing `if (status === 'error')` guard, add: `if (status === 'success' && allArticles.length === 0) { return <p className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No recent articles. Check back later.</p> }`
- [X] T006 [US1] Write Playwright tests for US1 in `tests/e2e/freshness.spec.ts`:
  - Test: mix of recent (2h old) + stale (48h old) articles → only recent ones visible, stale article title not present
  - Test: all articles 48h old → "No recent articles. Check back later." message shown
  - Test: filter applies after tab switch (switch to Tech tab with all-stale articles → shows empty state)

**Checkpoint**: US1 done — feed shows only last-24h articles; empty state shown when all are stale.

---

## Phase 4: User Story 2 — Graceful Missing Dates (Priority: P2)

**Goal**: Articles with missing or malformed pubDate are never filtered out.

**Independent Test**: Load a feed where some articles have no pubDate or garbled dates — all appear in the list.

- [X] T007 [US2] Write Playwright tests for US2 in `tests/e2e/freshness.spec.ts`:
  - Test: articles with empty `pubDate` (`''`) appear in the feed alongside recent articles
  - Test: articles with malformed `pubDate` (e.g. `'not-a-date'`) appear in the feed
  - Test: all articles have empty pubDate → all shown, feed is not empty

**Checkpoint**: US1 + US2 done — fresh articles shown, bad-date articles never suppressed.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T008 [P] Run TypeScript type-check — `npx tsc --noEmit` — zero errors required
- [X] T009 [P] Run full Playwright test suite — `npm test` — all tests pass (existing 73 + new freshness tests)

---

## Dependencies

```
T001 (FRESHNESS_WINDOW_MS constant) ──→ T002 (isRecent utility)
T003 (makeArticles helper)

T002 ──→ T004 (useFeed filter)
T004 ──→ T005 (FeedContainer empty state)
T003 ──→ T006 (US1 tests)
T005 + T006 → T007 (US2 tests — same file)

T006 + T007 → T009 (full suite)
T008 [P] → T009
```

## Parallel Execution

**T001 and T003 can run in parallel** (different files, no dependencies).
**T008 and T009** — T008 must complete before T009.

---

## Implementation Strategy

**MVP** — US1 alone (fresh feed filter):
1. T001 → T002: Constant + utility
2. T003: Helper update
3. T004 → T005: useFeed filter + empty state
4. T006: US1 tests pass
5. → Ship: feed shows only last-24h articles

**Full feature** — add US2:
- T007: Missing-date tests (US2 is already implemented by T002's `isNaN` guard — just needs test coverage)

**Total tasks**: 9
**By phase**: Setup 2 + Foundation 1 + US1 3 + US2 1 + Polish 2
**Parallel opportunities**: T001 ∥ T003, T008 ∥ (run before T009)
