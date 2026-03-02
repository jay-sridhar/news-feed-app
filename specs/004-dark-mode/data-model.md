# Data Model: Dark Mode

**Feature**: `004-dark-mode`
**Date**: 2026-03-02

---

## New Types

### `Theme`

```typescript
// src/types/index.ts — NEW
export type Theme = 'light' | 'dark'
```

The active display theme. Used as the state type in `ThemeContext` and as the value stored in `localStorage`.

---

### `ThemeContextValue`

```typescript
// src/context/ThemeContext.tsx
export interface ThemeContextValue {
  theme: Theme                // currently active theme ('light' | 'dark')
  toggleTheme: () => void     // switches theme and persists manual preference
}
```

Provided by `ThemeProvider` at the App root. Consumed by `TabBar` (toggle button) only. Other components read theme via Tailwind `dark:` classes — they do NOT consume this context.

---

## localStorage Schema

```
Key:   'newsflow_theme'
Value: 'dark' | 'light'
       — absent (null) when user has never manually toggled
       — present only after user explicitly taps the toggle button
```

**Three states**:
| localStorage value | Meaning |
|--------------------|---------|
| `'dark'`           | User manually chose dark — overrides OS |
| `'light'`          | User manually chose light — overrides OS |
| absent (null)      | No manual preference — follow OS (`prefers-color-scheme`) |

**Read**: Synchronously in `useState` lazy initializer on `ThemeProvider` mount.
**Write**: Only in `toggleTheme()` — never written on OS auto-detect.
**Failure handling**: All `localStorage` access wrapped in `try/catch`; errors silently ignored.

---

## No-Flash Inline Script Logic

Runs synchronously in `<head>` before any HTML body renders:

```
1. Read localStorage.getItem('newsflow_theme')
2. If 'dark'  → document.documentElement.classList.add('dark') → done
3. If 'light' → do nothing → done
4. If absent  → check window.matchMedia('(prefers-color-scheme: dark)').matches
5.             → if true → document.documentElement.classList.add('dark')
```

This ensures Tailwind's `dark:` utility classes are applied before the first browser paint.

---

## Theme State Transitions

```
Initial state: no localStorage entry
      │
      ├─ OS = dark  ──→ theme = 'dark'  (runtime only, nothing written to localStorage)
      └─ OS = light ──→ theme = 'light' (runtime only)
             │
             │ user taps toggle button
             ▼
      theme flips, localStorage.setItem('newsflow_theme', newTheme)
      → manual preference now active
      → OS changes ignored until localStorage is cleared
             │
             │ user taps toggle button again
             ▼
      theme flips again, localStorage updated
             │
             │ user clears localStorage
             ▼
      Falls back to OS preference on next load
```

---

## Component Data Flow

```
ThemeProvider (App root)
├── theme: Theme                 ← from localStorage or OS matchMedia
└── toggleTheme()                ← writes to localStorage + updates state

    TabBar
    └── useThemeContext()         ← reads theme (for icon), calls toggleTheme on button tap

    All other components          ← do NOT consume ThemeContext
    └── Tailwind dark: classes    ← automatically applied when <html> has 'dark' class
```

Only `TabBar` consumes `ThemeContext` directly. Every other component is themed passively via the `dark` class on `<html>` and Tailwind's `dark:` utility variants.

---

## Colour Palette Mapping

| Surface | Light | Dark |
|---------|-------|------|
| Page background | `bg-white` | `dark:bg-gray-900` |
| Card / input surface | `bg-gray-50` | `dark:bg-gray-800` |
| Borders & dividers | `border-gray-100` / `border-gray-200` | `dark:border-gray-700` |
| Primary text | `text-gray-900` | `dark:text-gray-100` |
| Secondary text | `text-gray-500` / `text-gray-600` | `dark:text-gray-400` |
| Muted text | `text-gray-400` | `dark:text-gray-500` |
| Blue accents | `text-blue-700`, `border-blue-600` | unchanged (readable on dark bg) |
| Spinner ring | `border-gray-200` | `dark:border-gray-700` |
| Active card tap | `active:bg-gray-50` | `dark:active:bg-gray-800` |
