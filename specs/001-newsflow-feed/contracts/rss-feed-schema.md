# Contract: Google News RSS Feed Schema

**Consumer**: `rssService.ts` (internal)
**Provider**: Google News RSS (external, via allorigins.win proxy)
**Date**: 2026-03-01

---

## Feed URLs

| Category | Feed URL |
|----------|----------|
| Top Stories | `https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en` |
| Technology & AI | `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en` |
| Tamil Nadu / Chennai | `https://news.google.com/rss/search?q=Tamil+Nadu+OR+Chennai&hl=en-IN&gl=IN&ceid=IN:en` |
| National India | `https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtVnVLQUFQAQ?hl=en-IN&gl=IN&ceid=IN:en` |
| Sports | `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en` |

---

## Expected RSS 2.0 Channel Structure

```xml
<rss version="2.0">
  <channel>
    <title>Top Stories - Google News</title>
    <link>https://news.google.com/...</link>
    <language>en-IN</language>
    <item>
      <title>Headline - Source Name</title>
      <link>https://news.google.com/rss/articles/CBMi...</link>
      <guid isPermaLink="false">unique-id</guid>
      <pubDate>Sun, 01 Mar 2026 10:30:00 GMT</pubDate>
      <description>...</description>
      <source url="https://publisher.com">Publisher Name</source>
    </item>
    <!-- ~10–20 <item> elements -->
  </channel>
</rss>
```

---

## Field Guarantees

| Field | Presence | Format | Notes |
|-------|----------|--------|-------|
| `<title>` | Always | Plain text, may end with ` - {source}` | Strip source suffix for display |
| `<link>` | Always | `https://news.google.com/rss/articles/...` | Google redirect URL |
| `<pubDate>` | Usually | RFC 2822 (`Day, DD Mon YYYY HH:MM:SS GMT`) | Occasionally absent on older items |
| `<source>` | Usually | XML element with `url` attribute and text content | Text content = publisher name |
| `<guid>` | Always | Opaque string, `isPermaLink="false"` | Use as fallback ID only |
| `<description>` | Sometimes | HTML or text snippet | Not used in this app |

---

## Parsing Contract (rss-parser mapped output)

After `parser.parseString(xml)`, each item maps to:

```typescript
{
  title: string          // item.title
  link: string           // item.link
  pubDate: string        // item.pubDate
  guid: string           // item.guid
  source: {              // item.source (rss-parser custom field)
    $: { url: string }
    _: string            // publisher display name
  } | undefined
}
```

The `rssService` MUST configure `rss-parser` with a custom field mapping to capture
`source` (not parsed by default):

```typescript
new Parser({
  customFields: {
    item: [['source', 'source', { keepArray: false }]]
  }
})
```

---

## Error Conditions

| Condition | Expected Behaviour |
|-----------|-------------------|
| HTTP 4xx/5xx from allorigins | Throw error; `FeedState.status` → `'error'` |
| `contents` field empty or null | Throw error with message "Empty feed response" |
| XML parse failure | Throw error; surface as recoverable error state |
| Zero items in parsed feed | Return empty array; display error/retry (not crash) |
| `AbortError` from cancelled fetch | Silently ignored; do not update state |
