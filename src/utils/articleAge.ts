/**
 * Returns true if the article should be shown given the freshness window.
 * - windowMs null → 'all time', always show
 * - Missing/blank/unparseable pubDate → always show (graceful fallback)
 * - Age <= windowMs → show
 */
export function isRecent(pubDate: string, windowMs: number | null): boolean {
  if (windowMs === null) return true
  if (!pubDate || pubDate.trim() === '') return true
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return true
  return Date.now() - date.getTime() <= windowMs
}
