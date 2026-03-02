# Feature Specification: Expanded Categories with Region Personalisation

**Feature Branch**: `008-categories-region`
**Created**: 2026-03-02
**Status**: Implemented
**Input**: User feedback: "The settings tab should open a separate page (TabBar hidden). By default only have Top Stories and Bookmarks as tabs. In Settings, get user's country and region (India, Tamil Nadu). Categories: National–{Country}, Regional–{State}, Technology (separate from AI), Artificial Intelligence, Software & Jobs, Business & Stocks, Weather. Keep Sports too."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Set My Region (Priority: P1)

As a reader, I select my country and state/region in Settings so the app shows localised National and Regional news tabs with content relevant to where I live.

**Why this priority**: Without a region, the National and Regional category feeds cannot be personalised, making them useless.

**Independent Test**: Open Settings → Region section. Change state from "Tamil Nadu" to "Karnataka". Close Settings. Enable the "Regional – Karnataka" tab. Confirm the feed shows Karnataka-related headlines.

**Acceptance Scenarios**:

1. **Given** I open Settings, **When** I scroll to the Region section, **Then** I see a Country field (currently fixed to "India") and a State / Region dropdown listing the major Indian states.
2. **Given** I change the state selection to "Karnataka", **When** I close Settings, **Then** the "Regional" category tab label updates to "Regional – Karnataka" and its feed URL uses Karnataka / Bengaluru as search terms.
3. **Given** I have a saved region preference and I reload the app, **When** the app initialises, **Then** the saved state is restored from localStorage without any user action.
4. **Given** I am signed in, **When** I change my region, **Then** the new region is written to Firestore so it syncs to other devices.

---

### User Story 2 — Browse Expanded Category Tabs (Priority: P2)

As a reader, I can enable any combination of 9 category tabs — Top Stories, National–India, Regional–{State}, Technology, Artificial Intelligence, Software & Jobs, Business & Stocks, Weather, and Sports — to build a personalised news dashboard.

**Why this priority**: The expanded category set is the primary value of this feature; without it the feed is limited to the original 5 tabs.

**Independent Test**: Open Settings. Enable "Artificial Intelligence" and "Business & Stocks". Close Settings. Confirm both tabs appear. Tap each and confirm relevant articles load.

**Acceptance Scenarios**:

1. **Given** the Settings screen is open, **When** I view the News Categories section, **Then** all 9 category toggles are visible in the fixed order: Top Stories, National–India, Regional–{State}, Technology, Artificial Intelligence, Software & Jobs, Business & Stocks, Weather, Sports.
2. **Given** I enable "Artificial Intelligence", **When** I tap that tab, **Then** articles about AI/ML/ChatGPT appear (not general technology hardware news).
3. **Given** I enable "Technology", **When** I tap that tab, **Then** articles about general technology (hardware, devices, internet) appear — distinct from the AI tab.
4. **Given** I enable "Software & Jobs", **When** I tap that tab, **Then** articles about software development, hiring, layoffs, and startup funding appear.
5. **Given** I enable "Business & Stocks", **When** I tap that tab, **Then** articles about BSE/NSE/Sensex and Indian economic news appear.
6. **Given** I enable "Weather", **When** I tap that tab, **Then** articles about Indian weather, monsoon, and IMD forecasts appear.

---

### User Story 3 — Clean Default Experience (Priority: P2)

As a first-time reader, I open the app and see only "Top Stories" and "Bookmarks" in the tab bar — a clean starting point — and then add the categories I care about from Settings.

**Why this priority**: A cluttered default tab bar with 9 categories would overwhelm new users; the progressive-disclosure approach is better UX.

**Independent Test**: Open the app in a fresh browser context (no localStorage). Confirm only "Top Stories" and "Bookmarks" tabs are visible. Open Settings and confirm all 9 toggles are shown, with only "Top Stories" checked.

**Acceptance Scenarios**:

1. **Given** no localStorage data exists, **When** the app loads, **Then** only the "Top Stories" tab and the "Bookmarks" tab are visible in the tab bar.
2. **Given** only "Top Stories" is enabled, **When** I open Settings, **Then** "Top Stories" is the only toggle in the ON state; all other 8 toggles are OFF.
3. **Given** I enable several categories and reload the app, **When** the app initialises, **Then** exactly the categories I enabled are shown — no extras, none missing.

---

### User Story 4 — Settings as a Dedicated Screen (Priority: P3)

As a reader, when Settings is open I am in a fully separate screen — the news tab bar is hidden — so I can focus on preferences without accidentally tapping the wrong tab.

**Why this priority**: UX clarity; without this, the old implementation left the tab bar visible and users could navigate away while settings was "open".

