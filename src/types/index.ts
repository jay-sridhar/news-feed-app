export type CategoryId =
  | 'top'
  | 'national'
  | 'international'
  | 'regional'
  | 'tech'
  | 'ai'
  | 'business'
  | 'weather'
  | 'sports'
  | 'science'
  | 'education'
  | 'showbiz'
  | 'literature'
  | 'religion'

export type Theme = 'light' | 'dark'

export type FreshnessWindow = '6h' | '12h' | '24h' | '48h' | '7d' | 'all'

export interface UserRegion {
  country: string
  state: string
}

export interface Category {
  id: CategoryId
  label: string
  feedUrl: string
  order: number
}

export interface NewsArticle {
  id: string
  title: string
  link: string
  pubDate: string
  sourceName: string
  categoryId: CategoryId
  snippet?: string
}

export type FeedStatus = 'idle' | 'loading' | 'success' | 'error'

export interface FeedState {
  articles: NewsArticle[]
  status: FeedStatus
  error: string | null
  lastRefreshed: number | null
  displayCount: number
}

export interface CategoryContextValue {
  activeCategory: ActiveTab
  setActiveCategory: (id: ActiveTab) => void
  categories: Category[]
  enabledCategories: CategoryId[]
  toggleCategory: (id: CategoryId) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  userRegion: UserRegion
  setUserRegion: (region: UserRegion) => void
  freshnessWindow: FreshnessWindow
  setFreshnessWindow: (w: FreshnessWindow) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export type ActiveTab = CategoryId | 'bookmarks'

export interface BookmarkedArticle extends NewsArticle {
  savedAt: number  // Unix timestamp (ms) — Date.now() at time of bookmarking
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
}

export interface AuthContextValue {
  user: UserProfile | null
  authLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export interface CloudPreferences {
  enabledCategories: CategoryId[]
  theme: Theme
  userRegion?: UserRegion
  freshnessWindow?: FreshnessWindow
}
