# Component Contracts: Settings Page with Category Personalisation (006)

## SettingsScreen

**File**: `src/components/SettingsScreen/SettingsScreen.tsx`
**Role**: Full-screen settings view. Rendered by `MainView` when `isSettingsOpen === true`.

No props — reads all state from `useCategoryContext()` and `useThemeContext()`.

**Rendered sections**:
1. Header row: "Settings" title + close button (×) calling `closeSettings()`
2. "News Categories" section: one toggle row per category in `CATEGORIES` order
3. "Appearance" section: dark/light mode toggle (reuses `useThemeContext().toggleTheme`)

---

## CategoryToggleRow (internal to SettingsScreen)

**File**: `src/components/SettingsScreen/SettingsScreen.tsx` (same file, not exported separately)

| Prop | Type | Description |
|------|------|-------------|
| `category` | `Category` | The category to render |
| `enabled` | `boolean` | Whether this category is currently enabled |
| `isLastEnabled` | `boolean` | When `true`, the toggle is visually disabled and interaction is blocked |
| `onToggle` | `() => void` | Calls `toggleCategory(category.id)` |

**Behaviour**:
- When `isLastEnabled === true`: toggle rendered with `opacity-50 cursor-not-allowed`, `disabled` attribute; an inline note "At least one category must remain selected" appears below the row
- When `enabled === false` and `isLastEnabled === false`: toggle is unchecked, category can be re-enabled

---

## CategoryContext (extended)

**File**: `src/context/CategoryContext.tsx`

Extended interface — new fields added to `CategoryContextValue`:

| Field | Type | Description |
|-------|------|-------------|
| `enabledCategories` | `CategoryId[]` | Subset of all category IDs that are currently enabled |
| `toggleCategory` | `(id: CategoryId) => void` | Flip enabled/disabled; no-op if disabling the last enabled category |
| `isSettingsOpen` | `boolean` | Settings screen visibility flag |
| `openSettings` | `() => void` | Set `isSettingsOpen = true` |
| `closeSettings` | `() => void` | Set `isSettingsOpen = false`; if `activeCategory` not in `enabledCategories`, set `activeCategory` to `enabledCategories[0]` |

**Persistence contract**:
- On mount: read `localStorage.getItem('newsflow_enabled_categories')`, parse JSON, validate each ID exists in `CATEGORIES`; fall back to all IDs if missing/invalid
- On `toggleCategory`: write updated array to `localStorage.setItem('newsflow_enabled_categories', JSON.stringify(next))`

---

## TabBar (modified)

**File**: `src/components/TabBar/TabBar.tsx`

**Changes**:
- Category tab loop filters to `CATEGORIES.filter(c => enabledCategories.includes(c.id))`
- Sun/moon icon button replaced by gear icon button calling `openSettings()`
- Gear icon `aria-label`: `"Open settings"`

---

## MainView (modified)

**File**: `src/App.tsx`

Extended render logic:
```
isSettingsOpen  → <SettingsScreen />
activeCategory === 'bookmarks' → <BookmarksContainer />
otherwise → <FeedContainer />
```
