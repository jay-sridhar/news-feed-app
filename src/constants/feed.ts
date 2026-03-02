export const PAGE_SIZE = 10

export const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000

export const REFRESH_INTERVAL_MS = 10 * 60 * 1000

export const ALLORIGINS_BASE = import.meta.env.DEV
  ? '/allorigins'
  : 'https://api.allorigins.win'