**Independent Test**: Tap the gear icon. Confirm the navigation tab bar (NewsFlow logo + category tabs) is not visible. Close Settings. Confirm the tab bar reappears.

**Acceptance Scenarios**:

1. **Given** I tap the gear icon, **When** the Settings screen opens, **Then** the sticky tab bar (including the NewsFlow header and category tabs) is completely hidden.
2. **Given** Settings is open, **When** I tap "Close settings", **Then** the full tab bar reappears and the previously active tab is still selected.
3. **Given** Settings is open and I had been viewing the Bookmarks tab, **When** I close Settings, **Then** I return to the Bookmarks tab (not the Top Stories tab).

---

### Edge Cases

- What if the user's saved region state is not in the `INDIA_STATES` list (e.g. from an older build)? → `buildCategories` falls back to using the raw state string as both name and city, so the search URL is still valid.
- What if the user changes region while already on the "Regional" tab? → The feed URL changes, `useFeed` detects the new `feedUrl`, and immediately re-fetches for the new region.
- What if all 8 optional categories are disabled? → Only "Top Stories" and "Bookmarks" are visible; the min-one guard prevents disabling Top Stories too.
- Can the user reorder categories? → No; the order is fixed by the `buildCategories` array.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST support 9 category IDs: `top`, `national`, `regional`, `tech`, `ai`, `softwaredev`, `business`, `weather`, `sports`.
- **FR-002**: The default enabled set for new users (no localStorage) MUST be `['top']` only.
- **FR-003**: The Settings screen MUST include a "Region" section with a Country field (fixed: India) and a State dropdown listing all supported Indian states.
- **FR-004**: Changing the state selection MUST update the "Regional" category tab label to `Regional – {State}` and its feed URL to use `{State} OR {City}` as the Google News search query.
- **FR-005**: The Region preference MUST persist to localStorage key `newsflow_user_region` as `{ country, state }` JSON.
- **FR-006**: When signed in, the Region preference MUST be written to `users/{uid}/preferences/default` (Firestore, merged) and applied from cloud on sign-in.
- **FR-007**: The "National" category MUST use the Google News India national topic RSS feed.
- **FR-008**: The "Artificial Intelligence" category MUST be distinct from "Technology" — AI uses a search-query feed targeting AI/ML/ChatGPT/Gemini; Technology uses the Google News technology topic feed.
- **FR-009**: When the Settings screen is open, the tab bar (header + category tabs) MUST NOT be rendered — Settings is a true full-screen replacement.
- **FR-010**: `buildCategories(region: UserRegion): Category[]` MUST be a pure function producing the full 9-category array; `CATEGORIES` (static export) is `buildCategories(DEFAULT_USER_REGION)` and is used only for ID validation.

### Key Entities

- **UserRegion**: The user's geographic preference. Attributes: `country` (string, currently always `"India"`), `state` (string, one of the 15 supported Indian states).
- **Category** (updated): Same interface as before but `CategoryId` now covers 9 values; `feedUrl` for `regional` is computed dynamically from `UserRegion`.
- **CategoryContextValue** (updated): Adds `categories: Category[]` (memoized from `userRegion`), `userRegion: UserRegion`, `setUserRegion: (r: UserRegion) => void`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Changing the state selection in Settings updates the Regional tab label and feed URL within one render cycle (< 100 ms, no network call required for the label change).
- **SC-002**: All 9 category tabs can be enabled and load articles without errors — 0 broken feeds.
- **SC-003**: On a fresh browser context, exactly 1 category tab (Top Stories) is visible plus Bookmarks — 0 unwanted tabs shown.
- **SC-004**: Region preference survives a hard reload — 100% of the time the correct state is reflected in the Regional tab label on return.
- **SC-005**: When Settings is open, the tab bar is not present in the DOM — 0 category tab buttons are accessible.
- **SC-006**: The AI tab and Technology tab show demonstrably different article sets — 0 identical feeds.

---

## Assumptions

- Country support is limited to India in this version. Adding more countries is a future enhancement.
- The 15 supported Indian states are hardcoded in `INDIA_STATES` in `src/constants/categories.ts`. Adding states requires a code change.
- Feed URLs for `national` (Google News India topic) and `tech` (Google News technology topic) use fixed Google News topic IDs and do not change with region.
- Feed URLs for `ai`, `softwaredev`, `business`, `weather` use Google News search queries with `+` encoded spaces (not `encodeURIComponent`) — this is valid for query string parameters.
- The `regional` feed URL uses `encodeURIComponent` because the state/city names are dynamic and may contain spaces.
- The existing min-one guard from feature 006 applies to the expanded 9-category set.
- Firestore `users/{uid}/preferences/default` document is extended with a `userRegion` field using `{ merge: true }` writes — backward-compatible with clients that don't have 008.
