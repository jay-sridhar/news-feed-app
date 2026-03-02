# NewsFlow

A mobile-first Indian news feed app by **Jay Sridhar** — 14 configurable RSS categories, real-time search, bookmarks, dark mode, and optional Google cloud sync.

## Features

- **14 configurable categories** — Top Stories, National, International, Regional (state-aware), Technology, AI, Business & Stocks, Weather, Sports, Science, Education, Media & Show-Biz, Literature, Religion
- **Region picker** — select your state; Regional and National feeds update automatically
- **Freshness filter** — show articles from last 6 h / 12 h / 24 h (default) / 48 h / 7 days / all time
- **Article snippets** — related headline preview shown below each card
- **Infinite scroll** — loads 10 articles at a time as you scroll
- **Auto-refresh** — new articles prepend every 10 minutes without losing scroll position
- **Collapsible search** — tap the 🔍 icon to filter by headline or source; closes and clears on tab switch
- **Bookmarks** — save articles; persists across sessions
- **Dark mode** — toggle in the header or Settings; follows OS preference; preference persists
- **Google Sign-In** — optional; syncs bookmarks and preferences across devices via Firestore
- **Settings screen** — full-screen overlay (tab bar hidden while open)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 (mobile-first, `darkMode: 'class'`) |
| State | React Context + built-in hooks only |
| RSS parsing | `rss-parser` — `parseString()` via self-hosted Vercel proxy |
| Date formatting | `date-fns` |
| Auth / sync | Firebase 10 — Google Sign-In + Firestore |
| Testing | Playwright (`@playwright/test`) — 103 E2E tests |
| Deployment | Vercel (static SPA + serverless proxy function) |

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

npm test             # Run all 103 Playwright E2E tests
npm run test:ui      # Interactive Playwright UI mode
npm run test:headed  # Headed browser (visible window)
npm run test:report  # Open last HTML test report
```

## Project Structure

```
src/
├── App.tsx
├── types/index.ts              # Shared types (NewsArticle, CategoryId, FreshnessWindow…)
├── constants/
│   ├── categories.ts           # buildCategories(region), INDIA_STATES, CATEGORY_MAP
│   └── feed.ts                 # PAGE_SIZE, FRESHNESS_OPTIONS, ALLORIGINS_BASE
├── context/
│   ├── AuthContext.tsx         # Google Sign-In, UserProfile
│   ├── CategoryContext.tsx     # Active tab, enabled categories, region, freshness, search query
│   ├── BookmarkContext.tsx     # Bookmarks — Firestore onSnapshot + localStorage fallback
│   └── ThemeContext.tsx        # Dark/light theme + OS change listener
├── hooks/
│   ├── useFeed.ts              # RSS fetch, freshness filter, auto-refresh, infinite scroll
│   └── useIntersectionObserver.ts
├── services/
│   ├── firebase.ts             # Firebase init (null-safe when env vars absent)
│   └── rssService.ts           # fetchFeed() via /api proxy; snippet extraction
├── utils/
│   ├── relativeTime.ts         # formatRelativeTime()
│   └── articleAge.ts           # isRecent(pubDate, windowMs)
└── components/
    ├── TabBar/                 # Sticky nav — search 🔍, dark mode ☀️/🌙, settings ⚙️ icons
    ├── FeedContainer/          # Article list + scroll sentinel (search via context)
    ├── NewsCard/               # Headline + snippet + source + bookmark button
    ├── BookmarksContainer/     # Saved articles view
    ├── SettingsScreen/         # Full-screen settings (account, region, feed, categories, appearance)
    ├── LoadingSpinner/
    ├── ErrorState/
    └── ScrollSentinel/         # IntersectionObserver trigger for load-more

api/
└── get.ts                      # Vercel serverless proxy — fetches Google News RSS server-side

tests/
├── helpers/mockRss.ts          # buildRssXml, mockFeed, makeArticles
└── e2e/
    ├── app.spec.ts             # Feed loading, card rendering
    ├── tabs.spec.ts            # Category switching, defaults
    ├── scroll.spec.ts          # Infinite scroll
    ├── error.spec.ts           # Error states and retry
    ├── search.spec.ts          # Collapsible search, keyword filter
    ├── bookmarks.spec.ts       # Bookmark/unbookmark, persistence
    ├── darkmode.spec.ts        # OS detect, toggle, localStorage
    ├── settings.spec.ts        # Category toggles, region, freshness, appearance
    └── auth.spec.ts            # Google Sign-In mock, cloud sync
```

## CORS Proxy

RSS feeds are fetched via a self-hosted Vercel serverless function (`api/get.ts`) that proxies requests to `news.google.com`. This avoids browser CORS restrictions and rate limits.

- **Dev**: Vite proxies `/api` → `https://api.allorigins.win` (same response shape)
- **Prod**: Vercel routes `/api/get?url={encoded}` to the serverless function

## Firebase / Cloud Sync

Set the following environment variables (Vercel dashboard or `.env.local`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

All Firebase values are optional — the app runs fully offline without them. When absent, `src/services/firebase.ts` exports `null` for all Firebase instances and all callers skip cloud operations gracefully.

## Deployment

Deployed on Vercel. Any push to `main` triggers a production deploy after CI passes.
