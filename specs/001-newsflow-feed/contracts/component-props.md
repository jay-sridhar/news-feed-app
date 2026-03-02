# Contract: Component Props Interface

**Scope**: Internal UI component contracts for `001-newsflow-feed`
**Date**: 2026-03-01

These interfaces define the TypeScript prop contracts for each component.
They govern the boundary between parent and child — changes here constitute
a breaking change to the component's public API.

---

## TabBar

```typescript
// No props — reads CategoryContext directly
// Props: none
```

`TabBar` consumes `CategoryContext` via `useContext`. It does not accept props for
`categories` or `activeCategory` — these come from context. This keeps the component
self-contained and avoids prop-drilling.

---

## FeedContainer

```typescript
// No props — reads CategoryContext directly
// Props: none
```

`FeedContainer` reads `activeCategory` from `CategoryContext` and manages its own
feed state via `useFeed(activeCategory)`. It does not accept article arrays as props.

---

## NewsCard

```typescript
interface NewsCardProps {
  article: NewsArticle   // the article to display
}
```

Pure presentational component. Receives one `NewsArticle` and renders:
- `article.title` — headline text
- `article.sourceName` — source/publisher name
- `article.pubDate` → formatted as relative time via `formatRelativeTime(pubDate)`
- `article.link` — wraps entire card in `<a href={link} target="_blank" rel="noopener noreferrer">`

If `article.link` is empty, the card renders without an anchor (not tappable).

---

## LoadingSpinner

```typescript
interface LoadingSpinnerProps {
  message?: string   // optional caption; default: "Loading news…"
}
```

Shown when `FeedState.status === 'loading'` and `articles.length === 0`.
A subtle spinner at the bottom of the list (not full-screen) when `articles.length > 0`
(i.e., refreshing in background).

---

## ErrorState

```typescript
interface ErrorStateProps {
  message: string        // error description to display
  onRetry: () => void    // callback triggered by "Tap to retry" button
}
```

Replaces the feed list when `FeedState.status === 'error'`.

---

## ScrollSentinel

```typescript
interface ScrollSentinelProps {
  onVisible: () => void   // fires when sentinel enters viewport
  hasMore: boolean        // if false, renders "You're all caught up" instead
}
```

Invisible `<div>` at bottom of article list. When `hasMore` is true, uses
`IntersectionObserver` to call `onVisible()`. When `hasMore` is false, renders
the end-of-feed message.

---

## Context: CategoryContextValue

```typescript
interface CategoryContextValue {
  activeCategory: CategoryId
  setActiveCategory: (id: CategoryId) => void
}
```

Provided by `CategoryProvider` wrapping the entire app. Consumed by `TabBar`
and `FeedContainer`.

---

## Hook: useFeed

Not a component, but its return contract is part of the internal interface:

```typescript
interface UseFeedReturn {
  articles: NewsArticle[]   // currently visible slice (up to displayCount)
  allArticles: NewsArticle[] // full fetched set (for deduplication during refresh)
  status: FeedStatus
  error: string | null
  lastRefreshed: number | null
  hasMore: boolean
  loadMore: () => void       // called by ScrollSentinel.onVisible
  retry: () => void          // called by ErrorState.onRetry
}
```
