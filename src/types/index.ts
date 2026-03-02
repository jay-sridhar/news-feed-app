export type CategoryId = 'top' | 'tech' | 'tamilnadu' | 'india' | 'sports'

export type Theme = 'light' | 'dark'

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
  enabledCategories: CategoryId[]
  toggleCategory: (id: CategoryId) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

export type ActiveTab = CategoryId | 'bookmarks'

export interface BookmarkedArticle extends NewsArticle {
  savedAt: number  // Unix timestamp (ms) — Date.now() at time of bookmarking
}
