# Feature Specification: NewsFlow — Categorized News Feed

**Feature Branch**: `001-newsflow-feed`
**Created**: 2026-03-01
**Status**: Draft
**Input**: User description: "Build a mobile-friendly scrollable news feed web app called
'NewsFlow'. It displays categorized news across 5 tabs: Top Stories, Technology & AI,
Tamil Nadu / Chennai, National India, and Sports. News is fetched in real-time from Google
News RSS feeds (no API key needed). Each news card shows: headline, source name, time
published (relative, e.g. '2 hours ago'), and a clickable link to the full article.
Users switch categories via a sticky tab bar at the top. The feed auto-refreshes every
10 minutes. The design should feel like a modern mobile news app — clean, readable, with
smooth infinite scroll."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse Top Stories (Priority: P1)

A user opens NewsFlow for the first time. They land on the "Top Stories" tab and immediately
see a scrollable list of recent news cards. Each card shows the headline, source name, and
how long ago the article was published. Tapping a card opens the full article in a new browser
tab. The tab bar at the top is always visible so the user can switch categories without
scrolling back up.

**Why this priority**: This is the core value proposition of the app — without a working
feed of readable, tappable news cards the product does not exist.

**Independent Test**: Open the app on a mobile device (or 375px viewport). The Top Stories
tab is active by default. At least one page of news cards is visible, each card is tappable,
and opens the correct article URL in a new tab.

**Acceptance Scenarios**:

1. **Given** the app loads, **When** the page finishes rendering, **Then** the Top Stories
   tab is active and a list of news cards is displayed with no user action required.
2. **Given** a news card is visible, **When** the user taps it, **Then** the full article
   opens in a new browser tab and the app remains open in the original tab.
3. **Given** a news card is visible, **When** the user reads it, **Then** they can see the
   headline, the source name, and a relative timestamp (e.g. "2 hours ago").

---

### User Story 2 — Switch News Categories (Priority: P2)

A user wants to read technology news. They tap the "Technology & AI" tab in the sticky tab
bar. The feed immediately replaces with technology-specific articles. They can switch to any
of the five categories — Top Stories, Technology & AI, Tamil Nadu / Chennai, National India,
Sports — and each shows a distinct set of articles relevant to that category.

**Why this priority**: Category switching is the primary navigation mechanism. Without it
the app is a single undifferentiated feed.

**Independent Test**: With the app open on Top Stories, tap each of the five tabs in
sequence. Verify the feed content changes for each tab and is topically relevant
(e.g., Sports tab shows sports headlines, not general news).

**Acceptance Scenarios**:

1. **Given** any category tab is active, **When** the user taps a different tab, **Then** the
   feed immediately updates to show articles for the new category.
2. **Given** the user is mid-scroll in one category, **When** they switch tabs, **Then** the
   new tab's feed starts from the top.
3. **Given** the tab bar, **When** viewed on a mobile screen (375px), **Then** all five tab
   labels are accessible (scrollable tab bar if needed) without requiring a hamburger menu.

---

### User Story 3 — Auto-Refresh Feed (Priority: P3)

A user leaves the app open on their phone while doing something else. After 10 minutes, the
feed silently refreshes in the background, replacing stale articles with the latest news.
The user does not need to manually pull-to-refresh or reload the page to get fresh content.

**Why this priority**: Auto-refresh is a quality-of-life feature that keeps the feed current
for passive readers. The core browsing experience (P1/P2) works without it.

**Independent Test**: Keep the app open on any tab for 10 minutes. Verify that the first
article's timestamp or the article list changes without any user interaction.

**Acceptance Scenarios**:

1. **Given** the app is open and idle, **When** 10 minutes have elapsed, **Then** the
   currently active tab's feed refreshes automatically.
2. **Given** the feed refreshes, **When** new articles arrive, **Then** the user is not
   forcibly scrolled back to the top mid-read (refresh applies to the next full load or
   a soft top-of-feed insertion).
3. **Given** the feed is refreshing, **When** the fetch fails (e.g. network offline),
   **Then** the existing articles remain visible and no crash or blank screen occurs.

---

### User Story 4 — Infinite Scroll (Priority: P4)

A user scrolling through the Top Stories feed reaches the end of the initially loaded cards.
As they continue scrolling, additional articles load automatically — no "Load more" button
required. The scroll feels continuous and smooth.

**Why this priority**: Infinite scroll improves session depth and mimics the UX pattern
users expect from modern news apps. The basic feed (P1) is useful without it.

