# Research: NewsFlow — Categorized News Feed

**Feature**: `001-newsflow-feed`
**Date**: 2026-03-01
**Status**: Complete — all unknowns resolved

---

## 1. CORS Strategy: allorigins.win Proxy

**Decision**: Use `allorigins.win` as CORS proxy in production; proxy to allorigins via
Vite's dev server in development to keep parsing code identical in both environments.

**How allorigins.win works**:
- Endpoint: `https://api.allorigins.win/get?url={encodedUrl}`
- Returns JSON: `{ contents: "<xml>...", status: { url, content_type, http_code } }`
- The `contents` field is the raw RSS/Atom XML string
- allorigins.win sets permissive CORS headers on its responses, making it safe to call
  directly from the browser

**Dev vs. Production approach**:

| Environment | Fetch URL | Parsing |
|-------------|-----------|---------|
| Dev | `/allorigins/get?url={encoded}` (Vite proxy → allorigins) | `response.json().contents` |
| Production | `https://api.allorigins.win/get?url={encoded}` | `response.json().contents` |

Vite proxy config routes `/allorigins` → `https://api.allorigins.win`, so parsing code
is **identical** in dev and prod — only the base URL changes via `import.meta.env.DEV`.

**Rationale**: Keeps a single code path for parsing. The Vite proxy insulates dev
from any future allorigins downtime by allowing easy swap to another proxy locally.

**Alternatives considered**:
- `cors-anywhere` (self-hosted): Adds infrastructure cost — rejected (Principle I + V)
- `corsproxy.io`: Similar to allorigins but less documented — rejected in favour of allorigins
- Fetching Google News RSS directly from browser: Blocked by CORS (Google News
  does not set `Access-Control-Allow-Origin` headers) — not viable

**Risk**: allorigins.win is a free community service with no SLA. If it goes down, the
app shows its error/retry state (FR-009). For a personal/demo app this is acceptable.
Mitigation: the fetch service should have a fallback URL constant that can be swapped
in `constants/categories.ts` without code changes.

---

## 2. rss-parser in the Browser

**Decision**: Use `rss-parser` npm package. Call `parser.parseString(xmlString)` — not
`parseURL()` — since the XML is obtained via allorigins (not fetched directly by the library).

**Key API**:
```typescript
import Parser from 'rss-parser'
const parser = new Parser()
const feed = await parser.parseString(xmlString)
// feed.items[] → array of articles
// feed.title   → feed/channel title
```

**Relevant item fields from Google News RSS**:

| Field | RSS element | Notes |
|-------|-------------|-------|
| `item.title` | `<title>` | Headline, sometimes appended with " - Source Name" |
| `item.link` | `<link>` | Google News redirect URL (`https://news.google.com/rss/articles/...`) |
| `item.pubDate` | `<pubDate>` | RFC 2822 date string (e.g. `Sun, 01 Mar 2026 10:30:00 GMT`) |
| `item.source` | `<source url="...">` | Object `{ $: { url }, _ }` — source/publisher name in `_` |

**Source name extraction**: Google News RSS includes the source in two places:
1. `item.source._` — the text content of `<source>` tag (e.g. `"The Hindu"`) ← **preferred**
2. Appended to `item.title` after ` - ` (e.g. `"PM visits Chennai - The Hindu"`)
   ← fallback if `item.source` is absent

**Rationale**: rss-parser handles both RSS 2.0 and Atom, is well-maintained, and
tree-shakes cleanly with Vite. Bundle size is ~15KB gzipped — acceptable.

**Alternatives considered**:
- `fast-xml-parser` + manual parsing: More control but significantly more code
- Native `DOMParser`: Works in browsers but requires custom traversal logic for each
  RSS field — rejected for added complexity against YAGNI (Principle V)

---

## 3. Google News RSS Feed Structure

**Confirmed fields per item** (tested against provided URLs):

```xml
<item>
  <title>Headline text - Source Name</title>
  <link>https://news.google.com/rss/articles/CBMi...</link>
  <guid isPermaLink="false">...</guid>
  <pubDate>Sun, 01 Mar 2026 08:00:00 GMT</pubDate>
  <description>...</description>  <!-- may be empty or repeat title -->
  <source url="https://thehindubusinessline.com">The Hindu Business Line</source>
</item>
```

**Item count**: Google News RSS returns ~10 items per feed by default; some topic feeds
return up to 20. There is no standard `page` or `offset` parameter on Google News RSS.

**Infinite scroll strategy** (see §5 below).

---

## 4. Relative Timestamp Formatting

**Decision**: Use `date-fns` — specifically `formatDistanceToNow(date, { addSuffix: true })`.

**Examples**:
- `"2 minutes ago"`, `"about 3 hours ago"`, `"1 day ago"`

**Rationale**: `date-fns` is tree-shakeable (only `formatDistanceToNow` imported), widely
used, handles edge cases (future dates, invalid dates), and avoids a custom implementation.

**Alternatives considered**:
- `dayjs` + `relativeTime` plugin: Similar size; date-fns chosen for better tree-shaking
- `Intl.RelativeTimeFormat` (native): No automatic bucket selection (must decide
  seconds/minutes/hours manually) — more code for same result

