import { formatDistanceToNow } from 'date-fns'

export function formatRelativeTime(pubDate: string): string {
  if (!pubDate) return 'Recently'

  try {
    const date = new Date(pubDate)
    if (isNaN(date.getTime())) return 'Recently'
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return 'Recently'
  }
}
