---
description: "Task list for NewsFlow — Categorized News Feed"
---

# Tasks: NewsFlow — Categorized News Feed

**Input**: Design documents from `specs/001-newsflow-feed/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | research.md ✅ | contracts/ ✅

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks grouped by user story. Each story is independently implementable
and testable. Stories build on foundation; US3 and US4 extend `useFeed.ts` incrementally.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (touches different files, no blockers)
- **[Story]**: Which user story (US1–US4)
- Paths relative to repo root; all source files under `src/`

---

## Phase 1: Setup

**Purpose**: Scaffold the Vite + React + TypeScript project and wire Tailwind, Vite proxy,
and Vercel config. No application logic yet.

- [X] T001 Scaffold Vite+React+TS project at repo root: run `npm create vite@latest . -- --template react-ts` and accept overwrite prompts — generates `index.html`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `package.json`
- [X] T002 Install all runtime and dev dependencies: `npm install`, then `npm install rss-parser date-fns`, then `npm install -D tailwindcss postcss autoprefixer` and `npx tailwindcss init -p`
- [X] T003 [P] Configure Tailwind CSS — update `tailwind.config.js` content paths to `['./index.html','./src/**/*.{ts,tsx}']`; replace `src/index.css` contents with `@tailwind base; @tailwind components; @tailwind utilities;`
- [X] T004 [P] Enforce TypeScript strict mode — update `tsconfig.json` to set `"strict": true`, `"target": "ES2020"`, `"lib": ["ES2020","DOM","DOM.Iterable"]`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`, `"noEmit": true`
- [X] T005 [P] Configure Vite dev proxy — update `vite.config.ts` to add `server.proxy` entry: `/allorigins` → `https://api.allorigins.win` with `changeOrigin: true` and `rewrite: (path) => path.replace(/^\/allorigins/, '')`
- [X] T006 [P] Create Vercel SPA fallback — create `vercel.json` at repo root: `{"rewrites":[{"source":"/(.*)","destination":"/"}]}`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, constants, services, and context that every user story depends on.
No UI yet — this phase produces the data and logic layer.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Create all shared TypeScript interfaces in `src/types/index.ts` — define `CategoryId` union (`'top' | 'tech' | 'tamilnadu' | 'india' | 'sports'`), `Category`, `NewsArticle`, `FeedStatus` union (`'idle' | 'loading' | 'success' | 'error'`), `FeedState`, `CategoryContextValue` as documented in `data-model.md`
- [X] T008 [P] Create category constants in `src/constants/categories.ts` — export `CATEGORIES: Category[]` array with all 5 entries (id, label, feedUrl, order) using the exact Google News RSS URLs from `plan.md`
- [X] T009 [P] Create feed constants in `src/constants/feed.ts` — export `PAGE_SIZE = 10`, `REFRESH_INTERVAL_MS = 10 * 60 * 1000`, `ALLORIGINS_BASE` using `import.meta.env.DEV ? '/allorigins' : 'https://api.allorigins.win'`
- [X] T010 Implement RSS service in `src/services/rssService.ts` — implement `buildProxyUrl(rssUrl: string): string` (encodes and prepends ALLORIGINS_BASE), `parseRssItem(item, categoryId): NewsArticle` (extracts title/link/pubDate/sourceName with all fallbacks from `data-model.md`), `fetchFeed(category: Category, signal: AbortSignal): Promise<NewsArticle[]>` (fetches allorigins endpoint, extracts `contents`, calls `parser.parseString(contents)` with custom `source` field config, returns mapped articles); configure `new Parser({ customFields: { item: [['source','source',{keepArray:false}]] } })`
- [X] T011 [P] Implement relative time utility in `src/utils/relativeTime.ts` — export `formatRelativeTime(pubDate: string): string` using `date-fns` `formatDistanceToNow(new Date(pubDate), { addSuffix: true })`; wrap in `try/catch` and return `"Recently"` if `pubDate` is absent or `isNaN(new Date(pubDate).getTime())`
- [X] T012 Implement `CategoryContext` in `src/context/CategoryContext.tsx` — create `CategoryContext` with `CategoryContextValue`, export `CategoryProvider` component (manages `activeCategory` state, defaults to `'top'`), export `useCategoryContext()` hook that throws if used outside provider

**Checkpoint**: Foundation ready — all data layer modules exist. User story implementation can begin.

---

## Phase 3: User Story 1 — Browse Top Stories (Priority: P1) 🎯 MVP

