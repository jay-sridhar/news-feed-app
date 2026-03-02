# Component Contracts: 005-24h-filter

## New Utility: `src/utils/articleAge.ts`

```ts
export const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Returns true if the article should be shown.
 * - Returns true for missing, null, or unparseable pubDate (graceful fallback)
 * - Returns true if age <= FRESHNESS_WINDOW_MS
 * - Returns false if age > FRESHNESS_WINDOW_MS
 */
export function isRecent(pubDate: string): boolean
```

---

## Modified: `src/hooks/useFeed.ts`

The `setAllArticles` call in `doFetch` filters the fetched array before storing:

```
Before (initial fetch):
  setAllArticles(fetched)

After:
  setAllArticles(fetched.filter(a => isRecent(a.pubDate)))

Before (refresh):
  const newItems = fetched.filter(a => !existingLinks.has(a.link))
  return [...newItems, ...prev]

After:
  const newItems = fetched
    .filter(a => isRecent(a.pubDate))
    .filter(a => !existingLinks.has(a.link))
  return [...newItems, ...prev]
```

No change to the public interface of `useFeed`.

---

## Modified: `src/components/FeedContainer/FeedContainer.tsx`

New empty-state branch after the existing `status === 'error'` guard:

```
// Existing error guard (unchanged)
if (status === 'error') { ... }

// NEW: successful fetch but all articles filtered out
if (status === 'success' && allArticles.length === 0) {
  return (
    <p className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
      No recent articles. Check back later.
    </p>
  )
}

// Existing zero-articles guard becomes unreachable for normal feed flow
// but kept as safety net for the articles.length === 0 case during loading
```

---

## Modified: `src/constants/feed.ts`

Add `FRESHNESS_WINDOW_MS` export:

```ts
export const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000
```

(The same constant is also exported from `src/utils/articleAge.ts` for use in tests.)
