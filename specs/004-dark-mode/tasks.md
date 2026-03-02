# Tasks: Dark Mode (004-dark-mode)

**Input**: Design documents from `/specs/004-dark-mode/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/component-props.md ✓, quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in all task descriptions

---

## Phase 1: Setup

**Purpose**: Global config changes that unlock Tailwind's `dark:` variant and define the `Theme` type

- [X] T001 Add `darkMode: 'class'` as the first key in `tailwind.config.js`; add `export type Theme = 'light' | 'dark'` to `src/types/index.ts`
- [X] T002 Add no-flash inline IIFE to `index.html` inside `<head>` before `</head>`: reads `localStorage.getItem('newsflow_theme')` — if `'dark'` adds `document.documentElement.classList.add('dark')`; if absent checks `window.matchMedia('(prefers-color-scheme: dark)').matches` and adds class if true; entire block wrapped in `try/catch`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `ThemeContext` and `ThemeProvider` that power all three user stories

**⚠️ CRITICAL**: No user story toggle or persistence work can begin until this phase is complete

- [X] T003 Create `src/context/ThemeContext.tsx` — export `Theme` type re-export; define `ThemeContextValue { theme: Theme, toggleTheme: () => void }`; implement `ThemeProvider` with lazy `useState<Theme>` initializer (reads `localStorage.getItem('newsflow_theme')`, falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches`); `useEffect([theme])` syncs `document.documentElement.classList.add/remove('dark')` (does NOT write localStorage); `useEffect([])` registers `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler)` where handler only updates state when `localStorage.getItem('newsflow_theme') === null` (cleanup removes listener); `toggleTheme()` flips state and calls `localStorage.setItem('newsflow_theme', next)` in `try/catch`; export `useThemeContext()` hook that throws descriptive error if used outside provider
- [X] T004 Update `src/App.tsx` — import `ThemeProvider` from `src/context/ThemeContext.tsx`; wrap entire return with `<ThemeProvider>` as the outermost provider (outside `BookmarkProvider`); add `dark:bg-gray-900` to the root `<div className="flex min-h-screen flex-col bg-white">`

**Checkpoint**: ThemeContext + App wrapping done — dark class on `<html>` now controls all `dark:` utilities

---

## Phase 3: User Story 1 — Auto-Detect OS Theme (Priority: P1) 🎯 MVP

**Goal**: All app surfaces render correctly in dark theme when `<html>` has the `dark` class (set by OS or inline script)

**Independent Test**: Open DevTools → Rendering → set `prefers-color-scheme: dark` → reload — app renders in dark theme with no white flash. Toggle to `prefers-color-scheme: light` — app updates in real time.

- [X] T005 [P] [US1] Add dark: classes to `src/components/TabBar/TabBar.tsx` — nav element: `dark:bg-gray-900 dark:border-gray-700`; h1 title: `dark:text-gray-100`; inactive tab buttons: `dark:text-gray-400 dark:active:text-gray-200`
- [X] T006 [P] [US1] Add dark: classes to `src/components/NewsCard/NewsCard.tsx` — outer wrapper div: `dark:border-gray-700`; content div: `dark:active:bg-gray-800`; h2 title: `dark:text-gray-100`; dot separator span: `dark:text-gray-600`; timestamp span: `dark:text-gray-500`; bookmark button: `dark:text-gray-500`
- [X] T007 [P] [US1] Add dark: classes to `src/components/SearchBar/SearchBar.tsx` — input: `dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-800`; clear button: `dark:text-gray-500 dark:hover:text-gray-300`
- [X] T008 [P] [US1] Add dark: classes to `src/components/LoadingSpinner/LoadingSpinner.tsx` — spinner ring div: `dark:border-gray-700`; message paragraph: `dark:text-gray-400`
- [X] T009 [P] [US1] Add dark: class to `src/components/ErrorState/ErrorState.tsx` — message paragraph: `dark:text-gray-400`
- [X] T010 [P] [US1] Add dark: class to `src/components/FeedContainer/FeedContainer.tsx` — no-results paragraph: `dark:text-gray-500`
- [X] T011 [P] [US1] Add dark: class to `src/components/BookmarksContainer/BookmarksContainer.tsx` — empty-state paragraph: `dark:text-gray-500`
- [X] T012 [US1] Write US1 Playwright tests in `tests/e2e/darkmode.spec.ts` — use `page.emulateMedia({ colorScheme: 'dark' })` to simulate dark OS; test: `<html>` has `dark` class when OS is dark; `<html>` does NOT have `dark` class when OS is light; real-time OS change (`page.emulateMedia({ colorScheme: 'light' })` after load) updates the `dark` class without reload

---

## Phase 4: User Story 2 — Manual Theme Toggle (Priority: P2)

**Goal**: A sun/moon button in the TabBar header lets users override the OS theme; icon reflects current mode

