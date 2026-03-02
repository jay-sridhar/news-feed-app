import Parser from 'rss-parser'
import type { Category, NewsArticle, CategoryId } from '../types'
import { ALLORIGINS_BASE } from '../constants/feed'

type RssItem = {
  title?: string
  link?: string
  pubDate?: string
  guid?: string
  source?: {
    $?: { url?: string }
    _?: string
  }
  mediaContent?: {
    $?: { url?: string; medium?: string }
  }
}

const parser = new Parser<Record<string, unknown>, RssItem>({
  customFields: {
    item: [
      ['source', 'source', { keepArray: false }],
      ['media:content', 'mediaContent', { keepArray: false }],
    ],
  },
})

export function buildProxyUrl(rssUrl: string): string {
  return `${ALLORIGINS_BASE}/get?url=${encodeURIComponent(rssUrl)}`
}

function extractSourceName(item: RssItem): string {
  // Prefer the <source> element text content
  if (item.source?._) {
    return item.source._.trim()
  }
  // Fall back: extract "- Source Name" suffix from title
  const title = item.title ?? ''
  const dashIdx = title.lastIndexOf(' - ')
  if (dashIdx !== -1) {
    const candidate = title.slice(dashIdx + 3).trim()
    if (candidate.length > 0) return candidate
  }
  return 'Unknown Source'
}

function extractTitle(item: RssItem, sourceName: string): string {
  const raw = item.title ?? ''
  // Strip the " - Source Name" suffix if it matches
  const suffix = ` - ${sourceName}`
  if (raw.endsWith(suffix)) {
    return raw.slice(0, raw.length - suffix.length).trim()
  }
  return raw.trim()
}

export function parseRssItem(item: RssItem, categoryId: CategoryId): NewsArticle {
  const sourceName = extractSourceName(item)
  const title = extractTitle(item, sourceName)
  const link = item.link ?? item.guid ?? ''
  const pubDate = item.pubDate ?? ''
  const id = link
    ? encodeURIComponent(link).slice(0, 100)
    : `${categoryId}-${pubDate}-${title.slice(0, 20)}`

  const mediaUrl = item.mediaContent?.$?.url
  const mediaMedium = item.mediaContent?.$?.medium
  const imageUrl = mediaUrl && mediaUrl.length > 0 ? mediaUrl : undefined
  const imageType: 'image' | 'video' | undefined =
    imageUrl !== undefined
      ? mediaMedium === 'video'
        ? 'video'
        : 'image'
      : undefined

  return { id, title, link, pubDate, sourceName, categoryId, imageUrl, imageType }
}

export async function fetchFeed(
  category: Category,
  signal: AbortSignal
): Promise<NewsArticle[]> {
  const proxyUrl = buildProxyUrl(category.feedUrl)

  const response = await fetch(proxyUrl, { signal })

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: HTTP ${response.status}`)
  }

  const json = (await response.json()) as { contents?: string }

  if (!json.contents) {
    throw new Error('Empty feed response from proxy')
  }

  const feed = await parser.parseString(json.contents)

  if (!feed.items || feed.items.length === 0) {
    return []
  }

  return feed.items.map((item) => parseRssItem(item, category.id))
}
