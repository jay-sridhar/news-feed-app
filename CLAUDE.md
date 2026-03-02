# NewsFlow Development Guidelines

Auto-generated from feature plan `001-newsflow-feed`. Last updated: 2026-03-01

## Active Technologies

- **Language**: TypeScript 5.x (strict mode — `"strict": true` in tsconfig.json)
- **Framework**: React 18 + Vite 5 (SPA, no SSR)
- **Styling**: Tailwind CSS 3 (utility-first, mobile-first)
- **State**: React Context + built-in hooks only
- **RSS Parsing**: `rss-parser` — use `parser.parseString(xml)` not `parseURL()`
- **Date/Time**: `date-fns` — `formatDistanceToNow` for relative timestamps
- **Deployment**: Vercel free tier (static, `vite build` → `dist/`)

## Project Structure

```text
src/
├── main.tsx
├── App.tsx
├── index.css                      # Tailwind directives only
├── types/index.ts                 # All shared interfaces (NewsArticle, Category, FeedState…)
├── constants/
│   ├── categories.ts              # Category[] with feedUrls
│   └── feed.ts                    # PAGE_SIZE, REFRESH_INTERVAL_MS, ALLORIGINS_BASE
├── context/CategoryContext.tsx    # Active category + tab navigation (ActiveTab)
├── context/BookmarkContext.tsx    # Bookmarks state — BookmarkProvider, useBookmarkContext, localStorage
├── hooks/
│   ├── useFeed.ts                 # RSS fetch, FeedState, auto-refresh, AbortController
│   └── useIntersectionObserver.ts # Scroll sentinel hook
├── services/rssService.ts         # fetchFeed(category, signal): NewsArticle[]
├── utils/relativeTime.ts          # formatRelativeTime(pubDate): string
└── components/
    ├── TabBar/TabBar.tsx
    ├── FeedContainer/FeedContainer.tsx
    ├── NewsCard/NewsCard.tsx
    ├── BookmarksContainer/BookmarksContainer.tsx
    ├── SearchBar/SearchBar.tsx
    ├── LoadingSpinner/LoadingSpinner.tsx
    ├── ErrorState/ErrorState.tsx
    └── ScrollSentinel/ScrollSentinel.tsx
```

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npx tsc --noEmit     # Type-check without building

npm test             # Run all Playwright E2E tests (auto-starts dev server)
npm run test:ui      # Interactive Playwright UI mode
npm run test:headed  # Headed browser mode (visible window)
npm run test:report  # Open last HTML test report
```

## Code Style

- No `any` types. Use `unknown` + type guards for RSS parser output.
- All components are `.tsx`, all non-component modules are `.ts`.
- Tailwind only — no inline styles, no CSS modules, no styled-components.
- Mobile-first: write base styles for 375px, add `sm:` / `md:` / `lg:` prefixes for wider screens.
- Functional components only. No class components.
- `useEffect` cleanup always returns an abort/cancel function.

## CORS Proxy

- **Dev**: `/allorigins/get?url={encoded}` — proxied by Vite to `https://api.allorigins.win`
- **Prod**: `https://api.allorigins.win/get?url={encoded}` — called directly from browser
- Controlled by `ALLORIGINS_BASE` in `src/constants/feed.ts` using `import.meta.env.DEV`
- Response shape: `{ contents: "<xml>", status: { url, content_type, http_code } }`

## Key Patterns

- **Fetch lifecycle**: `AbortController` per `useEffect`; abort on cleanup (tab switch / unmount)
- **Infinite scroll**: `displayCount` window over pre-fetched array; `IntersectionObserver` sentinel triggers `loadMore()`
- **Auto-refresh**: `setInterval(REFRESH_INTERVAL_MS)` in `useFeed`; new items prepended; deduplicated by `link`
- **Source name**: prefer `item.source._`; fall back to extracting ` - Source` suffix from title; default `"Unknown Source"`
- **Error state**: never show blank screen — always show retry UI when fetch fails
- **Dark mode**: `darkMode: 'class'` in Tailwind; `ThemeContext` at App root; no-flash `<script>` in `index.html <head>` reads localStorage then `prefers-color-scheme`; `toggleTheme()` is the only place that writes to localStorage; OS change listener skips update when `localStorage.getItem('newsflow_theme') !== null`

## Testing

- **Framework**: Playwright (`@playwright/test`) — Chromium only, 390×844 viewport (iPhone 14)
- **Config**: `playwright.config.ts` — `webServer` auto-starts `npm run dev`, 30s timeout
- **Test files**: `tests/e2e/` — `app.spec.ts` (US1), `tabs.spec.ts` (US2), `scroll.spec.ts` (US4), `error.spec.ts` (error handling), `search.spec.ts` (search), `bookmarks.spec.ts` (bookmarks), `darkmode.spec.ts` (dark mode)
- **Helpers**: `tests/helpers/mockRss.ts` — `buildRssXml`, `allOriginsEnvelope`, `mockFeed`, `mockFeedError`, `makeArticles`
- **Route interception**: `page.route('**/allorigins/get**', ...)` — intercepts at browser level before Vite proxy
- **Coverage**: 73 tests, all passing

### Known gotchas for tests
- React 18 Strict Mode double-invokes `useEffect` in dev → route mocks that simulate failure must fail for the first **2** calls (`callCount <= 2`), not just 1
- `page.getByText('X')` defaults to `exact: false` (substring) — use `{ exact: true }` when the text could appear as a substring of another element (e.g. "Story 1" inside "Tech Story 1")
- Switching categories triggers a `window.scrollTo({ top: 0 })` in `FeedContainer` — tests that check scroll position after tab switch need no extra scroll-wait
- `page.addInitScript` runs on every navigation including reloads — do NOT use it to seed localStorage for tests that later delete that key and reload; instead set the preference via toggle or `page.evaluate` before reload

## Known Issues Fixed

- **rss-parser crash in Vite dev mode**: `xml2js` (used by rss-parser) uses a CoffeeScript `})(events)` class pattern. Vite externalizes `events` to `{}`, causing `Object.create(undefined)` at module init time → React never mounts. Fixed with `vite-plugin-node-polyfills` polyfilling `events`, `stream`, `timers`, `url`, `http`, `https`.
- **Scroll position not reset on tab switch**: IntersectionObserver sentinel fires immediately after tab switch because scroll position was retained. Fixed by `window.scrollTo({ top: 0, behavior: 'instant' })` in `FeedContainer` on `activeCategory` change.

## Recent Changes
- 005-24h-filter: Added TypeScript 5.x (strict mode) + None new — uses native `Date` API only

- `004-dark-mode`: System-aware dark mode — ThemeContext, no-flash inline script, `darkMode: 'class'`, `dark:` classes across all components, toggle button in TabBar
- `003-bookmarks`: Bookmark toggle on every article — BookmarkContext (localStorage), BookmarksContainer, NewsCard restructure (sibling button), ActiveTab type, Bookmarks tab in TabBar

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
