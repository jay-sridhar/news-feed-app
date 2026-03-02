# Data Model: Expanded Categories with Region Personalisation (008)

## Entities

### UserRegion

Represents the user's geographic personalisation for National and Regional news.

| Field | Type | Description |
|-------|------|-------------|
| `country` | `string` | User's country. Currently always `"India"`. |
| `state` | `string` | User's state/region. Must match a value in `INDIA_STATES`. |

**Default**: `{ country: 'India', state: 'Tamil Nadu' }` — exported as `DEFAULT_USER_REGION`.

**Persistence**:
- Key: `newsflow_user_region`
- Format: `JSON.stringify({ country, state })`
- Read: once on `CategoryProvider` mount
- Write: on every `setUserRegion` call

**Validation on load**: Object must have `country: string` and `state: string`. Falls back to `DEFAULT_USER_REGION` if missing or malformed.

---

### Category (updated)

`CategoryId` is now a union of 9 values:

```ts
export type CategoryId =
  | 'top'
  | 'national'
  | 'regional'
  | 'tech'
  | 'ai'
  | 'softwaredev'
  | 'business'
  | 'weather'
  | 'sports'
```

The old IDs `'tamilnadu'` and `'india'` are removed. The old `'tech'` ID is retained but the label changes from "Technology & AI" to "Technology" (AI is now a separate category `'ai'`).

---

### buildCategories (pure function)

```ts
function buildCategories(region: UserRegion): Category[]
```

Produces the full 9-element `Category[]` array. The `regional` entry's `label` and `feedUrl` are computed from `region.state`:

| ID | Label | Feed URL pattern |
|----|-------|-----------------|
| `top` | Top Stories | `news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en` |
| `national` | National – India | Google News India topic (fixed topic ID) |
| `regional` | Regional – `{state}` | `news.google.com/rss/search?q={state}+OR+{city}` (URI-encoded) |
| `tech` | Technology | Google News technology topic (fixed topic ID) |
| `ai` | Artificial Intelligence | Google News search: `artificial+intelligence+OR+ChatGPT+OR+machine+learning+OR+Gemini` |
| `softwaredev` | Software & Jobs | Google News search: `software+development+OR+programming+OR+tech+jobs+OR+layoffs+startup` |
| `business` | Business & Stocks | Google News search: `stock+market+OR+BSE+OR+NSE+OR+Sensex+OR+Nifty+OR+Indian+economy` |
| `weather` | Weather | Google News search: `weather+India+OR+monsoon+OR+cyclone+OR+IMD+forecast` |
| `sports` | Sports | Google News sports topic (fixed topic ID) |

**Static exports** (built from `DEFAULT_USER_REGION`, used for ID validation only):
```ts
export const CATEGORIES: Category[] = buildCategories(DEFAULT_USER_REGION)
export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(...)
```

---

### CategoryPreferences (updated defaults)

| Field | Old default | New default |
|-------|-------------|-------------|
| `enabledIds` default | `['top', 'tech', 'tamilnadu', 'india', 'sports']` (all 5) | `['top']` (top only) |
| Max length | 5 | 9 |

---

## Context State Extensions

The following fields are **added** to `CategoryContextValue` (beyond what 006 added):

| Field | Type | Description |
|-------|------|-------------|
| `categories` | `Category[]` | Full 9-category list, recomputed via `useMemo` whenever `userRegion` changes |
| `userRegion` | `UserRegion` | Current country/state selection |
| `setUserRegion` | `(r: UserRegion) => void` | Updates region; saves to localStorage; dual-writes to Firestore if signed in |

---

## localStorage Keys (complete list after 008)

| Key | Feature | Type |
|-----|---------|------|
| `newsflow_theme` | 004 | `'light' \| 'dark'` |
| `newsflow_bookmarks` | 003 | `JSON: BookmarkedArticle[]` |
| `newsflow_enabled_categories` | 006 | `JSON: CategoryId[]` |
| `newsflow_user_region` | **008** | `JSON: { country: string; state: string }` |

---

## INDIA_STATES lookup table

```ts
export const INDIA_STATES: { value: string; city: string }[] = [
  { value: 'Andhra Pradesh', city: 'Vijayawada' },
  { value: 'Delhi',          city: 'New Delhi' },
  { value: 'Gujarat',        city: 'Ahmedabad' },
  { value: 'Haryana',        city: 'Gurugram' },
  { value: 'Karnataka',      city: 'Bengaluru' },
  { value: 'Kerala',         city: 'Thiruvananthapuram' },
  { value: 'Madhya Pradesh', city: 'Bhopal' },
  { value: 'Maharashtra',    city: 'Mumbai' },
  { value: 'Odisha',         city: 'Bhubaneswar' },
  { value: 'Punjab',         city: 'Chandigarh' },
  { value: 'Rajasthan',      city: 'Jaipur' },
  { value: 'Tamil Nadu',     city: 'Chennai' },
  { value: 'Telangana',      city: 'Hyderabad' },
  { value: 'Uttar Pradesh',  city: 'Lucknow' },
  { value: 'West Bengal',    city: 'Kolkata' },
]
```

The `city` field is used as an additional search term in the `regional` feed URL (e.g. `Tamil Nadu OR Chennai`), improving result relevance.

---

## useFeed API change

`useFeed` now accepts a `Category` object instead of a `CategoryId`:

```ts
// Before (features 001–007):
export function useFeed(categoryId: CategoryId): UseFeedReturn

// After (008):
export function useFeed(category: Category): UseFeedReturn
```

**Rationale**: The feed URL for `regional` is dynamic (changes with `userRegion`), so the hook must receive the full `Category` object — including the current `feedUrl` — rather than looking it up from a static map. A `useRef` pattern keeps the `doFetch` callback stable while still picking up URL changes between renders.

**Effect dependencies**:
- Initial fetch re-runs when `category.id` OR `category.feedUrl` changes.
- Auto-refresh interval re-runs only when `category.id` changes (the next tick after a URL-only change still uses the updated ref value).
