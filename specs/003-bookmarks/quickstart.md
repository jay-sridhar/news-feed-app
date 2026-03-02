# Quickstart: Bookmarks

**Feature**: `003-bookmarks`
**Date**: 2026-03-01

---

## Pre-requisites

- App running: `npm run dev` → http://localhost:5173
- Open Chrome DevTools, set device to iPhone 14 (390 × 844)
- Open the **Application** panel → **Local Storage** → `http://localhost:5173` to inspect the `newsflow_bookmarks` key

---

## Scenario 1: Bookmark an Article (US1 — P1)

1. Open the app. Wait for Top Stories to load.
2. Each article card shows a **bookmark icon** (outline/empty) in the top-right corner.
3. Tap the bookmark icon on the first article.
4. **Expected**: Icon immediately fills/changes to active state. No spinner, no delay.
5. Open DevTools → Application → Local Storage → confirm `newsflow_bookmarks` contains a JSON array with one entry.
6. Hard-reload the page (`Cmd+Shift+R`).
7. **Expected**: The bookmarked article's icon is still filled after reload.
8. Tap the filled icon again.
9. **Expected**: Icon returns to empty/outline. The bookmark is removed. localStorage entry is gone (or array is empty).

**Failure indicators**: No bookmark icon visible; icon doesn't change on tap; bookmark lost after reload.

---

## Scenario 2: View Saved Bookmarks (US2 — P2)

1. Bookmark 2 or 3 articles from different categories (e.g. Top Stories and Sports).
2. Tap the **Bookmarks** tab in the tab bar.
3. **Expected**: All bookmarked articles appear in a list, most recently bookmarked first.
4. Each card shows the same headline, source, and relative timestamp as in the feed.
5. Tap one article card.
6. **Expected**: The original article opens in a new browser tab. The Bookmarks tab stays open.
7. Tap a different category tab, then come back to Bookmarks.
8. **Expected**: Bookmarks are still there.

**Empty state test**:
1. Remove all bookmarks (tap each icon).
2. Return to the Bookmarks tab.
3. **Expected**: A message like "No bookmarks yet. Tap the bookmark icon on any article to save it." appears — no blank screen.

**Failure indicators**: Bookmarks tab missing from tab bar; articles out of order; empty state is blank.

---

## Scenario 3: Remove a Bookmark (US3 — P3)

1. Bookmark an article from the Top Stories feed. Confirm icon is filled.
2. Navigate to the **Bookmarks** tab.
3. Tap the bookmark icon on that article in the Bookmarks tab.
4. **Expected**: Article disappears from the Bookmarks list immediately. No confirmation dialog.
5. Switch back to the **Top Stories** feed.
6. Find the same article. **Expected**: Its bookmark icon is now empty/outline.

**Last bookmark test**:
1. Ensure only one bookmark remains.
2. Remove it from the Bookmarks tab.
3. **Expected**: Empty-state message appears immediately.

---

## Scenario 4: Edge Cases

### Duplicate bookmark prevention
1. Tap the bookmark icon on an article → saved (icon fills).
2. Switch tabs, come back to the same article, tap the icon again → removed (icon empties).
3. Check Bookmarks tab — only one entry existed at most, none now.

### Bookmark icon doesn't trigger article navigation
1. On a card with a link, tap the bookmark icon precisely.
2. **Expected**: Only the bookmark state changes. The article does NOT open in a new tab.

### Storage quota (simulate)
1. In DevTools Console: `localStorage.setItem('test_fill', 'x'.repeat(5 * 1024 * 1024))`
2. Try to bookmark an article.
3. **Expected**: A non-blocking error notice appears (or the bookmark silently fails). The app does not crash. Existing bookmarks are unaffected.
4. Clean up: `localStorage.removeItem('test_fill')`

---

## Validate the Setup

- [ ] Bookmark icon visible on every article card at 375 px viewport
- [ ] Bookmark icon tap is independent from article link tap (tapping icon doesn't open article)
- [ ] Icon fills immediately on bookmark, empties immediately on unbookmark
- [ ] Bookmarks persist across a full page hard-reload
- [ ] Bookmarks tab appears in the tab bar as the 6th tab
- [ ] Bookmarks tab shows all saved articles, most recently bookmarked first
- [ ] Bookmarks tab shows empty-state message when no articles are saved
- [ ] Tapping an article in Bookmarks opens the article URL in a new tab
- [ ] Removing a bookmark from the Bookmarks tab updates the icon in the feed
- [ ] No horizontal overflow or layout breakage at 375 px with bookmark button visible

---

## Running the E2E Tests

```bash
npm test                    # run all Playwright tests (includes bookmarks.spec.ts)
npm run test:ui             # interactive mode
npm run test:headed         # see browser window
```

Test file: `tests/e2e/bookmarks.spec.ts`
