# Quickstart: 005-24h-filter

## Manual Test Scenarios

### Scenario 1 — All-fresh feed (happy path)
1. Open the app and check any category tab.
2. All visible articles have relative timestamps like "2 hours ago", "45 minutes ago".
3. No article shows "2 days ago" or older.
4. **Expected**: Feed looks normal.

### Scenario 2 — Stale articles are hidden
1. In `tests/helpers/mockRss.ts`, create an article with `pubDate` set to 48 hours ago.
2. Load the feed.
3. **Expected**: That article does not appear in the list.

### Scenario 3 — Missing date article is shown
1. Create an article with no `pubDate` field (empty string).
2. Load the feed.
3. **Expected**: The article appears alongside other recent articles.

### Scenario 4 — All articles older than 24h
1. Mock all articles in a feed to have pubDates 48 hours ago.
2. Load the tab.
3. **Expected**: "No recent articles. Check back later." message is shown (not a blank screen and not the spinner).

### Scenario 5 — Bookmarks tab unaffected
1. Bookmark an article.
2. Advance the mock clock / set pubDate to 2 days ago.
3. Switch to the Bookmarks tab.
4. **Expected**: The bookmarked article is still visible in the Bookmarks tab regardless of age.

### Scenario 6 — Auto-refresh prunes stale articles
1. Load a feed with recent articles.
2. Wait for auto-refresh to fire (or trigger it manually in tests).
3. Mock the refresh response to return only articles older than 24 hours.
4. **Expected**: After refresh, the feed shows "No recent articles. Check back later."

## Key Test Patterns

```ts
// Inject a 48-hour-old article
const oldPubDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toUTCString()
makeArticles(1, 'Old', { pubDate: oldPubDate })

// Inject an article with no pubDate
makeArticles(1, 'NoDates', { pubDate: '' })
```

## Files Changed

| File | Change |
|---|---|
| `src/utils/articleAge.ts` | NEW — `isRecent()` utility |
| `src/constants/feed.ts` | ADD `FRESHNESS_WINDOW_MS` constant |
| `src/hooks/useFeed.ts` | MODIFY — filter fetched articles before storing |
| `src/components/FeedContainer/FeedContainer.tsx` | MODIFY — add "no recent articles" empty state |
| `tests/e2e/freshness.spec.ts` | NEW — Playwright tests for US1 + US2 |
