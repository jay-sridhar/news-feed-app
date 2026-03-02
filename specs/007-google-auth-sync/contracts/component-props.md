# Component Contracts: Google Sign-In with Cloud Sync (007)

## AuthContext (new)

**File**: `src/context/AuthContext.tsx`

| Value | Type | Description |
|-------|------|-------------|
| `user` | `UserProfile \| null` | Signed-in user, or null when signed out |
| `authLoading` | `boolean` | True until Firebase resolves initial auth state |
| `signInWithGoogle` | `() => Promise<void>` | Opens Google popup; resolves after auth completes or rejects on cancel/error |
| `signOut` | `() => Promise<void>` | Signs out user; triggers return to local-only mode |

**Behaviour**:
- `authLoading` is `true` from mount until `onAuthStateChanged` first fires
- While `authLoading`, render nothing (or a minimal loading indicator) to avoid flash of signed-out UI
- If Firebase config env vars are missing, `user` stays `null` and auth functions are no-ops (graceful degradation)

---

## firebase.ts service (new)

**File**: `src/services/firebase.ts`

Exports:
```ts
export const app: FirebaseApp        // initializeApp(config)
export const auth: Auth              // getAuth(app)
export const db: Firestore           // initializeFirestore with persistentLocalCache
export const googleProvider: GoogleAuthProvider
```

If any `VITE_FIREBASE_*` env var is missing or blank, the module exports `null` for all values and logs a warning. Callers must null-check before use.

---

## SettingsScreen (modified)

**File**: `src/components/SettingsScreen/SettingsScreen.tsx`

New "Account" section added above "News Categories":

**Signed-out state**:
```
ACCOUNT
[ Sign in with Google ]   ← button with Google logo
```

**Signed-in state**:
```
ACCOUNT
[avatar] Jay Sridhar       ← user photo + display name
         jay@gmail.com     ← email (smaller text)
[ Sign out ]               ← button
```

**Props**: none — reads from `useAuthContext()`.

---

## BookmarkContext (modified)

**File**: `src/context/BookmarkContext.tsx`

Interface unchanged — same `bookmarks`, `toggleBookmark`, `isBookmarked`. Internal behaviour changes:

| Signed-out | Signed-in |
|------------|-----------|
| State initialised from localStorage | State initialised from Firestore `onSnapshot` |
| `toggleBookmark` writes localStorage only | `toggleBookmark` writes localStorage AND Firestore |
| Sign-in → merge local to Firestore, switch to Firestore listener | Sign-out → unsubscribe listener, switch to localStorage |

**First-sign-in merge**: Called from `AuthContext` after successful sign-in. Reads `newsflow_bookmarks` from localStorage, writes to `users/{uid}/bookmarks/{id}` for any article not already in Firestore.

---

## CategoryContext (modified)

**File**: `src/context/CategoryContext.tsx`

Interface unchanged. Internal behaviour changes:

| Signed-out | Signed-in |
|------------|-----------|
| `toggleCategory` writes localStorage only | `toggleCategory` writes localStorage AND Firestore `users/{uid}/preferences` |
| On sign-in | Cloud `enabledCategories` applied to state (overwrite) |
| On sign-out | localStorage value restored |

---

## ThemeContext (modified)

**File**: `src/context/ThemeContext.tsx`

Interface unchanged. Internal behaviour changes:

| Signed-out | Signed-in |
|------------|-----------|
| `toggleTheme` writes localStorage only | `toggleTheme` writes localStorage AND Firestore `users/{uid}/preferences` |
| On sign-in | Cloud `theme` applied to state (overwrite) |
| On sign-out | localStorage value remains |

---

## App.tsx (modified)

New provider order:
```tsx
<ThemeProvider>
  <AuthProvider>
    <BookmarkProvider>
      <CategoryProvider>
        …
      </CategoryProvider>
    </BookmarkProvider>
  </AuthProvider>
</ThemeProvider>
```

`AuthProvider` must wrap `BookmarkProvider` and `CategoryProvider` so they can call `useAuthContext()`.

---

## Environment Variables

**File**: `.env` (gitignored) / `.env.example` (committed)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

All six must be set for Firebase to initialise. If any is missing, the app runs in local-only mode silently.
