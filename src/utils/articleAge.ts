import { FRESHNESS_WINDOW_MS } from '../constants/feed'

export { FRESHNESS_WINDOW_MS }

/**
 * Returns true if the article should be shown in the feed.
 * - Missing or blank pubDate → always show (unknown age)
 * - Unparseable pubDate → always show (graceful fallback)
 * - Age <= FRESHNESS_WINDOW_MS (24 h) → show
 * - Age > FRESHNESS_WINDOW_MS → hide
 */
export function isRecent(pubDate: string): boolean {
  if (!pubDate || pubDate.trim() === '') return true
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return true
  return Date.now() - date.getTime() <= FRESHNESS_WINDOW_MS
}
