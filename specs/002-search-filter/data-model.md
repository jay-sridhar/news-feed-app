# Data Model: In-Feed Keyword Search

**Feature**: `002-search-filter`
**Date**: 2026-03-01

This feature introduces no persistent entities and no new TypeScript types.
All new state is ephemeral (component-lifetime) and derived from existing types.

---

## Ephemeral State

### SearchQuery

Held in `useState` inside `FeedContainer`. Not stored in context, localStorage, or any
external store. Lifetime: one category view — cleared on every `activeCategory` change.

| Field   | Type     | Source        | Notes                                              |
|---------|----------|---------------|----------------------------------------------------|
| `query` | `string` | User keyboard | Raw input value; trimmed before matching          |

**Clearing rules**:
- User taps the clear button → `setQuery('')`
- `activeCategory` changes → `useEffect` calls `setQuery('')`
- Component unmounts → state is garbage-collected

---

## Derived State

### FilteredArticleList

Not a stored type — computed inline during `FeedContainer` render.

```
filteredArticles =
  query.trim() === ''
    ? articles            // paginated displayCount slice — infinite scroll active
    : allArticles.filter(a =>
        a.title.toLowerCase().includes(normalizedQuery) ||
        a.sourceName.toLowerCase().includes(normalizedQuery)
      )                   // full fetched set — infinite scroll suspended
```

Where `normalizedQuery = query.trim().toLowerCase()`.

**Key properties**:
- `filteredArticles` is `NewsArticle[]` — same type as existing `articles`
- When `query` is empty or whitespace, equals the existing paginated `articles` (no behaviour change for non-searching users)
- When `query` is non-empty, equals a subset of `allArticles` (bypasses `displayCount` window)

---

## Hook Interface Change: `useFeed`

`useFeed` already maintains `allArticles` as internal state. This feature requires it to be
exposed in the return value so `FeedContainer` can filter against the full set.

### Before (current)

```typescript
interface UseFeedReturn {
  articles: NewsArticle[]        // paginated slice (slice 0..displayCount)
  status: FeedStatus
  error: string | null
  lastRefreshed: number | null
  hasMore: boolean
  loadMore: () => void
  retry: () => void
}
```

### After (this feature)

```typescript
interface UseFeedReturn {
  articles: NewsArticle[]        // paginated slice (slice 0..displayCount) — unchanged
  allArticles: NewsArticle[]     // full fetched set — NEW; used by FeedContainer for search
  status: FeedStatus
  error: string | null
  lastRefreshed: number | null
  hasMore: boolean
  loadMore: () => void
  retry: () => void
}
```

**Change impact**: Additive only. All existing callers of `useFeed` continue to work unchanged.
`allArticles` is simply forwarded from the internal state variable already present in the hook.

---

## No Changes to Existing Types

`NewsArticle`, `CategoryId`, `FeedStatus`, `FeedState`, `Category`, `CategoryContextValue` —
all unchanged. No new entries needed in `src/types/index.ts`.
