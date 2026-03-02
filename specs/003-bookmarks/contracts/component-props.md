# Contract: Component Props — 003-bookmarks

**Scope**: New and modified component contracts for the bookmarks feature
**Date**: 2026-03-01

Changes in this feature:
1. **New**: `BookmarksContainer` component
2. **Modified**: `NewsCard` (add bookmark button via BookmarkContext)
3. **Modified**: `TabBar` (add Bookmarks tab; use `ActiveTab`)
4. **Modified**: `App` (add `BookmarkProvider`, add `MainView` helper)
5. **New**: `BookmarkContext` — `BookmarkContextValue`, `BookmarkProvider`, `useBookmarkContext`
6. **Unchanged**: `FeedContainer`, `SearchBar`, `LoadingSpinner`, `ErrorState`, `ScrollSentinel`

---

## BookmarksContainer *(new)*

```typescript
// No props — reads BookmarkContext directly
// Props: none
```

Reads `bookmarks` and `toggleBookmark` from `BookmarkContext`. Renders:
- Empty-state message when `bookmarks.length === 0`
- A scrollable list of `<NewsCard article={bookmark} />` otherwise (most-recent first — already the array order)

Does **not** use `useFeed`, `CategoryContext`, or any RSS fetching. Renders entirely from the locally persisted store.

---

## NewsCard *(modified — no new props)*

```typescript
interface NewsCardProps {
  article: NewsArticle   // unchanged
}
```

`NewsCardProps` is unchanged. The bookmark button is added internally by consuming `BookmarkContext` via `useBookmarkContext()`. No new props are needed.

**Structural change** (internal — not a prop-contract change):

Before:
```
<a href={link}>          ← full card is a link
  <div>{content}</div>
</a>
```

After:
```
<div className="relative border-b border-gray-100">   ← outer wrapper
  <a href={link} className="block no-underline">       ← article link (pr-14 on inner content)
    <div>{content}</div>
  </a>
  <button aria-label="…" onClick={toggleBookmark}>     ← sibling of <a>, absolutely positioned
    {bookmarkIcon}
  </button>
</div>
```

The `<button>` is a sibling of the `<a>`, not a descendant. No `stopPropagation` required. Touch target ≥ 44×44 px.

**aria-label values**:
- When not bookmarked: `"Bookmark article"`
- When bookmarked: `"Remove bookmark"`

---

## TabBar *(modified)*

```typescript
// No new props — reads CategoryContext (now uses ActiveTab)
// Props: none
```

Internal change: adds a hardcoded Bookmarks tab button after the 5 CATEGORIES tabs:
```typescript
<button
  onClick={() => setActiveCategory('bookmarks')}
  aria-current={activeCategory === 'bookmarks' ? 'page' : undefined}
  ...
>
  Bookmarks
</button>
```

The Bookmarks tab uses the same styling as category tabs (active: blue underline, inactive: gray). It can optionally include a bookmark emoji or icon prefix to visually distinguish it.

---

## Context: `BookmarkContextValue` *(new)*

```typescript
export interface BookmarkContextValue {
  bookmarks: BookmarkedArticle[]
  toggleBookmark: (article: NewsArticle) => void
  isBookmarked: (articleId: string) => boolean
}
```

Provided by `BookmarkProvider` wrapping the entire app (outside `CategoryProvider`).
Consumed by `NewsCard` and `BookmarksContainer` via `useBookmarkContext()`.

`useBookmarkContext()` throws a descriptive error if used outside `BookmarkProvider`.

---

## App *(modified)*

```typescript
// No props (root component — unchanged signature)
```

Internal additions:
- Imports `BookmarkProvider` and `BookmarksContainer`
- Adds a local `MainView` helper component that reads `activeCategory` from `CategoryContext` and conditionally renders `<BookmarksContainer />` or `<FeedContainer />`
- Wraps the tree with `<BookmarkProvider>` **outside** `<CategoryProvider>` (order is flexible; either nesting works since they are independent contexts)

```typescript
function MainView(): JSX.Element {
  const { activeCategory } = useCategoryContext()
  return activeCategory === 'bookmarks' ? <BookmarksContainer /> : <FeedContainer />
}

export default function App(): JSX.Element {
  return (
    <BookmarkProvider>
      <CategoryProvider>
        <div className="flex min-h-screen flex-col bg-white">
          <TabBar />
          <main className="flex-1">
            <MainView />
          </main>
        </div>
      </CategoryProvider>
    </BookmarkProvider>
  )
}
```

---

## FeedContainer *(minor internal change only — no prop-contract change)*

```typescript
// No props — reads CategoryContext directly (unchanged)
```

The only change: `activeCategory` is now of type `ActiveTab` (includes `'bookmarks'`). Since `FeedContainer` is only rendered by `MainView` when `activeCategory !== 'bookmarks'`, the call `useFeed(activeCategory as CategoryId)` is a safe type cast.

The `as CategoryId` cast is documented inline with a comment. No runtime risk.
