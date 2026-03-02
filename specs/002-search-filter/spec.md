# Feature Specification: In-Feed Keyword Search

**Feature Branch**: `002-search-filter`
**Created**: 2026-03-01
**Status**: Draft
**Input**: User description: "Search and filter articles by keyword within the active category feed. The search bar should appear below the tab bar, filter the currently loaded articles in real-time as the user types, be clearable, and show a no results state when nothing matches. No server-side search — client-side filtering only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Real-Time Keyword Filter (Priority: P1)

A reader wants to narrow down the articles currently shown by typing a keyword. As they type, the list of cards updates immediately to show only articles whose headline or source name contains the keyword. Stopping typing is not required — results update on every keystroke.

**Why this priority**: This is the core feature. Every other story depends on the search input existing and filtering working.

**Independent Test**: Open the app, wait for articles to load, type a word into the search bar — only articles containing that word should remain visible. Deleting characters progressively restores more articles.

**Acceptance Scenarios**:

1. **Given** articles are loaded in the active feed, **When** the user types a keyword into the search bar, **Then** only articles whose headline or source name contains that keyword (case-insensitive) are shown.
2. **Given** the user has typed a keyword, **When** the user deletes one character, **Then** the list immediately updates to reflect the new (broader) search term.
3. **Given** the user types in mixed case (e.g. "TECH"), **When** matching, **Then** articles containing "tech", "Tech", or "TECH" are all included.

---

### User Story 2 — Clear Search (Priority: P2)

A reader who has filtered the feed wants to quickly return to the full unfiltered article list without manually erasing their query character by character.

**Why this priority**: Without a clear action, search feels like a dead end once applied. Clearability is essential for basic usability.

**Independent Test**: Type any keyword so the list is filtered, then tap the clear button — the input empties and all articles reappear instantly.

**Acceptance Scenarios**:

1. **Given** the search input contains text, **When** the user taps the clear button, **Then** the input is emptied and the full article list is restored.
2. **Given** the search input is empty, **Then** no clear button is visible.
3. **Given** the search input contains text, **When** the user manually deletes all characters, **Then** the clear button disappears and the full article list is restored.

---

### User Story 3 — No Results State (Priority: P3)

A reader types a keyword that matches no articles currently loaded. Instead of seeing a blank screen, they see a friendly message explaining that no articles matched their query.

**Why this priority**: Prevents the app from appearing broken when a search returns zero results.

**Independent Test**: Type a nonsense string (e.g. "zzzzzzzzz") into the search bar — a "no results" message appears instead of a blank list.

**Acceptance Scenarios**:

1. **Given** the user types a keyword with no matching articles, **Then** a "no results" message is shown in place of the article list.
2. **Given** the "no results" state is visible, **When** the user edits the query so that one or more articles match, **Then** the article list reappears immediately.
3. **Given** the "no results" state is visible, **When** the user clears the search, **Then** the full article list is restored.

---

### User Story 4 — Search Resets on Tab Switch (Priority: P4)

When a reader switches to a different category tab, the search query is cleared and the new category's articles are shown unfiltered.

**Why this priority**: Each category feed is independent context. Carrying a search term across tabs would silently suppress articles in the new feed without the user realising why.

**Independent Test**: Type a keyword, then tap a different category tab — the search bar should be empty and the new category's full article list should be shown.

**Acceptance Scenarios**:

1. **Given** the user has an active search query, **When** they switch to any category tab, **Then** the search input is cleared and the new feed is shown unfiltered.
2. **Given** the user is on a tab with no search active, **When** they switch tabs, **Then** the new feed loads normally with the search bar empty.

---

### Edge Cases

- What happens when the search input contains only whitespace? → Treated as empty; all articles are shown and no filter is applied.
- What happens if the user types while articles are still loading? → The search input is not shown during loading; it appears once articles are available.
- What happens if the feed has an error? → The search bar is not shown on the error screen; it becomes visible only after articles load successfully.
- What happens when auto-refresh adds new articles during an active search? → Newly prepended articles are immediately subject to the active filter; only matching new articles appear.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A search input MUST appear below the tab bar and above the article list whenever articles are successfully loaded.
- **FR-002**: As the user types into the search input, the article list MUST update in real time (on every keystroke) to show only articles matching the query.
- **FR-003**: Matching MUST be case-insensitive and check both the article headline and the source name.
- **FR-004**: A whitespace-only or empty search query MUST show all articles with no filter applied.
- **FR-005**: A visible clear button MUST appear inside the search input whenever it contains one or more non-whitespace characters.
- **FR-006**: Tapping the clear button MUST empty the search input and immediately restore the full article list.
- **FR-007**: When the active filter produces zero matching articles, a "no results" message MUST be displayed in place of the article list.
- **FR-008**: Switching to a different category tab MUST clear the search query and show the new category's articles unfiltered.
- **FR-009**: The search MUST filter only the articles currently held in memory; no additional network requests are made when filtering.
- **FR-010**: The search input MUST NOT be shown when the feed is in a loading or error state.

### Key Entities

- **Search Query**: The text string the user has entered into the search input. Transient — lives only for the duration of the current category view and does not persist across tab switches or reloads.
- **Filtered Article List**: The subset of loaded articles whose headline or source name contains the search query. Derived from the full article list; the full list is never discarded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Filtered results appear without perceptible delay — the article list updates within a single animation frame of each keystroke.
- **SC-002**: The search bar and clear button are fully reachable and operable on a 375 px wide screen without horizontal scrolling or zooming.
- **SC-003**: Clearing the search restores the complete article list instantly — no loading state and no network request occurs.
- **SC-004**: Switching tabs with an active search always results in an empty search bar and a fully unfiltered feed for the new category.
- **SC-005**: A zero-result search never shows a blank screen — a descriptive "no results" message is always present.

## Assumptions

- Filtering applies to the **headline** and **source name** fields only. Article body text is not fetched and therefore not searchable.
- The search query is **not persisted** across sessions or page reloads.
- The search bar appears only when articles are visible — it is hidden during initial loading and error states.
- Auto-refresh during an active search silently applies the current filter to any newly prepended articles.
