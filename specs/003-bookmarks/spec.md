# Feature Specification: Bookmarks

**Feature Branch**: `003-bookmarks`
**Created**: 2026-03-01
**Status**: Draft
**Input**: User description: "Bookmarks — save articles to read later. Users can bookmark any article from the feed with a single tap, view all saved articles in a dedicated Bookmarks tab, and remove bookmarks. Bookmarks persist across sessions using localStorage. No user accounts — bookmarks are device-local only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Bookmark an Article (Priority: P1)

A reader finds an interesting article in the feed and wants to save it for later. They tap a bookmark icon on the article card. The icon immediately changes to a filled/active state to confirm the article has been saved. Tapping the icon again removes the bookmark and the icon returns to its empty state.

**Why this priority**: This is the foundational action. Without the ability to add bookmarks, no other bookmark feature has value.

**Independent Test**: Open the feed, tap the bookmark icon on any card — the icon changes to filled. Reload the page — the icon remains filled. Tap it again — the icon returns to empty.

**Acceptance Scenarios**:

1. **Given** the feed is loaded, **When** the user taps the bookmark icon on an article card, **Then** the icon immediately shows a filled/active state indicating the article is saved.
2. **Given** an article is bookmarked, **When** the user taps its bookmark icon again, **Then** the icon returns to the empty/inactive state and the bookmark is removed.
3. **Given** the user has bookmarked articles and reloads the page, **When** the feed loads, **Then** previously bookmarked articles still show the filled bookmark icon.
4. **Given** the user searches and filters the feed, **When** a bookmarked article is visible in the filtered results, **Then** its bookmark icon shows the filled/active state.

---

### User Story 2 — View Saved Bookmarks (Priority: P2)

A reader wants to see all the articles they have saved. They tap a "Bookmarks" tab in the tab bar to switch to a dedicated view listing all their saved articles, most recently bookmarked first. Each saved article shows the same headline, source, and timestamp as in the feed and is tappable to open the full article.

**Why this priority**: Viewing saved articles is the primary payoff of bookmarking. Without this, saved articles are inaccessible.

**Independent Test**: Bookmark 2 articles, then tap the Bookmarks tab — both saved articles appear in the list, most recently bookmarked first. Tap one — it opens in a new browser tab.

**Acceptance Scenarios**:

1. **Given** the user has bookmarked at least one article, **When** they tap the Bookmarks tab, **Then** all saved articles are shown in a list, most recently bookmarked first.
2. **Given** the Bookmarks tab is active, **When** the user taps an article card, **Then** the original article URL opens in a new browser tab and the Bookmarks tab remains open.
3. **Given** the Bookmarks tab is active, **When** the user has no saved articles, **Then** an empty-state message is shown (e.g. "No bookmarks yet. Tap the bookmark icon on any article to save it.").
4. **Given** the user reloads the page, **When** they open the Bookmarks tab, **Then** previously saved articles are still present.

---

### User Story 3 — Remove a Bookmark (Priority: P3)

A reader in the Bookmarks tab decides they no longer want a saved article. They tap the bookmark icon on the article card — the article disappears from the Bookmarks list immediately. The same icon on that article in the regular feed reverts to its empty state.

**Why this priority**: Managing the bookmarks list requires the ability to remove items. Without removal, the list grows indefinitely and loses usefulness.

**Independent Test**: Bookmark an article, go to the Bookmarks tab, tap the bookmark icon on that article — it disappears from the list instantly. Switch back to the feed — the article's bookmark icon is now empty.

**Acceptance Scenarios**:

1. **Given** the Bookmarks tab shows a saved article, **When** the user taps the bookmark icon on that article, **Then** the article is removed from the list immediately (no confirmation dialog required).
2. **Given** an article is removed from the Bookmarks tab, **When** the user switches to the feed and finds the same article, **Then** its bookmark icon shows the empty/inactive state.
3. **Given** the user removes all bookmarks, **When** the last article is removed, **Then** the empty-state message appears immediately.

---

### Edge Cases

