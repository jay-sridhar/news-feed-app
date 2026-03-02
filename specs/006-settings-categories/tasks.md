# Tasks: Settings Page with Category Personalisation (006-settings-categories)

**Input**: Design documents from `/specs/006-settings-categories/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/component-props.md ✓, quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in all task descriptions

---

## Phase 1: Setup

**Purpose**: Extend the shared type definitions that all other tasks depend on.

- [X] T001 Extend `CategoryContextValue` interface in `src/types/index.ts` — add `enabledCategories: CategoryId[]`, `toggleCategory: (id: CategoryId) => void`, `isSettingsOpen: boolean`, `openSettings: () => void`, `closeSettings: () => void`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the state layer that all components depend on.

**⚠️ CRITICAL**: No US work can begin until T002 and T003 are complete.

- [X] T002 Extend `CategoryProvider` in `src/context/CategoryContext.tsx` — add `enabledCategories` state (initialised from `localStorage.getItem('newsflow_enabled_categories')` with fallback to all category IDs); add `toggleCategory(id)` enforcing min-one guard (no-op if disabling the only enabled category); persist updated array to `localStorage` on every toggle; add `isSettingsOpen` boolean state; add `openSettings` / `closeSettings` functions (closeSettings auto-switches `activeCategory` to `enabledCategories[0]` if the current active category is no longer enabled); export all new values via context
- [X] T003 Modify `MainView` in `src/App.tsx` — render `<SettingsScreen />` when `isSettingsOpen === true`, before the existing bookmarks/feed check: `if (isSettingsOpen) return <SettingsScreen />`; import `SettingsScreen` from `src/components/SettingsScreen/SettingsScreen`

**Checkpoint**: Context wired up, App renders SettingsScreen placeholder — US phases can proceed.

---

## Phase 3: User Story 1 — Select My Categories (Priority: P1) 🎯 MVP

**Goal**: Users can open Settings, toggle categories on/off, see the tab bar update immediately, and have changes persist across reloads.

**Independent Test**: Open Settings from the gear icon, deselect "Sports", close Settings — Sports tab is gone from the tab bar. Reload — Sports is still absent.

- [X] T004 [P] [US1] Create `src/components/SettingsScreen/SettingsScreen.tsx` — render a full-screen white/dark panel; header row with "Settings" `<h2>` and a close `<button aria-label="Close settings">` (× icon) calling `closeSettings()`; "NEWS CATEGORIES" section label; map over `CATEGORIES` in fixed order, render one toggle row per category showing `category.label` and a `<input type="checkbox">` or role="switch" button reflecting `enabledCategories.includes(category.id)`; call `toggleCategory(category.id)` on click; when `isLastEnabled` (only one category remains enabled), render the toggle with `disabled` and show an inline note "At least one category must remain selected" below the category list; import from `useCategoryContext`
- [X] T005 [P] [US1] Modify `src/components/TabBar/TabBar.tsx` — in the category tab loop, filter `CATEGORIES` to only those in `enabledCategories` before rendering; replace the sun/moon theme toggle `<button>` in the header row with a gear icon `<button aria-label="Open settings">` that calls `openSettings()` from `useCategoryContext()`; remove the `useThemeContext` import from TabBar (theme toggle moves to SettingsScreen)
- [X] T006 [US1] Write Playwright tests for US1 in `tests/e2e/settings.spec.ts` — test: gear icon visible in header and tapping it opens Settings screen; test: all 5 category toggles visible in Settings; test: deselecting "Sports" and closing Settings removes Sports tab from tab bar; test: min-one guard — deselect until only one remains, attempt to deselect it, toggle stays checked and guard message appears; test: active tab auto-switch — activate Sports, open Settings, deselect Sports, close Settings — active tab is no longer Sports; test: preferences survive hard reload — deselect two categories, reload, both still absent

**Checkpoint**: US1 done — category personalisation is fully functional.

---

## Phase 4: User Story 2 — Restore a Category (Priority: P2)

**Goal**: Previously hidden categories can be re-enabled from Settings.

**Independent Test**: Deselect a category, reload, re-open Settings, re-enable it, close — tab reappears and loads articles normally.

- [X] T007 [US2] Write Playwright tests for US2 in `tests/e2e/settings.spec.ts` — test: a hidden category toggle is unchecked in Settings; test: re-enabling a hidden category restores its tab to the tab bar; test: the restored tab loads articles (navigating to it shows the feed, not an error)

*Note: US2 implementation is covered by T004 (toggleCategory bidirectional). Only test coverage is needed.*

**Checkpoint**: US1 + US2 done — personalisation is fully reversible.

---

## Phase 5: User Story 3 — Settings Accessible Everywhere (Priority: P3)

**Goal**: Settings is reachable from any tab; it also hosts the dark mode toggle (centralised preference hub).

**Independent Test**: From the Bookmarks tab, tap the gear icon → Settings opens. Toggle dark mode in Settings → html gets `dark` class.

- [X] T008 [US3] Add "APPEARANCE" section to `src/components/SettingsScreen/SettingsScreen.tsx` — below the categories section, add an "APPEARANCE" label and a dark/light mode toggle row; import `useThemeContext`; render a button (or checkbox) with `aria-label` matching the existing pattern (`"Switch to dark mode"` / `"Switch to light mode"`) and call `toggleTheme()` on click
- [X] T009 [US3] Write Playwright tests for US3 in `tests/e2e/settings.spec.ts` — test: Settings is reachable from the Bookmarks tab (gear icon visible, Settings screen opens); test: dark mode toggle is visible in Settings Appearance section; test: tapping dark mode toggle in Settings applies the `dark` class to `html`; test: gear icon is visible while a search query is active (SearchBar is on screen)

**Checkpoint**: All 3 user stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T010 [P] Run TypeScript type-check — `npx tsc --noEmit` — zero errors required
- [X] T011 [P] Run full Playwright test suite — `npm test` — all tests pass (existing 80 + new settings tests)

---

## Dependencies

```
T001 (types) ──→ T002 (context) ──→ T003 (App.tsx routing)
                              ├──→ T004 [P] (SettingsScreen component)
                              └──→ T005 [P] (TabBar gear icon + filter)

T003 + T004 + T005 ──→ T006 (US1 tests)
T006 ──→ T007 (US2 tests — same test file)
T007 ──→ T008 (US3: dark mode in SettingsScreen)
T008 ──→ T009 (US3 tests)

T009 ──→ T010 [P], T011 [P]
```

## Parallel Execution

- T004 and T005 can run in parallel (different files, both depend only on T002)
- T010 and T011 can run concurrently (independent validation steps)

---

## Implementation Strategy

### MVP — US1 only (core personalisation)

1. T001 → T002 → T003: Type + context + App routing
2. T004 ∥ T005: SettingsScreen + TabBar
3. T006: US1 tests pass
4. Ship: users can customise their tab bar

### Full feature

5. T007: US2 tests (restore category — already implemented)
6. T008 → T009: Dark mode in Settings + US3 tests

**Total tasks**: 11
**By phase**: Setup 1 + Foundation 2 + US1 3 + US2 1 + US3 2 + Polish 2
**Parallel opportunities**: T004 ∥ T005, T010 ∥ T011
