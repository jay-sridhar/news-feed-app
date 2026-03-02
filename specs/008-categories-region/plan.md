# Implementation Plan: Expanded Categories with Region Personalisation

**Branch**: `008-categories-region` | **Date**: 2026-03-02 | **Spec**: `specs/008-categories-region/spec.md`

## Summary

Expand the news feed from 5 static categories to 9, with two of them (National, Regional) having dynamic labels and feed URLs driven by a user-selected country/state. Add a Region picker to the Settings screen. Change the default enabled set to `['top']` only (clean first-run UX). Make Settings a true full-screen experience by hiding the TabBar while it is open. Refactor `useFeed` to accept a `Category` object so it can react to URL changes from region updates.

## Source Code Changes

```text
src/
├── types/index.ts                          MODIFIED — new CategoryId union (9 values),
│                                                       UserRegion interface,
│                                                       CategoryContextValue + CloudPreferences extended
├── constants/categories.ts                 REWRITTEN — INDIA_STATES, DEFAULT_USER_REGION,
│                                                       buildCategories(region), CATEGORIES (static)
├── context/CategoryContext.tsx             MODIFIED — userRegion state, categories useMemo,
│                                                       setUserRegion, default enabled = ['top'],
│                                                       enabledRef for stable closeSettings
├── hooks/useFeed.ts                        MODIFIED — signature: useFeed(category: Category),
│                                                       useRef for stable doFetch, effect deps updated
├── components/
│   ├── FeedContainer/FeedContainer.tsx     MODIFIED — look up active Category from context.categories
│   ├── TabBar/TabBar.tsx                   MODIFIED — use categories from context (not CATEGORIES import)
│   └── SettingsScreen/SettingsScreen.tsx   MODIFIED — add Region section (Country + State dropdown),
│                                                       use categories from context
└── App.tsx                                 MODIFIED — AppContent component hides TabBar when
│                                                       isSettingsOpen; MainContent renamed

tests/e2e/
├── tabs.spec.ts                            MODIFIED — new labels, enableAllCategories helper,
│                                                       added "default shows only top" test
├── settings.spec.ts                        MODIFIED — new labels, enableAllCategories helper,
│                                                       new "settings hides tab bar" test,
│                                                       restructured reload test
├── error.spec.ts                           MODIFIED — addInitScript to enable sports for tab-switch test
├── scroll.spec.ts                          MODIFIED — addInitScript to enable sports
└── search.spec.ts                          MODIFIED — addInitScript to enable tech, label update
```

## Key Design Decisions

### 1. `buildCategories` as pure function
Keeps `CATEGORIES` as a static export (for ID validation) while allowing the context to hold a memoized, region-aware copy. Avoids circular dependency between context and constants.

### 2. `useFeed(category: Category)` with `useRef`
The `doFetch` callback needs to read the latest `feedUrl` without being re-created on every render. A `useRef` that is synchronously updated in the render body provides this stability. Effect deps are `[category.id, category.feedUrl, doFetch]` — purely primitive comparisons.

### 3. `enabledRef` for stable `closeSettings`
`closeSettings` needs to read `enabledCategories` but must not be re-created on every category toggle (that would cause unnecessary re-subscriptions). A `useRef` updated synchronously in render solves this.

### 4. Full-screen Settings via `AppContent` component
`AppContent` is a new component inside `CategoryProvider` that reads `isSettingsOpen`. When true, it renders only `<SettingsScreen />`. When false, it renders the `flex min-h-screen` layout with `<TabBar />` and `<MainContent />`. This avoids any conditional rendering inside `TabBar` itself.

### 5. Default enabled `['top']`
New users see a clean two-tab view (Top Stories + Bookmarks). Progressive disclosure: they add tabs in Settings. Existing users with valid localStorage data are unaffected — their saved IDs are loaded, old invalid IDs (`tamilnadu`, `india`) are silently dropped.

## Test Strategy

### New tests
- `'by default only Top Stories and Bookmarks tabs are shown'` — verifies clean default UX
- `'settings hides the tab bar while open'` — verifies full-screen settings behavior

### Test helpers
- `enableAllCategories(page)` — calls `page.addInitScript` to write all 9 IDs to `newsflow_enabled_categories` localStorage before navigation. Used in any test that needs to click a non-default tab. Safe for non-reload tests; not used in reload tests (uses UI toggles instead).

### Migration of old tests
All tests referencing old labels were updated:
- `'Technology & AI'` → `'Technology'`
- `'Tamil Nadu / Chennai'` → `'Regional – Tamil Nadu'`
- `'National India'` → `'National – India'`
- Pre-seeded IDs `['top', 'tech', 'tamilnadu', 'india']` → `['top', 'tech', 'regional', 'national']`
