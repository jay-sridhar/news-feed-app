# Tasks: Bookmarks (003-bookmarks)

**Input**: Design documents from `/specs/003-bookmarks/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/component-props.md ✓, quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in all task descriptions

---

## Phase 1: Setup

**Purpose**: No new packages or configuration required for this feature — zero-dependency, localStorage only

- [X] T001 Confirm `tests/helpers/mockRss.ts` exports `makeArticles` helper and `playwright.config.ts` `webServer` is configured — no changes expected, just verification before writing tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and `BookmarkContext` that ALL three user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Add `export type ActiveTab = CategoryId | 'bookmarks'` and `export interface BookmarkedArticle extends NewsArticle { savedAt: number }` to `src/types/index.ts`; update `CategoryContextValue.activeCategory` and `setActiveCategory` to use `ActiveTab` instead of `CategoryId`
- [X] T003 Update `src/context/CategoryContext.tsx` — change internal `useState<CategoryId>` to `useState<ActiveTab>` (initial value `'top'` remains valid); update context type annotation to reflect updated `CategoryContextValue`
- [X] T004 Create `src/context/BookmarkContext.tsx` — define `BookmarkContextValue` interface; implement `BookmarkProvider` with `useState<BookmarkedArticle[]>` lazy initializer reading from `localStorage.getItem('newsflow_bookmarks')` (wrapped in `try/catch`, returns `[]` on failure); `useEffect([bookmarks])` writing `JSON.stringify(bookmarks)` to localStorage (also `try/catch`); `toggleBookmark` (prepend `{ ...article, savedAt: Date.now() }` on add, filter-by-id on remove); `isBookmarked` (`bookmarks.some(b => b.id === articleId)`); export `useBookmarkContext` hook that throws descriptive error if used outside provider

**Checkpoint**: Types + context ready — all user story tasks can now begin

---

## Phase 3: User Story 1 — Bookmark an Article (Priority: P1) 🎯 MVP

**Goal**: Every article card shows a bookmark icon; tapping it toggles saved/unsaved state that persists across page reloads

**Independent Test**: Open feed → tap bookmark icon on any card → icon fills → reload page → icon remains filled → tap again → icon empties

- [X] T005 [US1] Restructure `src/components/NewsCard/NewsCard.tsx` — wrap existing content in `<div className="relative border-b border-gray-100">`; remove `border-b` from the `<a>` tag (avoid duplicate border); add `pr-14` to the inner content container so text doesn't overlap the button; add `<button>` as a sibling of `<a>` absolutely positioned `top-2 right-2` with `className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center text-gray-400 hover:text-blue-500"` — `aria-label` is `"Bookmark article"` when not saved, `"Remove bookmark"` when saved; render filled SVG bookmark icon when `isBookmarked(article.id)`, outline icon otherwise; call `toggleBookmark(article)` on click; consume `useBookmarkContext()` for both values
- [X] T006 [P] [US1] Write US1 Playwright tests in `tests/e2e/bookmarks.spec.ts` — use `makeArticles(3)` mocked via `page.route('**/allorigins/get**', ...)`; test: bookmark icon visible on every card; tapping fills it; `localStorage.getItem('newsflow_bookmarks')` contains the article after tap; hard reload preserves filled icon; second tap empties icon and removes from localStorage; icon is filled when article appears in search-filtered results (search by article title)

---

## Phase 4: User Story 2 — View Saved Bookmarks (Priority: P2)

**Goal**: A dedicated Bookmarks tab in the tab bar lists all saved articles (most-recent first) with an empty-state message when the list is empty

**Independent Test**: Bookmark 2 articles → tap Bookmarks tab → both appear (most recent first) → tap one → opens in new tab → remove all → empty-state message appears

- [X] T007 [P] [US2] Create `src/components/BookmarksContainer/BookmarksContainer.tsx` — no props; consume `useBookmarkContext()`; when `bookmarks.length === 0` render `<p className="px-4 py-12 text-center text-sm text-gray-400">No bookmarks yet. Tap the bookmark icon on any article to save it.</p>`; otherwise render a `<div>` list of `<NewsCard key={b.id} article={b} />` for each bookmark (array is already most-recent-first); no `useFeed`, no `ScrollSentinel`, no RSS fetching
- [X] T008 [P] [US2] Update `src/components/TabBar/TabBar.tsx` — after the existing 5 category `<button>` elements, add a hardcoded Bookmarks tab: `<button onClick={() => setActiveCategory('bookmarks')} aria-current={activeCategory === 'bookmarks' ? 'page' : undefined} className={activeCategory === 'bookmarks' ? '…active classes…' : '…inactive classes…'}>Bookmarks</button>` using the same Tailwind active/inactive classes as the other tabs
- [X] T009 [US2] Update `src/App.tsx` — import `BookmarkProvider` from `src/context/BookmarkContext.tsx` and `BookmarksContainer` from `src/components/BookmarksContainer/BookmarksContainer.tsx`; add `function MainView(): JSX.Element { const { activeCategory } = useCategoryContext(); return activeCategory === 'bookmarks' ? <BookmarksContainer /> : <FeedContainer /> }`; replace `<FeedContainer />` in the JSX tree with `<MainView />`; wrap the entire return with `<BookmarkProvider>` outside `<CategoryProvider>`
- [X] T010 [US2] Update `src/components/FeedContainer/FeedContainer.tsx` — change `useFeed(activeCategory)` to `useFeed(activeCategory as CategoryId)` and add inline comment `// safe cast: FeedContainer is only rendered by MainView when activeCategory !== 'bookmarks'`
- [X] T011 [P] [US2] Add US2 Playwright tests to `tests/e2e/bookmarks.spec.ts` — test: Bookmarks tab button visible in tab bar; tapping switches view; saved articles appear in list (most recent first — bookmark 2nd article first, then 1st; expect 1st article at top of Bookmarks list); tapping article card opens `article.link` in new tab; empty-state message visible when no bookmarks saved; bookmarks persist after page reload and Bookmarks tab shows them

