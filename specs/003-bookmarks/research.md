# Research: Bookmarks

**Feature**: `003-bookmarks`
**Date**: 2026-03-01
**Status**: Complete — all decisions resolved from existing project context and standard web patterns.

---

## Decision 1: Tab Navigation Type — `ActiveTab = CategoryId | 'bookmarks'`

**Decision**: Introduce a new `ActiveTab` type (`CategoryId | 'bookmarks'`) for the tab bar's active selection. Keep `CategoryId` unchanged as the 5 feed categories.

**Rationale**: The Bookmarks tab is conceptually different from a news category — it shows saved local data, not a live RSS feed. Polluting `CategoryId` with `'bookmarks'` would:
- Make `Category.id: CategoryId` semantically allow `'bookmarks'` (a non-feed entity)
- Require `useFeed` to accept and silently no-op for `'bookmarks'`
- Mislead future developers about the relationship between tabs and RSS categories

`ActiveTab = CategoryId | 'bookmarks'` is clean: the 5 feed categories remain `CategoryId`, and `CategoryContextValue.activeCategory: ActiveTab` supports the extended tab set. `FeedContainer` uses `activeCategory as CategoryId` (a safe cast — it is never rendered when `activeCategory === 'bookmarks'`).

**Alternatives considered**:
- Extend `CategoryId` to include `'bookmarks'` — rejected: semantic pollution, `Category.id` would technically allow `'bookmarks'`, misleading type
- Add separate `activeView: 'feed' | 'bookmarks'` state alongside `activeCategory` — rejected: two states for one tab selection; complicates `TabBar` which only needs one "which tab is active" value

---

## Decision 2: Bookmark State — Dedicated `BookmarkContext` at App Root

**Decision**: Create a `BookmarkContext` provider wrapping the entire app, holding bookmarks state and persistence logic. `NewsCard` and `BookmarksContainer` consume it directly via `useBookmarkContext()`.

**Rationale**: Bookmark state needs to be simultaneously visible to:
- `NewsCard` — renders the filled/empty icon based on saved status
- `BookmarksContainer` — renders the list of saved articles
These two consumers are in different subtrees of the component tree (one under `FeedContainer`, one as a sibling). The minimum scope that covers both is the App root. Constitution Principle IV permits root-level providers when the state domain genuinely needs app-wide access — this is one such case. The context is dedicated to bookmarks only (no "mega-provider" concerns).

**Alternatives considered**:
- Lift bookmark state into `CategoryContext` — rejected: mixes unrelated concerns; constitution explicitly warns against this
- Prop-drill `isBookmarked`/`toggleBookmark` from App down through FeedContainer → NewsCard — rejected: deep prop drilling for every article card in every list is fragile and verbose

---

## Decision 3: Persistence — `localStorage` with `JSON.stringify`

**Decision**: Store `BookmarkedArticle[]` in `localStorage` under the key `'newsflow_bookmarks'` as a JSON string. Initialize context state from localStorage on first mount using the `useState` lazy initializer.

**Rationale**: localStorage is the right-sized tool for this use case:
- Synchronous read on init (no async loading state or spinner needed for bookmarks)
- ~5–10 MB capacity — far exceeds any realistic bookmark count (each article ≈ 300 bytes → ~16,000 articles maximum)
- No external dependencies required
- Works offline, no network call
- Persists across sessions and page reloads automatically

Constitution Principle I (client-side only, no backend) is preserved. Principle V (simplicity, no unjustified dependencies) is respected — no new packages.

**Failure handling**: Wrap all `localStorage` access in `try/catch`. Private browsing mode and storage quota errors both throw; silently fall back to empty array or no-op on write failure. Never crash the app.

**Alternatives considered**:
- IndexedDB — rejected: asynchronous (requires loading state for bookmarks), vastly more complex API, no benefit at this data scale
- `sessionStorage` — rejected: doesn't persist across page reloads (violates FR-004)
- Cookie storage — rejected: size-limited, sent with every request (irrelevant here but bad practice)

---

## Decision 4: Bookmark Button Layout — Absolutely Positioned Outside `<a>`

**Decision**: Restructure `NewsCard` so the article content lives inside the `<a>` tag with right-side padding (`pr-14`), and the bookmark `<button>` is absolutely positioned at the trailing edge of a relative-positioned wrapper `<div>`. The `<button>` is a sibling of the `<a>`, not a descendant.

**Rationale**: The spec (SC-005) requires the bookmark icon to be tappable without accidentally triggering article navigation. Placing a `<button>` inside an `<a>` is invalid HTML and requires `e.stopPropagation()` hacks. The sibling approach is semantically correct, requires no event interception, and produces a clear tap-target boundary.

The wrapper `<div className="relative border-b border-gray-100">` holds both the `<a>` (card content, full clickable area minus right padding) and the `<button>` (absolute top-right, ≥ 44×44 px touch target).

**Alternatives considered**:
- Button inside `<a>` with `e.stopPropagation()` — rejected: invalid HTML nesting, fragile event handling
- Button below the card content, not overlapping — rejected: takes up vertical space, doesn't align with standard bookmark UI patterns (top-right placement is the convention)

---

## Decision 5: Deduplication Key — `article.id`

**Decision**: Use `article.id` as the unique key for deduplication in the bookmarks list. `isBookmarked(articleId: string)` takes this id.

**Rationale**: `article.id` is derived deterministically from the article URL (`encodeURIComponent(link).slice(0, 100)`) when a link is present. The same article appearing in multiple categories will have the same `id` if their URLs match, ensuring a user can't inadvertently save the same article from two different feed tabs.

**Alternatives considered**:
- Deduplicate by `article.link` — equivalent when link is present; slightly cleaner semantics but requires one extra property access. `article.id` is already the canonical unique id used as React key, so it's the right choice.

---

## Decision 6: Ordering — Most Recently Bookmarked First (Prepend on Add)

**Decision**: New bookmarks are prepended to the `bookmarks` array. The stored array is always in most-recent-first order. No re-sorting is needed on read.

**Rationale**: Prepend is O(1) amortized via array spread. The most recently saved article is the most likely to be what the user wants to read next — matching standard bookmark manager UX (e.g. browser bookmarks bar, Pocket, Instapaper).

**Alternatives considered**:
- Append + sort on render — rejected: sort is unnecessary complexity when prepend already maintains the correct order
- Timestamp-based sort on every render — rejected: more computation, same result

---

## Decision 7: No New npm Dependencies

**Decision**: Implement bookmarks with zero new packages. All logic uses native browser APIs (`localStorage`, `JSON`, `Array`).

**Rationale**: Constitution Principle V (Simplicity / Free-Tier Compliance). No persistence library adds value at this scale and complexity level. `localStorage` + `JSON.parse`/`JSON.stringify` is 3 lines.

**Alternatives considered**:
- `use-local-storage-state` npm package — rejected: adds dependency weight for a trivial wrapper
- `zustand` with persist middleware — rejected: external state library (Constitution Principle IV violation)
