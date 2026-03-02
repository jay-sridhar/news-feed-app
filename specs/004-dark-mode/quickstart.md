# Quickstart: Dark Mode

**Feature**: `004-dark-mode`
**Date**: 2026-03-02

---

## Pre-requisites

- App running: `npm run dev` → http://localhost:5173
- Open Chrome DevTools, set device to iPhone 14 (390 × 844)
- To simulate OS dark mode: DevTools → Rendering (three-dot menu → More tools) → set **Emulate CSS media feature prefers-color-scheme** to `dark` or `light`

---

## Scenario 1: OS Auto-Detect (US1 — P1)

1. Open DevTools → Rendering → set `prefers-color-scheme` to **dark**.
2. Open the app (or hard-reload).
3. **Expected**: App renders with dark background immediately — no white flash.
4. Switch `prefers-color-scheme` to **light** in DevTools.
5. **Expected**: App updates to light theme in real time, no page reload needed.
6. Switch back to **dark**.
7. **Expected**: App returns to dark theme in real time.

**Failure indicators**: White flash on initial dark-mode load; app doesn't update when OS changes; page background stays white.

---

## Scenario 2: Manual Toggle (US2 — P2)

1. Set `prefers-color-scheme` to **light** (so OS is light).
2. Open the app. Confirm it shows in light theme.
3. Tap the **moon icon** (☽) in the header next to "NewsFlow".
4. **Expected**: App switches to dark theme immediately. Moon icon changes to a sun icon (☀).
5. Tap the **sun icon** (☀).
6. **Expected**: App switches back to light theme. Sun icon changes back to moon.
7. Set `prefers-color-scheme` to **dark** in DevTools.
8. **Expected**: App stays in light theme (manual preference overrides OS).

**Failure indicators**: Toggle button missing; icon doesn't change; theme doesn't switch; OS change overrides manual preference.

---

## Scenario 3: Persistent Preference (US3 — P3)

1. Tap the toggle to switch to dark mode.
2. Open DevTools → Application → Local Storage → `http://localhost:5173`.
3. **Expected**: `newsflow_theme` key exists with value `"dark"`.
4. Hard-reload the page (`Cmd+Shift+R`).
5. **Expected**: App loads in dark mode immediately — no white flash.
6. Tap toggle to switch to light mode. Hard-reload.
7. **Expected**: App loads in light mode.
8. Delete the `newsflow_theme` key in DevTools → Application → Local Storage.
9. Hard-reload.
10. **Expected**: App follows OS preference again.

**Failure indicators**: Theme lost after reload; flash of wrong theme; localStorage key not written.

---

## Scenario 4: All Views in Dark Mode

1. Set to dark mode (toggle or OS).
2. Verify each view:
   - **Top Stories feed** — dark cards, light text, dark tab bar
   - **Search** — dark input field, dark text, visible placeholder
   - **Bookmarks tab (empty)** — dark background, readable empty-state message
   - **Bookmarks tab (with items)** — dark cards, same as feed
   - **Loading state** — spinner visible on dark background
   - **Error state** — readable message, blue retry button

**Failure indicators**: Any view shows white background; text unreadable in dark; search input invisible.

---

## Validate the Setup

- [ ] `<html>` element has `dark` class when dark mode is active (check in Elements panel)
- [ ] No white flash on page load when `newsflow_theme: "dark"` is in localStorage
- [ ] Moon icon visible in header when light mode is active
- [ ] Sun icon visible in header when dark mode is active
- [ ] Toggle button is tappable at 375 px width without horizontal overflow
- [ ] OS `prefers-color-scheme: dark` auto-applies dark theme on fresh load
- [ ] OS change updates theme in real time when no manual preference is set
- [ ] Manual preference stored in `localStorage.newsflow_theme` after toggle
- [ ] Manual preference overrides OS when set
- [ ] Deleting `newsflow_theme` from localStorage restores OS-following behaviour after reload
- [ ] All 6 views (feed, search active, bookmarks empty, bookmarks with items, loading, error) are readable in dark mode

---

## Running the E2E Tests

```bash
npm test                    # run all Playwright tests (includes darkmode.spec.ts)
npm run test:ui             # interactive mode
npm run test:headed         # see browser window
```

Test file: `tests/e2e/darkmode.spec.ts`