**Goal**: App loads, Top Stories feed fetches and renders as scrollable news cards.
Each card shows headline, source, relative time, and opens article in new tab.

**Independent Test**: Open app at 375px viewport. Top Stories tab is active.
News cards are visible with headline, source name, and relative timestamp.
Tapping a card opens the article in a new browser tab.

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement `LoadingSpinner` in `src/components/LoadingSpinner/LoadingSpinner.tsx` — accepts optional `message?: string` prop (default `"Loading news…"`); renders a centered animated spinner using Tailwind `animate-spin`; used both for initial load (full-height) and inline bottom-of-list indicator during refresh
- [X] T014 [P] [US1] Implement `ErrorState` in `src/components/ErrorState/ErrorState.tsx` — accepts `message: string` and `onRetry: () => void` props; renders an error icon, the message, and a "Tap to retry" button; replaces the feed list when `status === 'error'`
- [X] T015 [P] [US1] Implement `NewsCard` in `src/components/NewsCard/NewsCard.tsx` — accepts `article: NewsArticle` prop; renders a card with: `article.title` as headline, `article.sourceName` as muted secondary text, `formatRelativeTime(article.pubDate)` as timestamp; entire card wrapped in `<a href={article.link} target="_blank" rel="noopener noreferrer">` unless `article.link` is empty; mobile-first card styling with Tailwind (padding, border-bottom, readable font sizes)
- [X] T016 [US1] Implement basic `useFeed` hook in `src/hooks/useFeed.ts` — accepts `categoryId: CategoryId`; manages `FeedState` with `articles`, `status`, `error`, `lastRefreshed`; on mount and `categoryId` change: creates `AbortController`, sets `status → 'loading'`, calls `rssService.fetchFeed()`, on success sets articles and `status → 'success'`, on `AbortError` does nothing, on other errors sets `status → 'error'`; exposes `retry()` function; cleanup function calls `controller.abort()`; auto-refresh and infinite scroll NOT added yet (those are US3 and US4)
- [X] T017 [US1] Implement `FeedContainer` in `src/components/FeedContainer/FeedContainer.tsx` — reads `activeCategory` from `useCategoryContext()`; calls `useFeed(activeCategory)`; renders: `<LoadingSpinner />` when `status === 'idle' || (status === 'loading' && articles.length === 0)`; `<ErrorState />` when `status === 'error'`; a scrollable list of `<NewsCard />` for each article when `articles.length > 0`; displays inline `<LoadingSpinner />` at bottom when `status === 'loading' && articles.length > 0` (background refresh indicator, added in US3)
- [X] T018 [US1] Update `src/App.tsx` — wrap with `<CategoryProvider>`; render `<FeedContainer />` only (no TabBar yet); add a fixed sticky header showing the app name "NewsFlow" in bold as placeholder until TabBar is added in US2
- [X] T019 [US1] Update `src/main.tsx` — ensure `import './index.css'` is present for Tailwind; wrap `<App />` in `<React.StrictMode>`

**Checkpoint**: US1 complete. `npm run dev` shows news cards loading for Top Stories.
Cards are tappable. Error state shows if network is disabled. Verify at 375px width.

---

## Phase 4: User Story 2 — Switch Categories (Priority: P2)

**Goal**: Sticky tab bar renders all 5 category tabs. Switching tabs loads the correct feed.
Tab bar remains visible during scroll. Feed resets to top on tab switch.

**Independent Test**: Open app. Tap each of the 5 tabs in sequence. Verify each tab shows
topically different articles. Scroll down then switch tabs — feed returns to top.
Tab bar is always visible. On 375px screen, all tabs are reachable via horizontal scroll.

### Implementation for User Story 2

- [X] T020 [US2] Implement `TabBar` in `src/components/TabBar/TabBar.tsx` — reads `activeCategory` and `setActiveCategory` from `useCategoryContext()`; maps over `CATEGORIES` constant to render a tab button for each; active tab has distinct visual styling (underline or background highlight); tab bar is horizontally scrollable (`overflow-x: auto`, `white-space: nowrap`) so all 5 tabs fit on 375px without wrapping; entire bar is `position: sticky; top: 0` so it stays fixed during feed scroll
- [X] T021 [US2] Update `src/App.tsx` — add `<TabBar />` above `<FeedContainer />`; remove the placeholder "NewsFlow" header and replace with `<TabBar />`; ensure the sticky tab bar stacks above the scrollable feed area with correct z-index

