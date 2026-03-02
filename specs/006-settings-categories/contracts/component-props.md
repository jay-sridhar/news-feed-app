# Component Contracts: Settings Page with Category Personalisation (006)

> **Updated by feature 008**: SettingsScreen has a new Region section; TabBar uses `categories` from context; CategoryContext has additional fields; Settings is now truly full-screen (TabBar hidden).

## SettingsScreen

**File**: `src/components/SettingsScreen/SettingsScreen.tsx`
**Role**: Full-screen settings view. Rendered by `AppContent` when `isSettingsOpen === true` — the TabBar is not rendered at the same time.

No props — reads all state from `useCategoryContext()`, `useThemeContext()`, and `useAuthContext()`.

**Rendered sections** (in order):
1. Header row: "Settings" title + close button (×) calling `closeSettings()`
2. "Account" section: Google sign-in / user info (added in 007)
3. "Region" section *(added in 008)*: Country field (static "India") + State dropdown (`INDIA_STATES`) calling `setUserRegion`
4. "News Categories" section: one toggle row per category in `categories` (from context) order — 9 categories
5. "Appearance" section: dark/light mode toggle

---

## CategoryToggleRow (internal to SettingsScreen)

Not exported separately.

| Prop | Type | Description |
|------|------|-------------|
| `category` | `Category` | The category to render |
| `enabled` | `boolean` | Whether this category is currently enabled |
| `isLastEnabled` | `boolean` | When `true`, the toggle is visually disabled |
| `onToggle` | `() => void` | Calls `toggleCategory(category.id)` |

---

## CategoryContext (extended)

**File**: `src/context/CategoryContext.tsx`

Full `CategoryContextValue` interface (006 fields + 008 additions):

| Field | Type | Added in | Description |
|-------|------|----------|-------------|
| `activeCategory` | `ActiveTab` | 001 | Currently selected tab |
| `setActiveCategory` | `(id: ActiveTab) => void` | 001 | Change active tab |
| `categories` | `Category[]` | **008** | Full 9-category list, memoized from `userRegion` |
| `enabledCategories` | `CategoryId[]` | 006 | Subset of enabled category IDs |
| `toggleCategory` | `(id: CategoryId) => void` | 006 | Flip enabled/disabled; enforces min-one guard |
| `isSettingsOpen` | `boolean` | 006 | Settings screen visibility |
| `openSettings` | `() => void` | 006 | Show Settings |
| `closeSettings` | `() => void` | 006 | Hide Settings; auto-switch if active tab deselected |
| `userRegion` | `UserRegion` | **008** | `{ country: string; state: string }` |
| `setUserRegion` | `(r: UserRegion) => void` | **008** | Update region; persist to localStorage + Firestore |

**Persistence contract**:
- `newsflow_enabled_categories`: read on mount, validated, defaults to `['top']` if missing/invalid
- `newsflow_user_region`: read on mount, validated, defaults to `{ country: 'India', state: 'Tamil Nadu' }` if missing/invalid
- On `toggleCategory`: write updated `CategoryId[]` to localStorage (and Firestore if signed in)
- On `setUserRegion`: write `UserRegion` to localStorage (and Firestore if signed in)

---

## TabBar (modified)

**File**: `src/components/TabBar/TabBar.tsx`

**Changes from 006** (updated in 008):
- Category tab loop: `categories.filter(c => enabledCategories.includes(c.id))` — uses `categories` from context (not the static `CATEGORIES` import) so labels and URLs are always region-aware
- Gear icon calling `openSettings()` unchanged

---

## AppContent (replaces MainView)

**File**: `src/App.tsx`

Render logic (updated in 008 — Settings now hides the TabBar entirely):

```
isSettingsOpen
  → <SettingsScreen />   ← full screen; TabBar is NOT rendered

otherwise
  → <div className="flex min-h-screen ...">
       <TabBar />
       <main>
         activeCategory === 'bookmarks'
           → <BookmarksContainer />
         otherwise
           → <FeedContainer />
       </main>
    </div>
```

**Before 008**, `MainView` sat inside the `<main>` element and Settings was conditionally rendered there — the TabBar was always visible. After 008, `AppContent` controls the entire layout.
