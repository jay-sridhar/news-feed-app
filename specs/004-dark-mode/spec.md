# Feature Specification: Dark Mode

**Feature Branch**: `004-dark-mode`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Dark mode — system-preference-aware theme that follows the user's OS dark/light mode setting. The app should automatically apply a dark theme when the OS is set to dark mode and a light theme otherwise. Users can also manually toggle between dark and light mode using a button in the header. The chosen preference persists across sessions using localStorage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Auto-Detect OS Theme (Priority: P1)

A reader opens the app on their phone which is set to dark mode. Without doing anything, the app immediately displays in a dark theme — dark background, light text, dark cards. If they switch their phone's display mode to light, the app updates to a light theme automatically. The experience feels native and effortless.

**Why this priority**: This is the foundational behaviour. Users who have enabled dark mode at the OS level expect all well-behaved apps to respect that setting automatically. Without this, dark mode is useless even with a manual toggle.

**Independent Test**: Set OS to dark mode, open the app — the app renders with a dark background. Set OS to light mode — the app renders with a light background. Both happen without any user action inside the app.

**Acceptance Scenarios**:

1. **Given** the OS is set to dark mode and no manual preference is stored, **When** the app loads, **Then** the app renders in dark theme immediately without a visible light flash.
2. **Given** the OS is set to light mode and no manual preference is stored, **When** the app loads, **Then** the app renders in light theme.
3. **Given** the app is open with no manual preference and the OS switches from light to dark, **When** the OS theme changes, **Then** the app updates to dark theme in real time without a page reload.
4. **Given** the app is open with no manual preference and the OS switches from dark to light, **When** the OS theme changes, **Then** the app updates to light theme in real time.

---

### User Story 2 — Manual Theme Toggle (Priority: P2)

A reader wants to use the app in dark mode even though their OS is set to light mode (or vice versa). They tap a sun/moon icon button in the app header. The theme switches instantly. The toggle button reflects the new mode. On their next visit, the app remembers their choice.

**Why this priority**: Some users prefer a different theme than their OS setting for reading-heavy apps. The toggle gives them explicit control without changing a system-wide setting.

**Independent Test**: OS is set to light mode. Tap the toggle button — app switches to dark theme. Reload the page — app still shows dark theme. Tap the toggle again — app switches back to light theme.

**Acceptance Scenarios**:

1. **Given** the app is in light theme, **When** the user taps the toggle button, **Then** the entire app switches to dark theme immediately.
2. **Given** the app is in dark theme, **When** the user taps the toggle button, **Then** the entire app switches to light theme immediately.
3. **Given** the user has manually set dark mode, **When** the OS is in light mode, **Then** the app still shows dark theme (manual preference overrides OS).
4. **Given** the user has manually set light mode, **When** the OS is in dark mode, **Then** the app still shows light theme (manual preference overrides OS).
5. **Given** the toggle button is visible, **When** the app is in dark mode, **Then** the button shows a sun icon (indicating "switch to light"). **When** the app is in light mode, **Then** the button shows a moon icon (indicating "switch to dark").

---

### User Story 3 — Persistent Preference (Priority: P3)

A reader sets the app to dark mode using the toggle. They close the browser tab, reopen it the next day, and the app remembers their dark mode preference without them having to toggle again.

**Why this priority**: Without persistence, the toggle is frustrating — users must re-set their preference on every visit. Persistence makes the feature genuinely useful.

**Independent Test**: Manually toggle to dark mode. Hard-reload the page. App loads in dark mode without a visible light flash. Close the browser and reopen — still dark mode.

**Acceptance Scenarios**:

1. **Given** the user has toggled to dark mode, **When** they hard-reload the page, **Then** the app loads in dark mode immediately.
2. **Given** the user has toggled to light mode while OS is dark, **When** they hard-reload the page, **Then** the app loads in light mode, not following the OS.
3. **Given** the user clears browser storage (localStorage), **When** the page loads, **Then** the app falls back to the current OS preference.

---

### Edge Cases

- What if the OS theme changes while the user has a manual preference set? → Manual preference wins; OS change is ignored until the stored preference is cleared.
- What if the user's browser does not support OS theme detection? → App defaults to light theme.
- Does dark mode apply to all views? → Yes — feed, Bookmarks tab, search bar, loading states, and error states all respect the active theme.
- Is there a "reset to OS default" option? → No — out of scope. The toggle only switches between light and dark. Clearing browser storage restores OS-following behaviour.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST detect the operating system's current dark/light mode preference when it loads.
- **FR-002**: When no manual preference is stored, the app MUST automatically apply the theme that matches the OS setting.
- **FR-003**: When no manual preference is stored and the OS theme changes while the app is open, the app MUST update its theme in real time.
- **FR-004**: A theme toggle button MUST be visible in the app header at all times.
- **FR-005**: Tapping the toggle button MUST switch the app between dark and light themes immediately.
- **FR-006**: The toggle button MUST display a visual indicator showing which mode is currently active (sun icon = currently dark, showing option to go light; moon icon = currently light, showing option to go dark).
- **FR-007**: When the user has manually toggled the theme, that preference MUST take priority over the OS setting.
- **FR-008**: The manual theme preference MUST persist across page reloads and browser sessions.
- **FR-009**: If no manual preference is found in storage, the app MUST fall back to the OS preference.
- **FR-010**: The dark theme MUST apply consistently to all parts of the app — tab bar, article cards, search bar, bookmarks view, loading states, and error states.
- **FR-011**: The app MUST NOT show a visible flash of the wrong theme on load when a stored preference exists.

### Key Entities

- **ThemePreference**: The user's manually stored theme choice. Values: `'dark'` or `'light'`. Stored device-locally. Absent when the user has not made a manual choice (meaning: follow the OS).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The app renders in the correct theme on initial load — no visible flash of the opposite theme — for 100% of page loads when a stored preference exists.
- **SC-002**: Tapping the toggle button switches the theme within one animation frame (instant, no delay).
- **SC-003**: The stored theme preference survives a browser close-and-reopen — 100% retention.
- **SC-004**: All UI surfaces (background, text, cards, tab bar, search input) are clearly readable in both dark and light themes at 375 px viewport width.
- **SC-005**: When no manual preference is set, the app reacts to an OS theme change within one second, without a page reload.
- **SC-006**: The toggle button is visible and tappable on a 375 px screen without horizontal overflow.

## Assumptions

- Dark theme uses a visually distinct palette: near-black backgrounds, light gray text, adjusted card and border colours. The exact palette is determined during implementation — this spec does not prescribe specific colour values.
- The toggle button is placed in the header row alongside the "NewsFlow" title in the tab bar area.
- "Follow OS" is the implicit default when no manual preference is stored; there is no explicit "Follow OS" option in the UI.
- The feature does not require a user account — preferences are device-local only.
- Images from RSS feeds (if any) are not colour-managed for dark mode — only the app's own UI chrome and text is themed.
- The dark theme must meet basic readability standards (sufficient contrast between text and background) but formal WCAG AA/AAA compliance is out of scope for this iteration.