**Independent Test**: Scroll to the bottom of any category feed. Verify that additional
cards load without a button press and the scroll position is maintained.

**Acceptance Scenarios**:

1. **Given** the user has scrolled to near the bottom of the feed, **When** more articles
   are available, **Then** additional cards load and append below the existing ones.
2. **Given** infinite scroll is in progress, **When** new cards are loading, **Then** a
   visible loading indicator appears at the bottom of the list.
3. **Given** no more articles are available, **When** the user reaches the true end,
   **Then** a "You're all caught up" or equivalent end-of-feed message is displayed.

---

### Edge Cases

- What happens when the RSS feed returns zero articles (empty feed or network failure)?
  → Show a user-friendly "Unable to load news — tap to retry" message; never show a blank
  white screen.
- What happens if a news card has no source name or no published timestamp in the feed data?
  → Source defaults to "Unknown Source"; timestamp defaults to "Recently".
- What happens when an article URL is malformed or missing?
  → The card is still displayed but the tap target is disabled (or links to the feed URL
  as a fallback).
- What happens if the user rapidly switches tabs while a fetch is in-flight?
  → In-flight requests for the previous tab are cancelled (or their results discarded);
  only the selected tab's results are rendered.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display five named category tabs: "Top Stories", "Technology &
  AI", "Tamil Nadu / Chennai", "National India", and "Sports".
- **FR-002**: Each tab MUST fetch and display news articles from the corresponding Google
  News RSS feed for that category.
- **FR-003**: Each news card MUST display: headline text, source/publisher name, and
  relative time since publication (e.g. "3 hours ago", "Just now").
- **FR-004**: Each news card MUST be tappable and MUST open the full article in a new
  browser tab.
- **FR-005**: The tab bar MUST be sticky — always visible at the top of the viewport
  regardless of scroll position.
- **FR-006**: The active feed MUST auto-refresh every 10 minutes without user interaction.
- **FR-007**: The feed MUST support infinite scroll — additional articles load automatically
  as the user approaches the bottom of the list.
- **FR-008**: The app MUST be usable on mobile viewports starting at 375px width.
- **FR-009**: The app MUST handle fetch failures gracefully — displaying an error/retry
  state rather than a blank screen or unhandled exception.
- **FR-010**: Switching tabs MUST cancel or discard any in-flight fetch for the previous
  tab and initiate a fresh fetch for the selected tab.

### Key Entities

- **NewsArticle**: Represents a single news item. Key attributes: headline (title), source
  name (publisher), published timestamp (ISO or RFC date string from RSS), article URL,
  category tag.
- **Category**: One of five predefined feed categories, each mapped to a specific RSS feed
  URL. Attributes: display label, feed URL, tab order.
- **FeedState**: Per-category state tracking current articles, loading status, error state,
  last-refreshed timestamp, and current page/offset for infinite scroll.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can view a news article within 5 seconds of the app loading
  on a standard mobile connection.
- **SC-002**: Switching between category tabs takes under 1 second to display the first
  articles (from cache or fast fetch).
- **SC-003**: All five category tabs display topically relevant articles — 100% of cards
  shown in "Sports" must be sports-related; same for other categories.
- **SC-004**: The feed remains current: articles displayed are no older than 10 minutes
  beyond their original publication at the time of the last auto-refresh.
- **SC-005**: The app is fully usable with one thumb on a 375px-wide screen — no horizontal
  scrolling, no clipped content, no overlapping tap targets.
- **SC-006**: When the network is unavailable, the app shows a recoverable error state
  (not a crash or blank screen) within 10 seconds of the failed fetch attempt.

---

## Assumptions

- Google News RSS feeds are publicly accessible without authentication and return valid
  RSS/Atom XML from the client browser (via a CORS proxy or direct if CORS-permissive).
- "Infinite scroll" means paginating through the RSS feed's available items; the total
  article pool per category is bounded by what the RSS feed provides (typically 10–20
  items per request). Additional pages may be simulated by re-fetching or using feed
  offset parameters where available.
- Relative timestamps (e.g. "2 hours ago") are computed from the article's `pubDate`
  field relative to the user's local device time.
- No caching beyond the current browser session is required (no IndexedDB, no
  service-worker offline mode) for the initial version.
- The app is a single-page application — there are no separate routes per category;
  tab switching is handled entirely in-page.
- No user accounts, preferences, bookmarks, or personalisation features are in scope.
