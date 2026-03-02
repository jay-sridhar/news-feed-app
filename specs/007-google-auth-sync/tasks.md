# Tasks: Google Sign-In with Cloud Sync (007)

**Input**: Design documents from `/specs/007-google-auth-sync/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Playwright tests included per quickstart.md scenarios (signed-out UI + mock injected signed-in UI).

**Organization**: Tasks grouped by user story. Each story is independently testable. No Firebase emulator required — tests use `window.__MOCK_AUTH_USER__` injection for signed-in states.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the firebase package, add new TypeScript types, and document environment variables.

- [X] T001 Install firebase@^10 package via npm in the project root
- [X] T002 [P] Add UserProfile, AuthContextValue, and CloudPreferences interfaces to `src/types/index.ts`
- [X] T003 [P] Create `.env.example` with all six VITE_FIREBASE_* variable placeholders and add `.env` to `.gitignore`

**Checkpoint**: `firebase` in node_modules; new types in `src/types/index.ts`; `.env.example` committed; `.env` gitignored.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Firebase service initialisation and AuthContext must exist before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create `src/services/firebase.ts` — check all six VITE_FIREBASE_* env vars; if any missing export null for all; otherwise export `firebaseApp`, `firebaseAuth`, `firebaseDb` (with `persistentLocalCache` + `persistentMultipleTabManager`), and `googleProvider`
- [X] T005 Create `src/context/AuthContext.tsx` — `AuthProvider` with `user: UserProfile | null`, `authLoading: boolean`, `signInWithGoogle()`, `signOut()`; `onAuthStateChanged` listener; `window.__MOCK_AUTH_USER__` injection (DEV mode only); graceful no-op when `firebaseAuth` is null
- [X] T006 Update `src/App.tsx` — wrap providers in order: `ThemeProvider > AuthProvider > BookmarkProvider > CategoryProvider`; import and render `AuthProvider`

**Checkpoint**: App boots without error when no `.env` is present; `useAuthContext()` returns `{ user: null, authLoading: false }` in that case.

---

## Phase 3: User Story 1 — Sign In with Google (Priority: P1) 🎯 MVP

**Goal**: Signed-out users see "Sign in with Google" in Settings; signed-in users see their avatar, name, email, and a Sign out button.

**Independent Test**: Open Settings → "Sign in with Google" button visible (signed-out). Inject `window.__MOCK_AUTH_USER__` → name + Sign out button visible instead.

### Tests for User Story 1

- [X] T007 [P] [US1] Create `tests/e2e/auth.spec.ts` — Scenario 1 (signed-out Account section shows sign-in button), Scenario 4 (auth loading: app renders without blank screen), Scenario 6 (Firebase not configured: sign-in button still visible)
- [X] T008 [P] [US1] Add Scenario 2 to `tests/e2e/auth.spec.ts` — inject `window.__MOCK_AUTH_USER__`; verify display name visible, sign-out button visible, sign-in button not visible

### Implementation for User Story 1

- [X] T009 [US1] Add "Account" section to `src/components/SettingsScreen/SettingsScreen.tsx` — signed-out: "Sign in with Google" button (44px touch target, Google logo); signed-in: avatar img + display name + email + "Sign out" button; reads from `useAuthContext()`; disable sign-in button while `authLoading` is true

**Checkpoint**: `npm test` — all auth.spec.ts tests pass. Signed-out UI correct; injected signed-in UI correct.

---

## Phase 4: User Story 2 — Cloud Sync of Bookmarks (Priority: P2)

**Goal**: When signed in, bookmarks dual-write to localStorage + Firestore; `onSnapshot` listener keeps state in sync from cloud; first-sign-in merges local bookmarks to cloud; sign-out reverts to localStorage.

**Independent Test**: Inject `window.__MOCK_AUTH_USER__`; bookmark an article; confirm localStorage write (offline resilience). Sign out via Settings; confirm localStorage bookmarks still visible.

### Tests for User Story 2

- [X] T010 [P] [US2] Add Scenario 3 to `tests/e2e/auth.spec.ts` — seed localStorage bookmark + inject mock user; click Sign out; verify local bookmark visible in Bookmarks tab
- [X] T011 [P] [US2] Add Scenario 5 to `tests/e2e/auth.spec.ts` — bookmark article (no auth); navigate to Bookmarks tab; verify bookmark-card visible (localStorage path unchanged)

### Implementation for User Story 2

- [X] T012 [US2] Modify `src/context/BookmarkContext.tsx` — import `useAuthContext`; when `user` is non-null: set up `onSnapshot` on `users/{uid}/bookmarks`, mirror each snapshot into state + localStorage; `toggleBookmark` dual-writes (localStorage first, then Firestore `setDoc`/`deleteDoc` async); on sign-out: unsubscribe listener, reload bookmarks from localStorage
- [X] T013 [US2] Add first-sign-in merge to `src/context/BookmarkContext.tsx` — on transition from `user === null` to `user !== null`: read `newsflow_bookmarks` from localStorage, fetch existing cloud bookmark IDs, use `writeBatch` to write only missing ones to `users/{uid}/bookmarks/{id}`

**Checkpoint**: `npm test` — Scenarios 3 and 5 pass. Bookmark dual-write and localStorage fallback verified.

---

## Phase 5: User Story 3 — Cloud Sync of Category Preferences (Priority: P3)

**Goal**: When signed in, category toggles and theme changes write to Firestore `users/{uid}/preferences`; on sign-in, cloud preferences overwrite local state.

**Independent Test**: Inject mock user; toggle a category; confirm localStorage write. Sign out; confirm localStorage value remains. (Full cross-device test requires Firebase emulator — not in scope.)

### Implementation for User Story 3

- [X] T014 [P] [US3] Modify `src/context/CategoryContext.tsx` — import `useAuthContext`; when `user` is non-null: on sign-in read `users/{uid}/preferences` via `getDoc`, apply `enabledCategories` to state; `toggleCategory` dual-writes (localStorage + `setDoc` merge on preferences doc); on sign-out revert to localStorage value
- [X] T015 [P] [US3] Modify `src/context/ThemeContext.tsx` — same dual-write pattern; on sign-in apply cloud `theme` to state; `toggleTheme` dual-writes; on sign-out localStorage value remains

**Checkpoint**: Category and theme changes when signed in update Firestore (verifiable via Firebase Console). Sign-out leaves localStorage intact.

---

## Phase 6: User Story 4 — Offline-First for Signed-Out Users (Priority: P4)

**Goal**: Signed-out path is completely unchanged — no Firebase calls, no new loading states, no regressions.

**Independent Test**: Run full existing Playwright suite (app.spec.ts, tabs.spec.ts, scroll.spec.ts, error.spec.ts) with no Firebase env vars — all 24 tests must still pass.

### Tests for User Story 4

- [X] T016 [US4] Run existing Playwright test suite (`npm test`) — all 24 pre-existing tests must pass with no Firebase env vars present; confirm no regressions from the AuthContext / provider wrapping changes

**Checkpoint**: `npm test` — 24 pre-existing tests + new auth.spec.ts tests all green.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, test suite health, and final validation.

- [X] T017 Run `npx tsc --noEmit` and fix all TypeScript errors — ensure no `any` types introduced in new files
- [X] T018 [P] Verify `.gitignore` includes `.env` and `.env.local`; verify `.env.example` documents all six VITE_FIREBASE_* vars with empty values
- [X] T019 Run `npm test` and confirm the full test suite (all scenarios in auth.spec.ts + original 24 tests) passes cleanly

---

## Dependencies & Execution Order

```
T001 → T004 → T005 → T006 → (US phases)
T002 ↗          ↑
T003 ↗     (T004 needs T001)
             (T005 needs T004)
             (T006 needs T005)

