# NewsFlow

A mobile-first Indian news feed app — categorised RSS articles with real-time search, bookmarks, and dark mode.

## Features

- **Categorised feed** — Top Stories, Technology & AI, Tamil Nadu, India, Sports
- **Infinite scroll** — loads 10 articles at a time as you scroll
- **Auto-refresh** — new articles prepend every 5 minutes without losing scroll position
- **Real-time search** — filter by headline or source name within the current tab
- **Bookmarks** — save articles locally; persists across sessions via localStorage
- **Dark mode** — follows OS preference automatically; override with a toggle in the header; preference persists

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 (mobile-first, `darkMode: 'class'`) |
| State | React Context + built-in hooks only |
| RSS parsing | `rss-parser` (via allorigins.win CORS proxy) |
| Date formatting | `date-fns` |
| Testing | Playwright (`@playwright/test`) — 73 E2E tests |
| Deployment | Vercel (static SPA) |

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npx tsc --noEmit     # Type-check

npm test             # Run all 73 Playwright E2E tests
npm run test:ui      # Interactive Playwright UI mode
npm run test:headed  # Headed browser (visible window)
npm run test:report  # Open last HTML test report
```

## Project Structure

```
src/
├── App.tsx
├── types/index.ts              # Shared types (NewsArticle, CategoryId, Theme…)
├── constants/                  # Categories config, feed constants
├── context/
│   ├── CategoryContext.tsx     # Active tab state
│   ├── BookmarkContext.tsx     # Bookmarks + localStorage sync
│   └── ThemeContext.tsx        # Dark/light theme + OS change listener
├── hooks/
│   ├── useFeed.ts              # RSS fetch, auto-refresh, infinite scroll state
│   └── useIntersectionObserver.ts
├── services/rssService.ts      # fetchFeed() via allorigins.win
├── utils/relativeTime.ts       # formatRelativeTime()
└── components/
    ├── TabBar/                 # Nav tabs + dark mode toggle button
    ├── FeedContainer/          # Search bar + article list + scroll sentinel
    ├── NewsCard/               # Article card with bookmark button
    ├── BookmarksContainer/     # Saved articles view
    ├── SearchBar/
    ├── LoadingSpinner/
    ├── ErrorState/
    └── ScrollSentinel/         # IntersectionObserver trigger for load-more

tests/
├── helpers/mockRss.ts          # buildRssXml, mockFeed, makeArticles
└── e2e/
    ├── app.spec.ts             # Feed loading, card rendering
    ├── tabs.spec.ts            # Category switching
    ├── scroll.spec.ts          # Infinite scroll
    ├── error.spec.ts           # Error states and retry
    ├── search.spec.ts          # Keyword filter
    ├── bookmarks.spec.ts       # Bookmark/unbookmark, persistence
    └── darkmode.spec.ts        # OS detect, toggle, localStorage
```

## CORS Proxy

RSS feeds are fetched via [allorigins.win](https://allorigins.win):

- **Dev**: Vite proxies `/allorigins` → `https://api.allorigins.win` (avoids mixed-content)
- **Prod**: browser calls `https://api.allorigins.win/get?url={encoded}` directly

## Deployment

Deployed on Vercel. Any push to `main` triggers a production deploy. The `vercel.json` rewrites all routes to `index.html` for SPA routing.
