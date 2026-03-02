# Quickstart: NewsFlow Development Setup

**Feature**: `001-newsflow-feed`
**Date**: 2026-03-01

---

## Prerequisites

- Node.js 20 LTS or later
- npm 10+ (or pnpm / bun — adjust commands accordingly)
- A modern browser (Chrome/Safari/Firefox)

---

## 1. Scaffold the Project

From the repo root:

```bash
npm create vite@latest . -- --template react-ts
# Accept overwrite prompts — this creates src/, index.html, vite.config.ts, tsconfig.json
```

---

## 2. Install Dependencies

```bash
npm install
npm install rss-parser date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 3. Configure Tailwind

In `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

In `src/index.css` (replace contents):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 4. Configure Vite (dev proxy)

In `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/allorigins': {
        target: 'https://api.allorigins.win',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/allorigins/, ''),
      },
    },
  },
})
```

---

## 5. Configure TypeScript

Ensure `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true
  }
}
```

---

## 6. Add Vercel SPA Fallback

Create `vercel.json` at repo root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 7. Run Development Server

```bash
npm run dev
# App available at http://localhost:5173
```

Open on a mobile device or use Chrome DevTools → Device Toolbar → 375px width to
verify mobile layout.

---

## 8. Validate the Setup

### Check tab bar renders
- [ ] Five tabs visible: Top Stories, Technology & AI, Tamil Nadu / Chennai,
      National India, Sports
- [ ] Tab bar is sticky (scroll page — tabs stay at top)

### Check RSS fetch works
- [ ] Top Stories tab shows articles (headline + source + time)
- [ ] Each article card is tappable and opens in a new tab
- [ ] Browser DevTools Network tab shows requests to `/allorigins/get?url=...`
      (dev) or `api.allorigins.win` (prod)

### Check category switching
- [ ] Tapping each tab loads a different set of articles
- [ ] Feed resets to top when switching tabs

### Check error handling
- [ ] Disable network in DevTools → switch tabs → "Unable to load" message appears
- [ ] Tap retry → feed attempts reload

### Check mobile layout
- [ ] At 375px width: no horizontal scroll, all card text readable, tab labels
      accessible (horizontal scroll on tab bar is acceptable)

---

## 9. Build & Deploy

```bash
npm run build
# Output: dist/ — static files ready for Vercel

# Deploy (requires Vercel CLI)
npx vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deployments on push to `main`.

---

## 10. Environment Variables (none required)

The app uses no `.env` secrets. All data sources (Google News RSS + allorigins.win) are
public. If switching the CORS proxy in the future, update `ALLORIGINS_BASE` in
`src/constants/feed.ts`.