---

## Phase 5: User Story 3 — Remove a Bookmark (Priority: P3)

**Goal**: Tapping the bookmark icon in the Bookmarks tab removes the article from the list immediately; the icon reverts to empty in the feed

**Independent Test**: Bookmark an article → go to Bookmarks tab → tap its bookmark icon → article disappears instantly → switch to feed → same article icon is empty

*(No new implementation files — removal is handled by `toggleBookmark` in `BookmarkContext` and `BookmarksContainer` re-rendering from updated state. Only tests needed.)*

- [X] T012 [US3] Add US3 Playwright tests to `tests/e2e/bookmarks.spec.ts` — test: tapping bookmark icon on article in Bookmarks tab removes it from the list immediately (no confirmation dialog); switching to feed shows the same article with empty icon; removing the last bookmark from Bookmarks tab shows the empty-state message; tapping the bookmark button on a card does NOT navigate to the article URL (verify no new tab opened and current URL unchanged)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T013 [P] Run TypeScript type-check — `npx tsc --noEmit` — zero errors required; fix any type issues in the new/modified files
- [X] T014 [P] Audit 375 px mobile layout — confirm bookmark button has ≥ 44×44 px touch target, no horizontal overflow in `NewsCard` at 375 px, `pr-14` padding sufficient so text doesn't visually overlap the button, Bookmarks tab visible in tab bar without scrolling
- [X] T015 Run full Playwright test suite — `npm test` — all tests pass (existing 42 tests + new bookmarks tests)

---

## Dependencies

```
T002 (types) ──→ T003 (CategoryContext) ──→ T004 (BookmarkContext)
                                                    │
                          ┌─────────────────────────┼──────────────────────┐
                          ↓                         ↓                      ↓
                    T005 (NewsCard)          T007 (BookmarksContainer) T008 (TabBar)
                          │                         │                      │
                    T006 (US1 tests)                └──────────┬───────────┘
                                                               ↓
                                                         T009 (App.tsx)
                                                               │
                                                    ┌──────────┴───────────┐
                                                    ↓                      ↓
                                            T010 (FeedContainer)    T011 (US2 tests)

T005 + T009 ──────────────────────────────────────────────→ T012 (US3 tests)
T006 + T011 + T012 ────────────────────────────────────────→ T015 (full suite)
T013 [P] + T014 [P] ───────────────────────────────────────→ T015
```

## Parallel Execution

**After T004 is complete**, these can run in parallel:
```
T005 (NewsCard)  +  T007 (BookmarksContainer)  +  T008 (TabBar)
```

**After T007 + T008 are complete**:
```
T009 (App.tsx)  [sequential — imports both]
```

**After T009 is complete**, these can run in parallel:
```
T010 (FeedContainer)  +  T011 (US2 tests)
```

**After T005 + T009 are complete**:
```
T006 (US1 tests) [needs T005]   +   T012 (US3 tests) [needs T005 + T009]
```

**Polish (after T012)**:
```
T013 (tsc)  +  T014 (layout audit)  →  T015 (full suite)
```

---

## Implementation Strategy

**MVP** — deliver US1 alone (bookmark toggle + persistence):
1. T002–T004: Foundational types + context
2. T005: NewsCard bookmark button
3. T006: Verify US1 tests pass
4. → Ship MVP: every article card has a working, persistent bookmark toggle

**Full feature** — add US2 then US3:
- T007–T011: Bookmarks tab (view saved articles)
- T012: Remove bookmark (already functional, only tests needed)
- T013–T015: Polish + full test suite

**Total tasks**: 15
**By phase**: Setup 1 + Foundation 3 + US1 2 + US2 5 + US3 1 + Polish 3
**Parallel opportunities**: T005/T007/T008 (after T004), T010/T011 (after T009), T013/T014 (Polish)
