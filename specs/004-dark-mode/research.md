# Research: Dark Mode

**Feature**: `004-dark-mode`
**Date**: 2026-03-02
**Status**: Complete — all decisions resolved from existing project context and standard web patterns.

---

## Decision 1: Tailwind Dark Mode Strategy — `darkMode: 'class'`

**Decision**: Set `darkMode: 'class'` in `tailwind.config.js`. Toggle the `dark` class on `<html>` element via JavaScript. All dark-mode styles use `dark:` utility prefixes.

**Rationale**: Two options exist in Tailwind:
- `'media'` — purely CSS, auto-follows `prefers-color-scheme` media query, no JS needed, but provides **zero manual toggle ability** (US2 would be impossible)
- `'class'` — requires one line of JS to toggle, but supports **both** OS auto-detect (read `prefers-color-scheme` in JS) and manual override (toggle the class regardless of OS)

`'class'` is the only option that satisfies both US1 (auto-detect) and US2 (manual toggle). The cost — one class toggle on `<html>` — is trivial.

**Alternatives considered**: `darkMode: 'media'` — rejected: cannot support manual toggle.

---

## Decision 2: No-Flash on Load — Inline Script in `index.html`

**Decision**: Add a small synchronous `<script>` block in `index.html` (inside `<head>`, before any stylesheet or body content) that reads `localStorage.getItem('newsflow_theme')` and sets `document.documentElement.classList.add('dark')` if appropriate. This runs **before** React mounts and before the browser paints.

**Rationale**: FR-011 requires no visible flash of the wrong theme on load. React is a client-side SPA — it hydrates after the initial HTML parse. If the `dark` class is only added by React's `useEffect`, there is a guaranteed frame where the page renders without it. The inline script executes synchronously during HTML parsing, before any layout or paint, making it the only reliable solution.

The script is ~10 lines, reads:
1. `localStorage.getItem('newsflow_theme')` — use stored value if present
2. Otherwise check `window.matchMedia('(prefers-color-scheme: dark)').matches` — use OS preference

This is the standard pattern used by Next.js themes, Docusaurus, and most production dark-mode SPAs.

**Alternatives considered**:
- React `useEffect` to add class — rejected: runs after first paint, causes FOUC every time stored preference is 'dark'
- CSS-only `prefers-color-scheme` media query — rejected: no manual toggle, also doesn't handle stored preference override
- Server-side cookie + SSR — rejected: Constitution Principle I (no backend)

---

## Decision 3: ThemeContext at App Root

**Decision**: Create a `ThemeContext` at the App root (outside `BookmarkProvider` and `CategoryProvider`) providing `{ theme: 'light' | 'dark', toggleTheme: () => void }`. Internal state initialized via lazy `useState` from localStorage. `useEffect([theme])` syncs state to `document.documentElement.classList` and localStorage. A separate `useEffect` registers/unregisters the `matchMedia` change listener when no manual preference is stored.

**Rationale**: The toggle button lives in `TabBar`. In a future feature, other components could also react to the theme (e.g., to swap images or illustrations). The minimum scope covering all current consumers is the App root — identical reasoning to `BookmarkContext`. The context is dedicated and small.

**Alternatives considered**:
- Prop-drill `theme` + `toggleTheme` from App → TabBar — rejected: works for one level, breaks when deeper consumers need theme access
- CSS-only via `prefers-color-scheme` without JS — rejected: no manual toggle, no persistence

---

## Decision 4: OS Change Listener — `matchMedia` Event

**Decision**: In `ThemeContext`, register `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler)` in a `useEffect`. The handler only fires if `localStorage.getItem('newsflow_theme')` is null (no manual preference). Cleanup removes the listener on unmount.

**Rationale**: FR-003 requires the app to update in real time when the OS theme changes (without a page reload), but only when the user has not set a manual override (FR-007). The `matchMedia` change event provides this. Checking localStorage inside the handler (rather than React state) avoids stale closure issues.