US1: T007, T008 (parallel) → T009 → US1 Checkpoint
US2: T010, T011 (parallel) → T012 → T013 → US2 Checkpoint
US3: T014, T015 (parallel, after T006) → US3 Checkpoint
US4: T016 (after all US phases) → US4 Checkpoint
Polish: T017, T018 (parallel) → T019
```

## Parallel Execution Opportunities

| Story | Parallel Group | Tasks |
|-------|---------------|-------|
| Setup | Group A | T002, T003 (after T001) |
| US1 | Group B | T007, T008 (test writing) |
| US2 | Group C | T010, T011 (test writing) |
| US3 | Group D | T014, T015 (different context files) |
| Polish | Group E | T017, T018 |

## Implementation Strategy

**MVP scope (minimum to ship US1)**: T001 → T002 → T003 → T004 → T005 → T006 → T009 (SettingsScreen Account section). Verifiable with T007 + T008 tests.

**Incremental delivery**:
1. US1 (auth UI) — value: users can sign in and see their profile
2. US2 (bookmark sync) — value: cross-device bookmark access
3. US3 (prefs sync) — value: cross-device category/theme consistency
4. US4 (regression check) — value: confidence signed-out path intact

**Total tasks**: 19
**Tasks per user story**: US1: 3, US2: 4, US3: 2, US4: 1, Setup: 3, Foundational: 3, Polish: 3
**Parallel opportunities**: 5 groups