**Handling missing/invalid pubDate**: If `item.pubDate` is absent or unparseable,
display `"Recently"` (per spec edge case). Wrapped in a `try/catch` in `relativeTime.ts`.

---

## 5. Infinite Scroll Strategy

**Decision**: Use the **IntersectionObserver API** with a sentinel `<div>` at the bottom
of the article list. When the sentinel enters the viewport, trigger load of the next batch.

**Pagination approach** (critical decision given RSS limitations):

Google News RSS does not support pagination parameters. The feed returns a fixed set of
~10–20 articles. Strategy:

1. **Initial load**: Fetch all available items from RSS (up to 20). Display first 10.
2. **"Load more" via IntersectionObserver**: Reveal the next 10 from already-fetched
   items when sentinel is visible — no additional network request.
3. **End of feed**: When all fetched items are displayed, show "You're all caught up."
4. **Auto-refresh** (every 10 min): Re-fetch the RSS and prepend any new items
   (deduplicated by `item.link`). Does not reset scroll position.

This gives the *feel* of infinite scroll without requiring RSS pagination support.

**Rationale**: Simpler than fetching additional pages (which don't exist), avoids
redundant network requests, and satisfies FR-007 and the spec's acceptance scenario for
"You're all caught up" message.

**IntersectionObserver hook** (`useIntersectionObserver.ts`):
```typescript
// Returns a ref to attach to sentinel element, fires callback when visible
useIntersectionObserver(sentinelRef, () => loadMoreArticles(), { threshold: 0.1 })
```

---

## 6. AbortController for Tab Switching

**Decision**: Each call to `fetchFeed()` creates a new `AbortController`. The signal is
passed to `fetch()`. When the user switches tabs, the previous controller's `abort()` is
called before starting the new fetch.

**Implementation in `useFeed` hook**:
```typescript
useEffect(() => {
  const controller = new AbortController()
  fetchFeed(category, controller.signal)
  return () => controller.abort()  // cleanup on unmount or category change
}, [category])
```

**Rationale**: Prevents race conditions where a slow response for Category A arrives
after the user has switched to Category B and overwrites Category B's state (FR-010).

---

## 7. Auto-Refresh (10-Minute Interval)

**Decision**: Use `setInterval` inside `useFeed` hook, cleared on cleanup.

```typescript
useEffect(() => {
  const INTERVAL_MS = 10 * 60 * 1000
  const id = setInterval(() => fetchFeed(category), INTERVAL_MS)
  return () => clearInterval(id)
}, [category])
```

**Scroll preservation on refresh**: New items are prepended; existing items retained.
De-duplication by `link` field prevents duplicates. The user's scroll position is not
reset — new items appear above the current view only if the user scrolls back to the top.

---

## 8. Component Architecture

```
App
└── CategoryProvider                   (React Context: active categoryId)
    ├── TabBar                         (reads/writes categoryId from context)
    └── FeedContainer                  (reads categoryId, owns feed state via useFeed)
        ├── NewsCard × N               (pure presentational; receives NewsArticle props)
        ├── LoadingSpinner             (shown when status === 'loading' and no articles yet)
        ├── ErrorState                 (shown when status === 'error'; has retry button)
        └── ScrollSentinel             (invisible div; IntersectionObserver target)
```

**State ownership**:
- `CategoryContext`: single `categoryId` string + setter — lives at App level
- `FeedContainer`: owns all feed state (articles, status, error, hasMore, displayCount)
  via `useFeed(categoryId)` hook
- No state in `TabBar` or `NewsCard` — they are stateless/controlled

---

## 9. Vite Configuration

**`vite.config.ts` (dev proxy)**:
```typescript
server: {
  proxy: {
    '/allorigins': {
      target: 'https://api.allorigins.win',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/allorigins/, '')
    }
  }
}
```

**Environment-aware base URL in `rssService.ts`**:
```typescript
const ALLORIGINS_BASE = import.meta.env.DEV
  ? '/allorigins'
  : 'https://api.allorigins.win'
```

**Vercel deployment**: Static SPA output (`vite build` → `dist/`). No `vercel.json`
server config needed — Vercel auto-detects Vite projects. Add a `vercel.json` with
`"rewrites": [{ "source": "/(.*)", "destination": "/" }]` for SPA fallback routing
(not strictly needed since there's only one route, but good practice).

---

## 10. Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.x | UI framework |
| `react-dom` | ^18.x | DOM rendering |
| `typescript` | ^5.x | Language |
| `vite` | ^5.x | Build tool |
| `@vitejs/plugin-react` | ^4.x | Vite React plugin |
| `tailwindcss` | ^3.x | Utility CSS |
| `postcss` | ^8.x | Required by Tailwind |
| `autoprefixer` | ^10.x | Required by Tailwind |
| `rss-parser` | ^3.x | RSS XML → JSON parsing |
| `date-fns` | ^3.x | Relative timestamp formatting |

No additional runtime dependencies needed. All principles compliant.
