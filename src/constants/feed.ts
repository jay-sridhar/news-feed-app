import type { FreshnessWindow } from '../types'

export const PAGE_SIZE = 10

export const REFRESH_INTERVAL_MS = 10 * 60 * 1000

export const ALLORIGINS_BASE = '/api'

export const DEFAULT_FRESHNESS_WINDOW: FreshnessWindow = '24h'

export const FRESHNESS_OPTIONS: { value: FreshnessWindow; label: string; ms: number | null }[] = [
  { value: '6h',  label: 'Last 6 hours',  ms: 6 * 60 * 60 * 1000 },
  { value: '12h', label: 'Last 12 hours', ms: 12 * 60 * 60 * 1000 },
  { value: '24h', label: 'Last 24 hours', ms: 24 * 60 * 60 * 1000 },
  { value: '48h', label: 'Last 48 hours', ms: 48 * 60 * 60 * 1000 },
  { value: '7d',  label: 'Last 7 days',   ms: 7 * 24 * 60 * 60 * 1000 },
  { value: 'all', label: 'All time',       ms: null },
]