**Independent Test**: OS is light. Tap moon icon → app goes dark (html.dark), icon becomes sun. Tap sun → back to light. Verify manual choice is stored in localStorage.

- [X] T013 [US2] Add toggle button to `src/components/TabBar/TabBar.tsx` — import `useThemeContext`; change header `<div className="px-4 pt-3 pb-0">` to `<div className="flex items-center justify-between px-4 pt-3 pb-0">`; add `<button aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">` with inline SVG moon icon (path `M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z`) when light, and sun icon (circle r=5 + 8 ray lines) when dark
- [X] T014 [US2] Add US2 Playwright tests to `tests/e2e/darkmode.spec.ts` — test: toggle button visible in header; aria-label is `'Switch to dark mode'` when light; tapping toggle adds `dark` class to `<html>`; aria-label changes to `'Switch to light mode'` when dark; tapping again removes `dark` class; manual dark overrides OS light (`emulateMedia: light` + toggle to dark → still dark); `localStorage.getItem('newsflow_theme')` is `'dark'` after toggling to dark

---

## Phase 5: User Story 3 — Persistent Preference (Priority: P3)

**Goal**: Manual theme preference survives page reload and browser session; clears gracefully

**Independent Test**: Toggle to dark → hard-reload → app loads dark without white flash → localStorage has `newsflow_theme: "dark"` → delete key → reload → app follows OS again

*(No new implementation — persistence is handled by `toggleTheme` writing to localStorage in T003 and the no-flash script in T002. Only tests needed.)*

- [X] T015 [US3] Add US3 Playwright tests to `tests/e2e/darkmode.spec.ts` — use `page.addInitScript(() => localStorage.setItem('newsflow_theme', 'dark'))` before `page.goto()` to simulate stored preference; test: `<html>` has `dark` class immediately on load (before React mounts) — check via `page.evaluate(() => document.documentElement.classList.contains('dark'))` before any React interaction; `localStorage.getItem('newsflow_theme')` is `'dark'` after toggle; `localStorage.getItem('newsflow_theme')` is `'light'` after second toggle; deleting the key (`localStorage.removeItem`) and reloading falls back to OS preference

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 [P] Run TypeScript type-check — `npx tsc --noEmit` — zero errors required; fix any type issues in `ThemeContext.tsx` or modified files
- [X] T017 [P] Audit 375 px mobile layout — confirm toggle button fits in header row without pushing "NewsFlow" title off-screen; verify `h-10 w-10` touch target is sufficient; check no horizontal overflow caused by the flex header row
- [X] T018 Run full Playwright test suite — `npm test` — all tests pass (existing 59 tests + new dark mode tests)

---

## Dependencies

```
T001 (tailwind + type) ──→ T003 (ThemeContext)
T002 (no-flash script)  ──→ T003
                                │
                                ↓
                          T004 (App.tsx wrap)
                                │
              ┌─────────────────┼──────────────────────────────────────┐
              ↓                 ↓                                      ↓
         T005 (TabBar)    T006 (NewsCard) T007 (SearchBar)   T008-T011 (other components)
              └──────────────── ┴ ──────────────────────────────────────┘
                                │
                           T012 (US1 tests)

T005 (TabBar dark: classes) ──→ T013 (toggle button added to TabBar)
T013 (toggle button) ─────────→ T014 (US2 tests)
T013 (toggle button) ─────────→ T015 (US3 tests)

T014 + T015 → T018 (full suite)
T016 [P] + T017 [P] → T018
```

## Parallel Execution

**After T004 complete**, these can run in parallel:
```
T005 (TabBar)  +  T006 (NewsCard)  +  T007 (SearchBar)
+  T008 (LoadingSpinner)  +  T009 (ErrorState)  +  T010 (FeedContainer)  +  T011 (BookmarksContainer)
```

**After T005 complete** (same file):
```
T013 (toggle button in TabBar)  [sequential — modifies same file as T005]
```

**After T013 complete**, these can be written sequentially (same file):
```
T014 (US2 tests) → T015 (US3 tests)  [same darkmode.spec.ts file]
```

**Polish** (after T015):
```
T016 (tsc)  +  T017 (layout audit)  →  T018 (full suite)
```

---

## Implementation Strategy

**MVP** — deliver US1 alone (OS auto-detect, all surfaces themed):
1. T001–T002: Config + no-flash script
2. T003–T004: ThemeContext + App wrapping
3. T005–T011: All component dark: classes (can be done in parallel)
4. T012: Verify US1 tests pass
5. → Ship MVP: app fully themed by OS preference, no flash

**Full feature** — add US2 + US3:
- T013: Toggle button in TabBar (manual control)
- T014–T015: Tests for persistence + override
- T016–T018: Polish + full suite

**Total tasks**: 18
**By phase**: Setup 2 + Foundation 2 + US1 8 + US2 2 + US3 1 + Polish 3
**Parallel opportunities**: T005–T011 (7 component tasks after T004), T016/T017 (Polish)
