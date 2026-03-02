# Contract: Component Props — 002-search-filter

**Scope**: New and modified component contracts for the in-feed keyword search feature
**Date**: 2026-03-01

Changes in this feature:
1. **New**: `SearchBar` component
2. **Modified**: `useFeed` hook return type (`allArticles` added)
3. **Unchanged**: `TabBar`, `FeedContainer`, `NewsCard`, `LoadingSpinner`, `ErrorState`, `ScrollSentinel`, `CategoryContextValue`

---

## SearchBar *(new)*

```typescript
interface SearchBarProps {
  value: string              // controlled input value — the current query string
  onChange: (value: string) => void   // fires on every keystroke; parent updates value
  onClear: () => void        // fires when clear button is tapped; parent resets value to ''
  placeholder?: string       // input placeholder text; default: "Search articles…"
}
```

**Behaviour contract**:
- Renders a full-width text input styled for mobile (min height 44 px touch target).
- When `value.length > 0`: renders a clear (×) button inside the input on the trailing edge.
- When `value.length === 0`: clear button is absent.
- Tapping clear calls `onClear()` — the parent is responsible for resetting state; `SearchBar` does not manage its own value.
- `onChange` is called with the raw `event.target.value` string on every `input` event.
- Entirely controlled — no internal `useState`.

**Placement**: rendered by `FeedContainer` immediately before the article list, visible only
when `status === 'success'`.

---

## Hook: `useFeed` *(modified — additive)*

```typescript
interface UseFeedReturn {
  articles: NewsArticle[]        // paginated slice (0..displayCount) — UNCHANGED
  allArticles: NewsArticle[]     // full fetched set, unsorted — NEW
  status: FeedStatus             // UNCHANGED
  error: string | null           // UNCHANGED
  lastRefreshed: number | null   // UNCHANGED
  hasMore: boolean               // UNCHANGED
  loadMore: () => void           // UNCHANGED
  retry: () => void              // UNCHANGED
}
```

`allArticles` reflects the same internal state array that already exists inside `useFeed`.
It is updated on initial fetch and on every auto-refresh (new items prepended, deduped by
`link`). It is reset to `[]` when `categoryId` changes.

Consumers that do not need the full set can continue to ignore `allArticles` — no breaking
change.

---

## FeedContainer *(no new props — internal behaviour change only)*

```typescript
// No props — reads CategoryContext directly (unchanged)
```

Internal additions (not part of the prop contract but documented for review):
- `const [query, setQuery] = useState<string>('')`
- `useEffect(() => { setQuery('') }, [activeCategory])` — resets query on tab switch
- Renders `<SearchBar>` when `status === 'success'`
- Derives `filteredArticles` from `allArticles` when `query` is non-empty; uses paginated `articles` when `query` is empty
- `<ScrollSentinel>` is rendered only when `query.trim() === ''` and `status === 'success'`
