# Data Model: Bookmarks

**Feature**: `003-bookmarks`
**Date**: 2026-03-01

---

## New Types

### `ActiveTab`

Extends the navigation system to include the Bookmarks tab alongside the 5 RSS feed categories.

```typescript
// src/types/index.ts — NEW
export type ActiveTab = CategoryId | 'bookmarks'
// Replaces CategoryId in CategoryContextValue.activeCategory and setActiveCategory
```

`CategoryId` itself is **unchanged** — it remains the type for RSS feed categories only (`'top' | 'tech' | 'tamilnadu' | 'india' | 'sports'`). `ActiveTab` is the wider type used exclusively for tab navigation state.

---

### `BookmarkedArticle`

A saved snapshot of a `NewsArticle` at the moment the user bookmarks it. Extends `NewsArticle` with a single additional field recording when the bookmark was created.

```typescript
// src/types/index.ts — NEW
export interface BookmarkedArticle extends NewsArticle {
  savedAt: number   // Unix timestamp (ms) of when the bookmark was created — Date.now()
}
```

**Fields inherited from `NewsArticle`**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | URL-derived unique identifier (deduplication key) |
| `title` | `string` | Article headline at time of bookmarking |
| `link` | `string` | Original article URL |
| `pubDate` | `string` | Publication date string from RSS feed |
| `sourceName` | `string` | Publisher name |
| `categoryId` | `CategoryId` | Feed category the article came from (`'top'`, `'tech'`, etc.) |

**Additional field**:

| Field | Type | Description |
|-------|------|-------------|
| `savedAt` | `number` | `Date.now()` at bookmark creation time; used for most-recent-first ordering |

**Snapshot semantics**: `BookmarkedArticle` captures the article's state at save time. If the live feed later serves different content for the same URL, the bookmark is unaffected.

---

### `BookmarkContextValue`

The shape of the context shared across components that need bookmark functionality.

```typescript
// src/context/BookmarkContext.tsx
export interface BookmarkContextValue {
  bookmarks: BookmarkedArticle[]          // All saved articles, most-recently-bookmarked first
  toggleBookmark: (article: NewsArticle) => void  // Add if not saved; remove if saved
  isBookmarked: (articleId: string) => boolean    // Check by article.id
}
```

---

## Updated Interfaces

### `CategoryContextValue` (modified)

```typescript
// src/types/index.ts — MODIFIED
export interface CategoryContextValue {
  activeCategory: ActiveTab                      // was: CategoryId
  setActiveCategory: (id: ActiveTab) => void     // was: (id: CategoryId) => void
}
```

All other interfaces (`Category`, `NewsArticle`, `FeedStatus`, `FeedState`) are **unchanged**.

---

## localStorage Schema

```
Key:   'newsflow_bookmarks'
Value: JSON.stringify(BookmarkedArticle[])
       — ordered most-recently-bookmarked first (prepend on add)
       — empty array '[]' when no bookmarks saved
```

**Initialization**: Read synchronously in `useState` lazy initializer on `BookmarkProvider` mount.
**Write**: Sync on every state change via `useEffect([bookmarks])`.
**Failure handling**: Both read and write wrapped in `try/catch`; errors silently ignored (returns `[]` on read failure, no-ops on write failure).

---

## State Transitions — Bookmark Toggle

```
Article in feed (isBookmarked = false)
       │
       │ user taps bookmark icon
       ▼
BookmarkedArticle prepended to bookmarks[]
→ localStorage updated
→ icon fills (isBookmarked = true) everywhere the article appears
       │
       │ user taps bookmark icon again
       ▼
BookmarkedArticle removed from bookmarks[] (filtered by id)
→ localStorage updated
→ icon empties (isBookmarked = false) everywhere
```

The toggle is **idempotent**: rapid double-taps alternate add→remove→add, never duplicate.

---

## Component Data Flow

```
BookmarkProvider (App root)
├── bookmarks: BookmarkedArticle[]     ← from localStorage
├── toggleBookmark(article)            ← mutates state + persists
└── isBookmarked(articleId)            ← derived from bookmarks[]

    ┌─────────────────────────────────────────────┐
    │ FeedContainer → NewsCard                    │
    │   useBookmarkContext()                       │
    │   isBookmarked(article.id) → icon state     │
    │   toggleBookmark(article) → on icon tap     │
    └─────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────┐
    │ BookmarksContainer → NewsCard               │
    │   useBookmarkContext()                       │
    │   bookmarks[] → article list                │
    │   toggleBookmark(article) → removes from    │
    │   list; icon becomes empty in feed too      │
    └─────────────────────────────────────────────┘
```
