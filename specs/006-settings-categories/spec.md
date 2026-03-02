# Feature Specification: Settings Page with Category Personalisation

**Feature Branch**: `006-settings-categories`
**Created**: 2026-03-02
**Status**: Implemented — extended by `008-categories-region`
**Input**: User description: "Settings page with category personalisation — a dedicated Settings screen accessible from the header. Users can select which news categories they want to see. Deselected categories are hidden from the tab bar. At least one category must remain selected. The selection persists across sessions."

> **Note**: Feature 008 expanded the category set from 5 to 9 and changed the default enabled set to `['top']` only. See `specs/008-categories-region/` for those changes. This spec describes the core settings/toggle mechanism which remains unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Select My Categories (Priority: P1)

As a reader, I open Settings and choose exactly which news categories I care about, so the tab bar only shows topics relevant to me.

**Why this priority**: This is the core personalisation value. Without it the Settings page has no purpose.

**Independent Test**: Open Settings, deselect two categories, close Settings, and confirm the tab bar no longer shows those two tabs.

**Acceptance Scenarios**:

1. **Given** I am on any screen, **When** I tap the Settings icon in the header, **Then** a Settings screen opens showing all available categories each with a toggle or checkbox.
2. **Given** the Settings screen is open and multiple categories are enabled, **When** I deselect "Regional – Tamil Nadu" and "Sports", **Then** those two tabs disappear from the tab bar immediately after I close Settings.
3. **Given** only one category is selected, **When** I try to deselect it, **Then** the action is blocked and a message explains at least one category must remain selected.
4. **Given** I deselect a category and close Settings, **When** I reload the app, **Then** the deselected category is still absent from the tab bar.
5. **Given** the active tab is a category I then deselect in Settings, **When** I close Settings, **Then** the app automatically switches to another selected category.

---

### User Story 2 — Restore a Category (Priority: P2)

As a reader, I can re-enable a category I previously hid, so I can change my mind without losing access to any topic.

**Why this priority**: Personalisation is only useful if it is reversible without friction.

**Independent Test**: Deselect a category, reload, re-open Settings, re-enable it, close Settings — confirm the tab reappears.

**Acceptance Scenarios**:

1. **Given** a category is deselected and hidden, **When** I open Settings and re-enable it, **Then** its tab reappears in the tab bar.
2. **Given** I re-enable a previously hidden category, **When** I tap its tab, **Then** it loads articles normally as if it had never been hidden.

---

### User Story 3 — Settings Accessible Everywhere (Priority: P3)

As a reader, I can reach Settings from any screen in the app (feed, search, bookmarks), so I never have to navigate back to a specific place first.

**Why this priority**: Accessibility of Settings affects discoverability but is lower priority than the category selection itself.

**Independent Test**: From the Bookmarks tab, tap the Settings icon and confirm the Settings screen opens.

**Acceptance Scenarios**:

1. **Given** I am viewing the Bookmarks tab, **When** I tap the Settings icon, **Then** the Settings screen opens.
2. **Given** I am in the middle of a search, **When** I tap the Settings icon, **Then** the Settings screen opens without losing my search query.

---

### Edge Cases

- What if a user has no network when they change categories? → Category preferences are stored locally and applied immediately; no network call needed.
- What if a future version adds a new category? → It appears as enabled by default in the Settings list.
- Can the user reorder categories? → No, ordering is not in scope for this feature (fixed order).
- What if the active tab is deselected? → The app automatically switches to the first remaining selected category.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a Settings screen accessible via an icon in the header from any tab.
- **FR-002**: The Settings screen MUST display all available news categories, each with a toggle to enable or disable it.
- **FR-003**: When a category is disabled, its tab MUST be removed from the tab bar immediately upon closing Settings.
- **FR-004**: When a category is re-enabled, its tab MUST reappear in the tab bar in its original position.
- **FR-005**: At least one category MUST remain enabled at all times; the system MUST prevent the last selected category from being deselected.
- **FR-006**: If the currently active tab is deselected, the app MUST automatically switch to another enabled category.
- **FR-007**: Category preferences MUST persist across page reloads and browser sessions.
- **FR-008**: The Settings screen MUST also display other app-level preferences (dark mode toggle at minimum) so it acts as a central preference hub.

### Key Entities

- **Category preference**: A record of which categories are enabled or disabled for this user. Attributes: category ID, enabled (boolean).
- **Settings screen**: A dedicated view separate from the news feed, showing all configurable preferences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open Settings, deselect a category, and see the tab bar update in under 5 seconds end-to-end.
- **SC-002**: Category preferences survive a hard reload — 100% of the time the tab bar reflects the user's last saved selection on return.
- **SC-003**: The "minimum one category" guard prevents an empty tab bar in 100% of attempts to deselect the final category.
- **SC-004**: All categories (9 as of feature 008) are reachable (re-enable) from Settings at any time, with 0 categories permanently hidden.
- **SC-005**: Settings is reachable from every tab in the app — 0 screens require navigation before accessing Settings.

## Assumptions

- Category order in Settings and the tab bar follows the fixed app-defined order — drag-to-reorder is not in scope. (As of 008: Top Stories, National–India, Regional–{State}, Technology, AI, Software & Jobs, Business & Stocks, Weather, Sports.)
- ~~All 5 categories start as enabled by default for new users.~~ **Updated by 008**: Only "Top Stories" is enabled by default for new users.
- Category preferences are stored locally (device-level) in this feature; cross-device sync is handled by the Google Sign-in feature (007).
- The Settings screen replaces the need for a modal — it is a full navigable screen, not a pop-up.
- The dark mode toggle moves into Settings as well, keeping the header cleaner (the header toggle from 004 may be retired or remain as a shortcut).
