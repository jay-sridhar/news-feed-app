# Data Model: Settings Page with Category Personalisation (006)

## Entities

### CategoryPreferences

Represents which news categories the user has enabled. Stored in `localStorage`.

| Field | Type | Description |
|-------|------|-------------|
| `enabledIds` | `CategoryId[]` | Array of enabled category IDs. Minimum length: 1. Maximum length: 5. |

**Invariants**:
- `enabledIds.length >= 1` at all times (min-one guard enforced in `toggleCategory`)
- Order within `enabledIds` is not significant; render order is determined by `CATEGORIES` array order
- Default value (new user / cleared storage): `['top', 'tech', 'tamilnadu', 'india', 'sports']` — all 5 enabled

**Persistence**:
- Key: `newsflow_enabled_categories`
- Format: `JSON.stringify(CategoryId[])` e.g. `'["top","tech","sports"]'`
- Read: once on `CategoryProvider` mount via `JSON.parse(localStorage.getItem(...))`
- Write: on every `toggleCategory` call that changes state

**State transitions**:
```
All enabled (5)
  ↓ toggleCategory('tamilnadu')  [enabled → disabled]
4 enabled
  ↓ toggleCategory('tamilnadu')  [disabled → enabled]
All enabled (5)

At exactly 1 enabled:
  ↓ toggleCategory(lastEnabled)  → BLOCKED (no-op, guard fires)
Still 1 enabled (unchanged)
```

---

## Context State Extensions

The following fields are added to `CategoryContextValue` in `src/types/index.ts`:

| Field | Type | Description |
|-------|------|-------------|
| `enabledCategories` | `CategoryId[]` | Currently enabled category IDs (derived from localStorage + state) |
| `toggleCategory` | `(id: CategoryId) => void` | Enable/disable a category; enforces min-one guard |
| `isSettingsOpen` | `boolean` | Whether the Settings screen is currently visible |
| `openSettings` | `() => void` | Show the Settings screen |
| `closeSettings` | `() => void` | Hide Settings; auto-switches active tab if needed |

---

## localStorage Keys (all keys used by the app)

| Key | Feature | Type |
|-----|---------|------|
| `newsflow_theme` | 004-dark-mode | `'light' \| 'dark'` |
| `newsflow_bookmarks` | 003-bookmarks | `JSON: BookmarkedArticle[]` |
| `newsflow_enabled_categories` | **006-settings-categories** | `JSON: CategoryId[]` |
