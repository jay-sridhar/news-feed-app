# Research: Google Sign-In with Cloud Sync (007)

## Decision 1 — Firebase SDK version

**Decision**: Firebase v10 modular SDK (`firebase@^10`)

**Rationale**: v10 is fully tree-shakeable — importing only `firebase/auth` + `firebase/firestore` adds ~150–170 KB gzipped vs 250+ KB for full bundle. Named imports (`getAuth`, `getFirestore`, etc.) from specific subpaths ensure Vite only bundles what is used. v8 compat mode is deprecated.

**Alternatives considered**: Firebase v9 compat — rejected: deprecated, larger bundle, no tree-shaking.

---

## Decision 2 — Firestore data structure

**Decision**: Nested per-user subcollections

```
users/{uid}/
  bookmarks/{articleId}   → full BookmarkedArticle object
  preferences             → { enabledCategories: CategoryId[], theme: 'light'|'dark' }
```

**Rationale**: Nesting under `users/{uid}/` enforces Firestore security rules easily (`request.auth.uid == userId`). Bookmarks as a subcollection (not root collection) avoids cross-user leakage and doesn't require a compound index. Preferences as a single document keeps reads cheap (one read per sign-in).

**Alternatives considered**:
- Root `/bookmarks` collection with `userId` field + index — rejected: requires an extra index, exposes all bookmarks to same rule path.
- Single document with bookmarks array — rejected: Firestore 1MB document limit; no real-time partial updates.

---

## Decision 3 — Offline persistence

**Decision**: `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`

**Rationale**: Enables IndexedDB-backed offline cache; Firestore SDK replays pending writes when connectivity returns automatically. Replaces deprecated `enableMultiTabIndexedDbPersistence`. Tab manager shares cache across browser tabs.

**Alternatives considered**: No persistence — rejected: breaks FR-009 (offline graceful handling).

---

## Decision 4 — AuthContext placement

**Decision**: New `AuthContext` provider wraps `BookmarkProvider` and `CategoryProvider` in `App.tsx`, so both can access the signed-in user.

**Provider order**:
```
ThemeProvider
  AuthProvider
    BookmarkProvider
      CategoryProvider
```

**Rationale**: BookmarkProvider needs `user.uid` to set up Firestore listeners. CategoryProvider needs it to sync preferences. Both must be downstream of AuthProvider. ThemeProvider is outermost (no auth dependency, but syncs theme to Firestore via AuthContext hook).

**Alternatives considered**: Passing user as props — rejected: violates constitution IV (context, not prop drilling).

---

## Decision 5 — First-sign-in local→cloud merge

**Decision**: On `onAuthStateChanged` firing with a non-null user, run a one-time merge: read local bookmarks, get existing cloud bookmark IDs, use `writeBatch` to write only new ones (those not already in cloud). Apply cloud preferences (categories, theme) to local state overwriting local values.

**Rationale**: FR-007 requires zero data loss. Batch is atomic. Cloud preferences win over local on sign-in (most recent device the user used is considered authoritative).

**Edge case**: If the same article is bookmarked locally AND in cloud, it's deduplicated by `articleId` — no duplicates.

---

## Decision 6 — Sign-out behaviour

**Decision**: On sign-out, unsubscribe all Firestore listeners and reload bookmarks from localStorage. Category preferences and theme revert to localStorage values.

**Rationale**: FR-008 requires signed-out users to see local-only data. The simplest implementation: on sign-out, the `BookmarkProvider` detects `user === null` and switches to localStorage source.

---

## Decision 7 — Sync strategy for bookmarks

**Decision**: **Dual-write + real-time listener**. When signed in:
- `toggleBookmark` writes to both localStorage (immediate, offline-safe) AND Firestore (async).
- An `onSnapshot` listener on `users/{uid}/bookmarks` keeps the in-memory state in sync with Firestore (catches changes from other devices).

**Rationale**: Dual-write ensures offline resilience (localStorage copy always available). The `onSnapshot` listener provides real-time cross-device sync. On sign-in, Firestore data replaces in-memory bookmarks (cloud is source of truth once signed in).

---

## Decision 8 — Sync strategy for preferences

**Decision**: On sign-in, read cloud preferences once (`getDoc`) and apply to local state. On preference change (category toggle, theme change), write to Firestore AND localStorage. No real-time listener for preferences (single-user at a time, no real-time conflict risk).

**Rationale**: Preferences change infrequently. A single `getDoc` on sign-in is cheaper than an `onSnapshot`. One-way sync on sign-in (cloud → local) + write-through on change is sufficient for the use case.

---

## Decision 9 — Playwright testing strategy

**Decision**: Test only signed-out UI with standard Playwright tests. For signed-in UI, inject a mock auth state via `page.addInitScript` that populates a `window.__mockUser` flag that AuthContext reads in development/test mode. Full OAuth flow is not tested E2E (would require Firebase Auth Emulator or real credentials).

**Rationale**: Firebase uses gRPC which `page.route()` cannot intercept reliably. Firebase Auth Emulator requires additional tooling (`firebase-tools`, emulator config). For the scope of this feature, testing the UI states (signed-out button, signed-in profile display) via injected state is sufficient.

---

## Decision 10 — Constitution Principle I compliance

**Decision**: Firebase Auth + Firestore are client-side-only SDKs. No custom backend is introduced. Constitution Principle I ("no custom backend server, serverless functions, or API proxy routes") is satisfied. The "external data sources limited to GNews/RSS" clause refers to news content sources, not auxiliary services like authentication and sync.

**Justification recorded in Complexity Tracking table in plan.md**.

---

## Firebase Spark Free Tier (relevant limits)

| Resource | Limit | Expected usage |
|----------|-------|---------------|
| Firestore reads | 50,000 / day | ~1 read per sign-in session + snapshot listeners |
| Firestore writes | 20,000 / day | 1 per bookmark toggle + 1 per prefs change |
| Firestore storage | 1 GB | Negligible for bookmarks (~1KB each) |
| Auth MAU | 10,000 / month | Well within limit for a personal app |

Free tier is sufficient. No Blaze plan required.
