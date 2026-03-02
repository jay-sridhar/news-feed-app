# Data Model: Google Sign-In with Cloud Sync (007)

## Firestore Collections

### users/{uid}/bookmarks/{articleId}

Mirrors the local `BookmarkedArticle` type. One document per bookmarked article per user.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Article ID (same as document ID) |
| `title` | `string` | Article headline |
| `link` | `string` | Article URL |
| `pubDate` | `string` | Publication date string |
| `sourceName` | `string` | News source name |
| `categoryId` | `CategoryId` | Category tab the article came from |
| `savedAt` | `number` | Unix timestamp (ms) when bookmarked |

**Document ID**: `article.id` (deterministic, enables deduplication across devices)

**Security rule**: `request.auth.uid == userId` (parent path segment)

---

### users/{uid}/preferences

Single document. Read once on sign-in; written on every preference change.

| Field | Type | Description |
|-------|------|-------------|
| `enabledCategories` | `string[]` | Array of enabled `CategoryId` values |
| `theme` | `'light' \| 'dark'` | Current theme preference |

**Document path**: `users/{uid}/preferences` (no sub-document ID needed — single document)

**Merge strategy**: On sign-in, cloud preferences overwrite local values. On change, write to both Firestore and localStorage.

---

## New TypeScript Types (`src/types/index.ts`)

```ts
export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
}

export interface AuthContextValue {
  user: UserProfile | null
  authLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export interface CloudPreferences {
  enabledCategories: CategoryId[]
  theme: Theme
}
```

---

## localStorage Keys (complete list after 007)

| Key | Feature | Type |
|-----|---------|------|
| `newsflow_theme` | 004 | `'light' \| 'dark'` |
| `newsflow_bookmarks` | 003 | `JSON: BookmarkedArticle[]` |
| `newsflow_enabled_categories` | 006 | `JSON: CategoryId[]` |

No new localStorage keys. Firebase Auth persists session via IndexedDB automatically (handled by Firebase SDK).

---

## Sync State Transitions

```
Signed out
  → localStorage is source of truth for bookmarks + preferences

Sign-in triggered
  → Firebase Auth popup completes
  → onAuthStateChanged fires with User
  → Merge: local bookmarks → Firestore (write new ones only)
  → Apply: cloud preferences → local state (overwrite)
  → onSnapshot listener starts on users/{uid}/bookmarks
  → Firestore is source of truth

Signed in (ongoing)
  → bookmark add/remove: dual-write (localStorage + Firestore)
  → pref change: dual-write (localStorage + Firestore)
  → Other device writes: onSnapshot fires → state updated

Sign-out triggered
  → onSnapshot unsubscribed
  → user = null
  → bookmarks revert to localStorage
  → preferences revert to localStorage
  → localStorage is source of truth again
```