**Alternatives considered**:
- Re-read `prefers-color-scheme` only on page load — rejected: violates FR-003 (real-time update required)
- Polling — rejected: wasteful; `matchMedia` events are the correct API

---

## Decision 5: localStorage Key and Values

**Decision**: Key `'newsflow_theme'`, values `'dark'` | `'light'`. Key is **absent** (null) when the user has not made a manual choice. Absence = follow OS.

**Rationale**: A three-state model (dark / light / null-follow-OS) cleanly separates "user has expressed a preference" from "user wants the app to follow the OS". This avoids a confusing fourth state (`'system'`) and makes the toggle semantics clear: tapping always alternates between `'dark'` and `'light'`, storing the choice.

When the user wants to reset to OS-following, they clear localStorage (edge case, out of scope for the UI).

**Alternatives considered**:
- Always store a value (`'dark'` or `'light'`, defaulting to `'light'`) — rejected: cannot distinguish "user chose light" from "user never touched it", breaking OS-change tracking on first load
- Three stored values including `'system'` — rejected: adds complexity for an edge case not requested in spec (no "reset to OS" button in scope)

---

## Decision 6: Colour Palette — Tailwind Gray Scale

**Decision**: Use Tailwind's built-in gray scale for dark theme backgrounds and text:
- `dark:bg-gray-900` — page background
- `dark:bg-gray-800` — card / input surfaces
- `dark:border-gray-700` — borders and dividers
- `dark:text-gray-100` — primary text
- `dark:text-gray-400` — secondary/muted text (unchanged from light)
- Blue accents (`blue-600`, `blue-700`) remain unchanged — both themes readable
- Tab bar: `dark:bg-gray-900 dark:border-gray-700`

**Rationale**: Tailwind's gray-900/800 palette is a standard, well-tested dark UI baseline (used by Tailwind UI, GitHub dark mode, etc.). No new colour tokens needed. Contrast ratios between `gray-100` text on `gray-900` background and between `gray-400` on `gray-800` are sufficient for reading news content.

**Alternatives considered**:
- Custom CSS variables for a fully bespoke palette — rejected: over-engineering for a news reader; standard grays are adequate and require zero extra config
- `zinc` or `slate` gray family — rejected: functional equivalents; `gray` is already established in the codebase

---

## Decision 7: Toggle Button — Sun/Moon SVG Icons in TabBar Header Row

**Decision**: Place the toggle `<button>` in the TabBar header row (`<div className="px-4 pt-3 pb-0">`), right-aligned by making that div `flex items-center justify-between`. Show a moon icon (🌙 outline SVG) when light theme is active (tap = go dark), and a sun icon (☀ outline SVG) when dark theme is active (tap = go light). Touch target ≥ 44×44 px.

**Rationale**: The header row already contains only the "NewsFlow" `<h1>` — it has natural space for a right-side control. Placing it here keeps it always visible regardless of which tab is active, matching the spec's "visible in the app header at all times" requirement. SVG icons match the existing bookmark icon approach (inline SVG, no icon library).

**Alternatives considered**:
- Floating button overlay — rejected: harder to hit precisely, may obscure content
- Toggle in a settings drawer — rejected: excessive indirection for a single binary setting
- Text label ("Light / Dark") — rejected: takes more space, less universal than an icon

---

## Decision 8: No New npm Dependencies

**Decision**: Zero new packages. All logic uses Tailwind's built-in `dark:` variant, native `localStorage`, and native `window.matchMedia`.

**Rationale**: Constitution Principle V. No theme library adds value here. The feature is implementable in ~150 lines of new code across 2 new files (ThemeContext + inline script) plus `dark:` class additions to existing components.

**Alternatives considered**:
- `next-themes` — rejected: React framework dependency not applicable to Vite SPA
- Custom CSS variables approach via a library — rejected: unnecessary abstraction
