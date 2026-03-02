# Data Model: NewsFlow — Categorized News Feed

**Feature**: `001-newsflow-feed`
**Date**: 2026-03-01

---

## Entities

### CategoryId (Union Type)

```typescript
type CategoryId = 'top' | 'tech' | 'tamilnadu' | 'india' | 'sports'
```

Five fixed values — no runtime additions. Used as the discriminant for all
category-specific state and URL lookups.

---

### Category

Represents one tab in the UI. All five instances are defined as a static constant
array at build time; there is no dynamic category creation.

```typescript
interface Category {
  id: CategoryId       // unique identifier, stable key
  label: string        // display text in TabBar (e.g. "Technology & AI")
  feedUrl: string      // Google News RSS URL for this category
  order: number        // 0-indexed display order in the tab bar
}
```

**Static data** (`src/constants/categories.ts`):

| id | label | order |
|----|-------|-------|
| `top` | Top Stories | 0 |
| `tech` | Technology & AI | 1 |
| `tamilnadu` | Tamil Nadu / Chennai | 2 |
| `india` | National India | 3 |
| `sports` | Sports | 4 |

Feed URLs as provided (see `src/constants/categories.ts`).

---

### NewsArticle

Represents a single parsed news item. Created by `rssService` from raw RSS item data.

```typescript
interface NewsArticle {
  id: string           // derived: encodeURIComponent(link) or SHA-like hash of link
  title: string        // RSS <title> — may include " - Source Name" suffix
  link: string         // RSS <link> — Google News redirect URL
  pubDate: string      // RSS <pubDate> — RFC 2822 string (e.g. "Sun, 01 Mar 2026 10:00:00 GMT")
  sourceName: string   // RSS <source>_ text, or extracted from title suffix; fallback: "Unknown Source"
  categoryId: CategoryId
}
```

**Field derivation rules**:

| Field | Source | Fallback |
|-------|--------|----------|
| `title` | `item.title` stripped of ` - {sourceName}` suffix | Raw `item.title` |
| `link` | `item.link` | `item.guid` if it is a permalink |
| `pubDate` | `item.pubDate` | `""` → displayed as "Recently" |
| `sourceName` | `item.source._` (rss-parser object) | Extract after last ` - ` in title; else `"Unknown Source"` |
| `id` | Stable hash/encode of `link` | Index-based fallback if link absent |

**Immutability**: `NewsArticle` objects are treated as immutable once created. Feed
state updates replace the array; individual articles are never mutated.

---

### FeedStatus (Union Type)

```typescript
type FeedStatus = 'idle' | 'loading' | 'success' | 'error'
```

| Value | Meaning |
|-------|---------|
| `idle` | Initial state — no fetch attempted yet |
| `loading` | Fetch in progress (either initial or refresh) |
| `success` | At least one successful fetch; articles populated |
| `error` | Last fetch failed; `error` field populated |

---

### FeedState

Per-category state owned by the `useFeed` hook inside `FeedContainer`.

```typescript
interface FeedState {
  articles: NewsArticle[]   // full set of fetched articles (deduplicated)
  status: FeedStatus
  error: string | null       // human-readable error message; null if no error
  lastRefreshed: number | null  // Date.now() timestamp of last successful fetch
  displayCount: number          // how many articles to show (infinite scroll window)
}
```

**Derived values** (not stored, computed on render):

```typescript
const visibleArticles = articles.slice(0, displayCount)
const hasMore = displayCount < articles.length
```

**State transitions**:

```
idle
  └──[fetch initiated]──→ loading
                              ├──[success]──→ success (articles set, lastRefreshed set)
                              └──[error]────→ error   (error message set)
success
  ├──[refresh initiated]──→ loading (articles retained during refresh)
  └──[scroll sentinel]──→ success (displayCount += PAGE_SIZE)
error
  └──[retry tap]──→ loading
```

---

### CategoryContextValue

The value exposed by `CategoryContext`.

```typescript
interface CategoryContextValue {
  activeCategory: CategoryId
  setActiveCategory: (id: CategoryId) => void
}
```

Minimal context — only the active tab selection. No feed state lives in context.

---

## Constants

```typescript
// src/constants/feed.ts
export const PAGE_SIZE = 10          // articles revealed per scroll-trigger
export const REFRESH_INTERVAL_MS = 10 * 60 * 1000   // 10 minutes
export const ALLORIGINS_BASE = import.meta.env.DEV
  ? '/allorigins'
  : 'https://api.allorigins.win'
```

---

## Data Flow

```
Google News RSS (external)
        │
        ▼ fetch via allorigins.win
rssService.fetchFeed(category, signal)
        │ returns NewsArticle[]
        ▼
useFeed(categoryId) hook
        │ manages FeedState
        ▼
FeedContainer
        │ passes visibleArticles[]
        ▼
NewsCard × N          (title, sourceName, pubDate → relative time, link)
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `NewsArticle.title` | MUST be non-empty string; trim whitespace |
| `NewsArticle.link` | MUST be non-empty; if empty, card tap target disabled |
| `NewsArticle.pubDate` | Parse with `new Date(pubDate)`; if `isNaN`, treat as absent |
| `NewsArticle.sourceName` | MUST default to `"Unknown Source"` if all extraction fails |
| `FeedState.displayCount` | MUST be ≥ PAGE_SIZE; incremented by PAGE_SIZE on scroll trigger; capped at `articles.length` |
