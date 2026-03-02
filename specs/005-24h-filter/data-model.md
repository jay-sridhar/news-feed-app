# Data Model: 005-24h-filter

No new persistent entities. This feature adds a stateless filter applied to the existing `NewsArticle` type.

---

## Filter Logic

```
THRESHOLD_MS = 86_400_000   // 24 hours in milliseconds

isRecent(article: NewsArticle) → boolean
  pubDate is empty or blank   → true   (always show)
  new Date(pubDate) is NaN    → true   (always show)
  Date.now() - date.getTime() <= THRESHOLD_MS  → true  (within window)
  otherwise                   → false  (hide)
```

---

## Existing Type: `NewsArticle` (unchanged)

```
NewsArticle {
  id:         string       — unique identifier (URL-encoded link)
  title:      string       — article headline
  link:       string       — canonical article URL
  pubDate:    string       — raw publish date from RSS (RFC 2822 or ISO 8601, may be empty)
  sourceName: string       — human-readable source name
  categoryId: CategoryId   — category this article belongs to
}
```

`pubDate` is already stored as a raw string. The filter reads it at runtime; no schema change is required.

---

## New Constant (in `src/constants/feed.ts`)

```
FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000   // 86_400_000 ms
```

Adding it to the existing constants file keeps all feed-related numeric constants in one place.
