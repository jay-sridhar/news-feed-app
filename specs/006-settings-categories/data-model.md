# Data Model: Settings Page with Category Personalisation (006)

> **Updated by feature 008**: CategoryId union expanded, default changed, UserRegion added.
> See `specs/008-categories-region/data-model.md` for the full updated data model.

## Entities

### CategoryPreferences

Represents which news categories the user has enabled. Stored in `localStorage`.

| Field | Type | Description |
|-------|------|-------------|
| `enabledIds` | `CategoryId[]` | Array of enabled category IDs. Minimum length: 1. Maximum length: 9 (as of 008). |

**CategoryId values** (updated by 008):
```ts
type CategoryId = 'top' | 'national' | 'regional' | 'tech' | 'ai' | 'softwaredev' | 'business' | 'weather' | 'sports'
```
Old IDs `'tamilnadu'` and `'india'` are no longer valid (removed in 008). They are silently dropped during validation on load.

**Invariants**:
- `enabledIds.length >= 1` at all times (min-one guard enforced in `toggleCategory`)
- Order within `enabledIds` is not significant; render order is determined by `buildCategories()` array order
- Default value (new user / cleared storage): `['top']` *(changed from all-enabled in feature 008)*

**Persistence**:
- Key: `newsflow_enabled_categories`
- Format: `JSON.stringify(CategoryId[])` e.g. `'["top","tech","sports"]'`
- Read: once on `CategoryProvider` mount via `JSON.parse(localStorage.getItem(...))`
- Write: on every `toggleCategory` call that changes state

**State transitions**:
```
Only 'top' enabled (default)
  ↓ toggleCategory('sports')  [disabled → enabled]
['top', 'sports'] enabled
  ↓ toggleCategory('sports')  [enabled → disabled]
['top'] enabled

At exactly 1 enabled:
  ↓ toggleCategory(lastEnabled)  → BLOCKED (no-op, guard fires)
Still 1 enabled (unchanged)
```

---

## Context State Extensions

The following fields were added to `CategoryContextValue` in feature 006, then extended in feature 008:

| Field | Type | Added in | Description |
|-------|------|----------|-------------|
| `enabledCategories` | `CategoryId[]` | 006 | Currently enabled category IDs |
| `toggleCategory` | `(id: CategoryId) => void` | 006 | Enable/disable a category; enforces min-one guard |
| `isSettingsOpen` | `boolean` | 006 | Whether the Settings screen is currently visible |
| `openSettings` | `() => void` | 006 | Show the Settings screen |
| `closeSettings` | `() => void` | 006 | Hide Settings; auto-switches active tab if needed |
| `categories` | `Category[]` | **008** | Full category list, memoized from `userRegion` |
| `userRegion` | `UserRegion` | **008** | Current country/state selection |
| `setUserRegion` | `(r: UserRegion) => void` | **008** | Update region; persists to localStorage + Firestore |

---

## localStorage Keys (complete list after 008)

| Key | Feature | Type |
|-----|---------|------|
| `newsflow_theme` | 004 | `'light' \| 'dark'` |
| `newsflow_bookmarks` | 003 | `JSON: BookmarkedArticle[]` |
| `newsflow_enabled_categories` | 006 | `JSON: CategoryId[]` |
| `newsflow_user_region` | 008 | `JSON: { country: string; state: string }` |
