# Contract: Component Props — 004-dark-mode

**Scope**: New and modified component contracts for the dark mode feature
**Date**: 2026-03-02

Changes in this feature:
1. **New**: `ThemeContext` — `ThemeContextValue`, `ThemeProvider`, `useThemeContext`
2. **Modified**: `TabBar` — add theme toggle button; add `dark:` classes
3. **Modified**: `App` — add `ThemeProvider` wrapper
4. **Modified**: `index.html` — add no-flash inline script
5. **Modified**: `tailwind.config.js` — add `darkMode: 'class'`
6. **Modified (dark: classes only)**: `NewsCard`, `SearchBar`, `LoadingSpinner`, `ErrorState`, `FeedContainer`, `BookmarksContainer`

---

## ThemeContext *(new)*

```typescript
// src/context/ThemeContext.tsx

export type Theme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}
```

`ThemeProvider` wraps the entire app (outermost provider, before `BookmarkProvider`). Initializes `theme` from:
1. `localStorage.getItem('newsflow_theme')` if `'dark'` or `'light'`
2. Otherwise `window.matchMedia('(prefers-color-scheme: dark)').matches`

`useEffect([theme])` syncs `document.documentElement.classList` — adds `'dark'` class when `theme === 'dark'`, removes it otherwise. Does **not** write to localStorage.

`toggleTheme()` flips `theme` and writes to `localStorage` — the only place localStorage is written (OS auto-detect changes do not write to localStorage).

`useThemeContext()` throws a descriptive error if used outside `ThemeProvider`.

---

## TabBar *(modified)*

```typescript
// No new props — reads CategoryContext + ThemeContext
// Props: none
```

Two internal changes:

**1. Header row becomes flex-between** to accommodate the toggle button:
```tsx
// Before:
<div className="px-4 pt-3 pb-0">
  <h1>NewsFlow</h1>
</div>

// After:
<div className="flex items-center justify-between px-4 pt-3 pb-0">
  <h1>NewsFlow</h1>
  <button aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
  </button>
</div>
```

**2. Dark classes added** to nav and tab buttons:
- `nav`: add `dark:bg-gray-900 dark:border-gray-700`
- `h1`: add `dark:text-gray-100`
- inactive tabs: add `dark:text-gray-400 dark:active:text-gray-200`

---

## App *(modified)*

```typescript
// No props (root component — unchanged signature)
```

Internal additions:
- Import `ThemeProvider`
- Wrap outermost: `<ThemeProvider><BookmarkProvider><CategoryProvider>…`
- Add `dark:bg-gray-900` to the root `<div>`

```typescript
export default function App(): JSX.Element {
  return (
    <ThemeProvider>
      <BookmarkProvider>
        <CategoryProvider>
          <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
            <TabBar />
            <main className="flex-1">
              <MainView />
            </main>
          </div>
        </CategoryProvider>
      </BookmarkProvider>
    </ThemeProvider>
  )
}
```

---

## NewsCard *(dark: classes only — no prop change)*

```
border-b border-gray-100        →  dark:border-gray-700
active:bg-gray-50               →  dark:active:bg-gray-800
text-gray-900 (title)           →  dark:text-gray-100
text-gray-300 (dot separator)   →  dark:text-gray-600
text-gray-400 (timestamp)       →  dark:text-gray-500
text-gray-400 (bookmark btn)    →  dark:text-gray-500
```

---

## SearchBar *(dark: classes only — no prop change)*

```
border-gray-200 bg-gray-50      →  dark:border-gray-700 dark:bg-gray-800
text-sm (input text)            →  dark:text-gray-100
placeholder                     →  dark:placeholder-gray-500
focus:bg-white                  →  dark:focus:bg-gray-800
text-gray-400 (clear btn)       →  dark:text-gray-500
hover:text-gray-600 (clear btn) →  dark:hover:text-gray-300
```

---

## LoadingSpinner *(dark: classes only — no prop change)*

```
border-gray-200 (spinner ring)  →  dark:border-gray-700
text-gray-500                   →  dark:text-gray-400
```

---

## ErrorState *(dark: classes only — no prop change)*

```
text-gray-600                   →  dark:text-gray-400
```

---

## FeedContainer *(dark: classes only — no prop change)*

```
text-gray-400 (no-results msg)  →  dark:text-gray-500
```

---

## BookmarksContainer *(dark: classes only — no prop change)*

```
text-gray-400 (empty state)     →  dark:text-gray-500
```

---

## index.html *(modified — no-flash script)*

Inline IIFE added to `<head>` before any CSS or body content:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('newsflow_theme');
      if (t === 'dark') { document.documentElement.classList.add('dark'); return; }
      if (t === 'light') { return; }
    } catch (e) {}
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

---

## tailwind.config.js *(modified)*

```javascript
export default {
  darkMode: 'class',   // ← ADD THIS
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```