**Checkpoint**: US2 complete. All 5 category tabs are visible and functional.
Tap Technology & AI → tech articles appear. Tap Sports → sports articles appear.
Tab bar stays sticky at top during scroll.

---

## Phase 5: User Story 3 — Auto-Refresh (Priority: P3)

**Goal**: Active feed silently refreshes every 10 minutes. New articles prepended
without resetting scroll. Stale articles retained if refresh fails.

**Independent Test**: Temporarily set `REFRESH_INTERVAL_MS = 10_000` (10 seconds) in
`src/constants/feed.ts`. Open app. Wait 10 seconds. Observe network request in DevTools
and updated `lastRefreshed` timestamp. Restore to `10 * 60 * 1000` after verification.

### Implementation for User Story 3

- [X] T022 [US3] Extend `useFeed.ts` with auto-refresh — add `setInterval(refresh, REFRESH_INTERVAL_MS)` inside a separate `useEffect` that depends on `categoryId`; the `refresh` function re-fetches the feed and **prepends** any articles whose `link` is not already in the current `articles` array (deduplication by `link`); if refresh fetch fails, existing articles are retained unchanged; interval is cleared in the `useEffect` cleanup; a new `AbortController` is created per refresh call and aborted on cleanup; update return type to expose `lastRefreshed` timestamp

**Checkpoint**: US3 complete. Feed auto-refreshes on interval. No scroll reset.
On network failure during refresh, existing cards remain — no crash or blank screen.

---

## Phase 6: User Story 4 — Infinite Scroll (Priority: P4)

**Goal**: Additional articles reveal progressively as user scrolls. End-of-feed message
shown when all fetched articles are visible.

**Independent Test**: Load any category. Scroll to bottom of the 10 initial cards.
Observe next batch appending automatically. Continue scrolling — "You're all caught up"
appears at the end. A bottom loading indicator shows briefly while revealing cards.

### Implementation for User Story 4

- [X] T023 [P] [US4] Implement `useIntersectionObserver` hook in `src/hooks/useIntersectionObserver.ts` — accepts `ref: RefObject<Element>`, `callback: () => void`, `options?: IntersectionObserverInit`; creates an `IntersectionObserver` that calls `callback` when the referenced element enters the viewport (`isIntersecting === true`); cleans up observer on unmount; returns nothing (side-effect only)
- [X] T024 [P] [US4] Implement `ScrollSentinel` in `src/components/ScrollSentinel/ScrollSentinel.tsx` — accepts `onVisible: () => void` and `hasMore: boolean` props; when `hasMore` is true: renders an invisible `<div>` sentinel and attaches `useIntersectionObserver` to call `onVisible` when it enters the viewport; when `hasMore` is false: renders a `"You're all caught up"` end-of-feed message with subtle styling
- [X] T025 [US4] Extend `useFeed.ts` with `displayCount` and `loadMore` — add `displayCount` state initialised to `PAGE_SIZE`; reset `displayCount` to `PAGE_SIZE` when `categoryId` changes; add `loadMore()` function that increments `displayCount` by `PAGE_SIZE` up to `articles.length`; derive `hasMore = displayCount < articles.length`; update returned `articles` slice to `allArticles.slice(0, displayCount)`; rename internal full array to `allArticles` to avoid confusion
- [X] T026 [US4] Update `FeedContainer.tsx` to wire infinite scroll — import `ScrollSentinel`; pass `loadMore` and `hasMore` from `useFeed` to `<ScrollSentinel onVisible={loadMore} hasMore={hasMore} />`; append `<ScrollSentinel />` after the article list; ensure scroll sentinel only renders when `status === 'success'`

**Checkpoint**: US4 complete. First 10 articles shown. Scrolling to bottom reveals 10 more.
"You're all caught up" appears after all articles are revealed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive layout verification, TypeScript compliance, and final validation.

