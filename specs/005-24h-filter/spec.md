# Feature Specification: 24-Hour News Filter

**Feature Branch**: `005-24h-filter`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "24-hour news filter — only show articles published within the last 24 hours. Articles with a missing or unparseable publish date are shown anyway so the feed is never unexpectedly empty. The filter applies across all category tabs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Fresh Feed Only (Priority: P1)

As a reader, I only see articles published in the last 24 hours in every category tab, so the feed always feels current and I am not reading stale news.

**Why this priority**: This is the core rule of the feature. Without it nothing else matters.

**Independent Test**: Load any category tab and verify no visible article has a publish timestamp older than 24 hours.

**Acceptance Scenarios**:

1. **Given** the Top Stories tab is loaded, **When** I view the article list, **Then** all articles shown have a publish date within the last 24 hours.
2. **Given** an article was published 25 hours ago, **When** the feed loads, **Then** that article is not shown.
3. **Given** I switch from Top Stories to Technology tab, **When** the new tab loads, **Then** only articles from the last 24 hours appear.
4. **Given** a feed contains a mix of recent and old articles, **When** the feed renders, **Then** only recent ones are visible and the count reflects the filtered total.
5. **Given** all articles in a category are older than 24 hours, **When** the feed renders, **Then** an empty state message ("No recent articles") is shown instead of a blank screen.

---

### User Story 2 — Graceful Handling of Missing Dates (Priority: P2)

As a reader, if an article has no publish date or an unreadable date I still see it in the feed rather than having it silently disappear.

**Why this priority**: Prevents the feed from being unexpectedly sparse due to data quality issues in the RSS source.

**Independent Test**: Inject articles with missing or malformed pubDate into the feed and confirm they appear alongside valid recent articles.

**Acceptance Scenarios**:

1. **Given** an article has no publish date, **When** the feed loads, **Then** the article is shown.
2. **Given** an article has a malformed publish date (garbled text), **When** the feed loads, **Then** the article is shown.
3. **Given** all articles in a feed have missing dates, **When** the feed loads, **Then** all articles are shown and the feed is not empty.

---

### Edge Cases

- What if the device clock is significantly wrong? → Filter uses device time as-is; no server-time correction.
- What happens to stale articles loaded via auto-refresh? → They are filtered out before being added to the displayed list.
- What about articles at the exact 24-hour boundary? → Articles must be strictly more than 24 hours old to be hidden; articles exactly 24 hours old are shown.
- Are bookmarked articles affected? → No. Saved bookmarks remain accessible regardless of age.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feed MUST exclude articles whose publish date is a valid date and is more than 24 hours before the current time at render.
- **FR-002**: Articles with a missing, null, or unparseable publish date MUST be included in the feed and never filtered out.
- **FR-003**: The 24-hour filter MUST apply consistently across all category tabs.
- **FR-004**: The filter MUST also apply to articles surfaced via auto-refresh, not only on initial page load.
- **FR-005**: When filtering results in zero articles, the feed MUST display a clear empty state message rather than a blank screen.
- **FR-006**: The filter threshold MUST be a rolling 24-hour window (current time minus 86,400 seconds) — not a calendar day boundary.
- **FR-007**: Bookmarked articles MUST NOT be subject to this filter.

### Key Entities

- **Article age**: Elapsed time between an article's publish date and the current moment at render time.
- **Filter threshold**: 24 hours (86,400 seconds), rolling, fixed, not user-configurable in this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of displayed articles with a valid publish date are within the last 24 hours — zero stale articles visible.
- **SC-002**: Articles with missing or malformed publish dates are never hidden — 0% false-positive filtering rate.
- **SC-003**: When all articles are older than 24 hours an empty state is shown within the same render time as a normal feed load.
- **SC-004**: No perceptible delay is introduced by the filter — feed renders within the same time as before this feature.

## Assumptions

- Device time is used as the reference for "now" with no server-time synchronisation.
- "24 hours" means a rolling window, not midnight-to-midnight.
- Articles without a publish date are treated as unknown age and always shown.
- The filter is applied client-side after fetching, not by modifying the RSS query.
- Bookmarked articles bypass this filter and are always shown in the Bookmarks tab.