- What happens if the user bookmarks the same article more than once? → The bookmark action is a toggle — a second tap removes it. The article is never duplicated in the bookmarks list.
- What happens when the device's storage is full? → A non-blocking error notice appears and the bookmark is not saved. Existing bookmarks are unaffected.
- What happens to bookmarks if the user clears browser storage? → All bookmarks are lost — this is expected behaviour for device-local storage. No recovery is possible.
- What if a bookmarked article's source URL becomes invalid or the site removes it? → The bookmarked record is retained as-is; tapping it will open whatever the URL resolves to (or a 404). The app makes no attempt to verify link validity.
- What is the maximum number of bookmarks? → No user-facing limit is enforced. Practical ceiling is the device's available storage quota.
- What happens in the Bookmarks tab when the search bar (from 002-search-filter) is active in the feed? → The Bookmarks tab has its own context; switching to it does not apply or inherit the feed's search query.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every article card in the news feed MUST display a bookmark icon button in a consistent position on the card.
- **FR-002**: Tapping the bookmark icon on an unbookmarked article MUST save the article and immediately display the icon in a filled/active state.
- **FR-003**: Tapping the bookmark icon on an already-bookmarked article MUST remove the bookmark and immediately display the icon in an empty/inactive state.
- **FR-004**: Bookmarks MUST persist across browser sessions and page reloads without requiring a user account or login.
- **FR-005**: A "Bookmarks" tab MUST be added to the tab bar, accessible alongside the existing category tabs.
- **FR-006**: The Bookmarks tab MUST display all saved articles ordered by most recently bookmarked first.
- **FR-007**: Each article in the Bookmarks tab MUST display the same headline, source name, and relative timestamp as in the news feed.
- **FR-008**: Tapping an article in the Bookmarks tab MUST open the article's original URL in a new browser tab.
- **FR-009**: When the user has no saved bookmarks, the Bookmarks tab MUST show a descriptive empty-state message rather than a blank screen.
- **FR-010**: Tapping the bookmark icon on an article in the Bookmarks tab MUST remove it from the list immediately.
- **FR-011**: A bookmarked article's icon MUST reflect its saved status wherever it appears — both in the feed and in the Bookmarks tab — consistently.
- **FR-012**: Bookmarks MUST be stored only on the user's device; no data is transmitted to any server.

### Key Entities

- **Bookmark**: A saved reference to an article. Contains: article headline, source name, relative timestamp, original article URL, and the date/time the bookmark was created. Bookmarks are owned by the device, not a user account.
- **Bookmarks List**: The ordered collection of all saved bookmarks on the device. Ordered by creation date, most recent first. Persisted across sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can bookmark an article in a single tap — the icon changes state within one animation frame of the tap.
- **SC-002**: All saved bookmarks are visible in the Bookmarks tab within one second of navigating to it (no network requests required).
- **SC-003**: Bookmarked articles remain accessible after the browser is closed and reopened — 100% of bookmarks survive a full page reload.
- **SC-004**: Removing a bookmark takes a single tap — the article disappears from the Bookmarks list within one animation frame.
- **SC-005**: The bookmark icon is reachable and tappable on a 375 px wide screen without horizontal scrolling, zooming, or accidentally triggering the article link.
- **SC-006**: The Bookmarks tab is reachable from anywhere in the app in a single tap.

## Assumptions

- Bookmarks capture a **snapshot** of the article at the time of saving (headline, source, URL, timestamp). If the feed later serves updated content for the same URL, the bookmarked copy is unaffected.
- The Bookmarks tab does **not** include the real-time search bar from `002-search-filter`. Filtering bookmarks is out of scope for this feature.
- There is no **undo** for bookmark removal — deletion is immediate and final. A confirmation dialog is not required given the low stakes and the ease of re-bookmarking.
- The Bookmarks tab does **not** auto-refresh or fetch live data; it renders only from the locally persisted store.
- The bookmark icon position on the article card must not interfere with the article link tap target — the icon must be independently tappable without navigating to the article.
- Articles in the Bookmarks tab are displayed using the same visual card format as the news feed (same headline, source, and timestamp layout).