- [X] T027 [P] Audit mobile layout at 375px — open DevTools device toolbar at 375px; verify: no horizontal scrollbar on body, tab labels not clipped, card text readable (min 14px), tap targets ≥ 44px height, no overlapping elements; fix any Tailwind classes that cause overflow or layout issues
- [X] T028 [P] TypeScript strict compliance audit — run `npx tsc --noEmit`; resolve all type errors; ensure no `any` types exist in `src/`; add explicit return types to all exported functions in `rssService.ts`, `useFeed.ts`, `relativeTime.ts`
- [X] T029 Restore `REFRESH_INTERVAL_MS` to `10 * 60 * 1000` in `src/constants/feed.ts` if it was changed during US3 testing
- [X] T030 Run quickstart.md validation checklist — execute each manual verification step in `specs/001-newsflow-feed/quickstart.md` section "Validate the Setup"; confirm all checkboxes pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 complete — BLOCKS all user stories
- **Phase 3 (US1)**: Requires Phase 2 complete — no dependency on US2/US3/US4
- **Phase 4 (US2)**: Requires Phase 2 complete + US1 complete (App.tsx exists)
- **Phase 5 (US3)**: Requires US1 complete (`useFeed.ts` exists to extend)
- **Phase 6 (US4)**: Requires US1 complete (`useFeed.ts` and `FeedContainer.tsx` exist)
- **Phase 7 (Polish)**: Requires all user stories complete

### User Story Dependencies

- **US1 (P1)**: Foundational done → no story deps → standalone MVP
- **US2 (P2)**: US1 done (needs `App.tsx` to add TabBar alongside FeedContainer)
- **US3 (P3)**: US1 done (extends `useFeed.ts`)
- **US4 (P4)**: US1 done (extends `useFeed.ts` and `FeedContainer.tsx`)
- **US2, US3, US4** can proceed in parallel once US1 is complete

### Within Each User Story

- Presentational components (`NewsCard`, `LoadingSpinner`, `ErrorState`) → before hook
- Hook (`useFeed`) → before container
- Container (`FeedContainer`) → before App wiring
- App wiring → last step in each story

---

## Parallel Opportunities

### Phase 1 — Setup (T003–T006 in parallel after T001+T002)

```
T001 → T002 → ┬─ T003 (Tailwind config)
               ├─ T004 (tsconfig strict)
               ├─ T005 (Vite proxy)
               └─ T006 (vercel.json)
```

### Phase 2 — Foundational (T008–T009 in parallel after T007)

```
T007 → ┬─ T008 (categories.ts)
        └─ T009 (feed.ts)
        → T010 (rssService, needs T008+T009)
        → T011 (relativeTime, parallel with T010)
        → T012 (CategoryContext, needs T007)
```

### Phase 3 — US1 (T013–T015 in parallel)

```
T013 [P] (LoadingSpinner)  ─┐
T014 [P] (ErrorState)       ├─ all done → T016 (useFeed) → T017 (FeedContainer) → T018 (App) → T019 (main)
T015 [P] (NewsCard)        ─┘
```

### Phase 6 — US4 (T023–T024 in parallel)

```
T023 [P] (useIntersectionObserver) ─┐
T024 [P] (ScrollSentinel)           ├─ all done → T025 (useFeed extend) → T026 (FeedContainer update)
```

---

## Implementation Strategy

### MVP First (User Story 1 only — T001–T019)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T012)
3. Complete Phase 3: User Story 1 (T013–T019)
4. **STOP and validate**: run `npm run dev`, open at 375px, confirm news cards load and are tappable
5. Deploy preview to Vercel to confirm production allorigins fetch works

### Incremental Delivery

| Milestone | Tasks | Deliverable |
|-----------|-------|-------------|
| MVP | T001–T019 | Working Top Stories feed |
| + Category Nav | T020–T021 | All 5 tabs switchable |
| + Auto-Refresh | T022 | Feed stays current passively |
| + Infinite Scroll | T023–T026 | Progressive article loading |
| + Polish | T027–T030 | Production-ready |

### Parallel Team Strategy

With two developers after Phase 2 is complete:
- **Dev A**: US1 (T013–T019) → US2 (T020–T021)
- **Dev B**: US3 (T022) → US4 (T023–T026)

---

## Notes

- `[P]` tasks = different files, no incomplete dependencies — safe to parallelise
- `useFeed.ts` is extended across 3 stories (US1 baseline → US3 auto-refresh → US4 displayCount); implement incrementally, do not front-load US3/US4 logic into T016
- `FeedContainer.tsx` is updated in US1 (created) and US4 (scroll sentinel added); US2 only changes `App.tsx`
- `allorigins.win` is a free community proxy — test production deploy immediately after MVP to confirm it works from Vercel's CDN edge
- `REFRESH_INTERVAL_MS` can be temporarily reduced to `10_000` during US3 manual testing; T029 ensures it is restored before final polish
