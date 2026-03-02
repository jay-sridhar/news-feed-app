# Feature Specification: Google Sign-In with Cloud Sync

**Feature Branch**: `007-google-auth-sync`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Google Sign-in with Firebase — users can sign in with their Google account. After signing in, bookmarks and category preferences sync to the cloud via Firebase so they are available on any device. Signed-out users continue to use the app with local-only storage. Sign-in is optional and non-intrusive."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sign In with Google (Priority: P1)

As a reader, I can sign in with my Google account from Settings so the app knows who I am and can sync my data across devices.

**Why this priority**: Authentication is the prerequisite for all cloud sync. Without it no personalisation can follow the user.

**Independent Test**: Tap "Sign in with Google" in Settings, complete Google OAuth, return to the app — confirm the header or Settings shows the signed-in user's name or avatar.

**Acceptance Scenarios**:

1. **Given** I am signed out, **When** I open Settings, **Then** I see a "Sign in with Google" button.
2. **Given** I tap "Sign in with Google", **When** I complete the Google authentication flow, **Then** I am returned to the app and Settings shows my name and profile photo.
3. **Given** I am signed in, **When** I reopen the app after closing it, **Then** I am still signed in without needing to authenticate again.
4. **Given** I am signed in, **When** I tap "Sign out" in Settings, **Then** my session ends and Settings shows the "Sign in with Google" button again.
5. **Given** I cancel the Google authentication flow, **When** I return to the app, **Then** I remain signed out and the app continues working normally.

---

### User Story 2 — Cloud Sync of Bookmarks (Priority: P2)

As a signed-in reader, my bookmarks are saved to the cloud so that when I open the app on a different device my saved articles are already there.

**Why this priority**: Bookmarks are the primary user-generated content in the app. Cross-device access is the main value of signing in.

**Independent Test**: Bookmark an article on device A while signed in. Open the app on device B with the same account. Confirm the bookmark appears in the Bookmarks tab without any manual action.

**Acceptance Scenarios**:

1. **Given** I am signed in and I bookmark an article, **When** I open the app on another device with the same account, **Then** the bookmarked article appears in my Bookmarks tab.
2. **Given** I am signed in and I remove a bookmark, **When** I switch to another device, **Then** the bookmark is also absent there.
3. **Given** I had bookmarks saved locally before signing in, **When** I sign in for the first time, **Then** my existing local bookmarks are merged into my cloud account (none are lost).
4. **Given** I sign out, **When** I view the Bookmarks tab, **Then** only locally stored bookmarks are shown (the cloud ones are no longer visible).

---

### User Story 3 — Cloud Sync of Category Preferences (Priority: P3)

As a signed-in reader, my category selection from Settings is saved to the cloud so my personalised tab bar is the same on every device.

**Why this priority**: Category preferences are the second key personalisation. Lower priority than bookmarks because the impact of losing them is smaller.

**Independent Test**: Deselect two categories on device A while signed in. Open the app on device B. Confirm the same two categories are hidden.

**Acceptance Scenarios**:

1. **Given** I am signed in and I disable the "Sports" category in Settings, **When** I open the app on another device, **Then** "Sports" is also absent from the tab bar there.
2. **Given** I am signed out, **When** I change category preferences, **Then** changes are saved locally only and do not sync.

---

### User Story 4 — Offline-First for Signed-Out Users (Priority: P4)

As a reader who has not signed in, everything continues to work exactly as before — bookmarks and preferences are stored locally — so sign-in is truly optional.

**Why this priority**: Ensures sign-in is never a gate. Signed-out users must not experience degradation.

**Independent Test**: Use the app without signing in. Bookmark articles, change categories, toggle dark mode. Reload. Confirm all preferences are intact from localStorage alone.

**Acceptance Scenarios**:

1. **Given** I have never signed in, **When** I use the app, **Then** bookmarks and category preferences work exactly as they did before this feature.
2. **Given** I sign out after previously being signed in, **When** I add a new bookmark, **Then** it is saved locally only (not synced).

---

### Edge Cases

- What if the user is offline when they bookmark an article while signed in? → The bookmark is saved locally first and synced when connectivity is restored.
- What if the same article is bookmarked on two devices before sync completes? → Both are kept (no duplicate since the article ID is the same — it counts as one bookmark).
- What if cloud sync fails? → The app falls back to local data silently; no error is shown unless the failure persists for more than a few seconds.
- What if the user's Google account is deleted? → On next app open the session is invalid; the app signs the user out gracefully and reverts to local-only mode.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a "Sign in with Google" option in the Settings screen.
- **FR-002**: After successful sign-in the app MUST display the user's name and profile photo in Settings.
- **FR-003**: The signed-in session MUST persist across app restarts without requiring re-authentication.
- **FR-004**: Users MUST be able to sign out from Settings at any time.
- **FR-005**: When signed in, bookmarks MUST be saved to the cloud and synced in real time across devices.
- **FR-006**: When signed in, category preferences MUST be saved to the cloud and applied on any device the user signs into.
- **FR-007**: Local bookmarks existing before sign-in MUST be merged into the cloud account on first sign-in — no data loss.
- **FR-008**: When signed out, the app MUST function entirely from local storage with no degradation to existing features.
- **FR-009**: The app MUST handle offline gracefully — local changes made offline MUST sync when connectivity is restored.
- **FR-010**: Sign-in MUST be optional — no feature is gated behind authentication.

### Key Entities

- **User account**: Identified by Google account. Attributes: unique ID, display name, profile photo URL, sign-in status.
- **Cloud bookmark**: A bookmark associated with a user account, synced across devices. Same structure as a local bookmark plus user ID.
- **Cloud preferences**: Category selection and dark mode preference associated with a user account.
- **Sync state**: Whether local data and cloud data are in agreement. Can be: synced, pending, conflict.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete Google sign-in and see their data synced in under 10 seconds on a normal connection.
- **SC-002**: Bookmarks created on device A appear on device B within 5 seconds of being saved (on a normal connection).
- **SC-003**: Zero bookmarks are lost when merging local data into a cloud account on first sign-in.
- **SC-004**: Signed-out users experience zero degradation — all existing features work identically to before this feature.
- **SC-005**: The app remains fully functional when offline — no crashes or blank screens due to sync failure.
- **SC-006**: Sign-in state persists across 100% of app restarts until the user explicitly signs out.

## Assumptions

- Google is the only sign-in provider in scope; email/password or other OAuth providers are not included.
- Firebase Authentication and Firestore are used for auth and sync respectively (client-side SDK — no server required).
- The Firebase project must be created and configured by the developer before implementation; API keys are stored in environment variables.
- Dark mode preference is synced as part of "cloud preferences" alongside category selection.
- The Bookmarks tab shows only the signed-in user's cloud bookmarks when online, falling back to local bookmarks when offline.
- Conflict resolution for simultaneous edits uses "last write wins" by timestamp — no manual merge UI needed.
