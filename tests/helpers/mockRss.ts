import type { Page, Route } from '@playwright/test'

export interface MockArticle {
  title: string
  source: string
  link: string
  pubDate?: string
}

/**
 * Generates a valid RSS 2.0 XML string from an array of article specs.
 * pubDate defaults to 2 hours ago if not provided.
 */
export function buildRssXml(articles: MockArticle[], feedTitle = 'Test Feed'): string {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toUTCString()

  const items = articles
    .map(
      ({ title, source, link, pubDate }) => `
    <item>
      <title>${title} - ${source}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${link}</guid>
      <pubDate>${pubDate ?? twoHoursAgo}</pubDate>
      <source url="https://example.com">${source}</source>
    </item>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${feedTitle}</title>
    <link>https://news.google.com</link>
    <language>en-IN</language>
    ${items}
  </channel>
</rss>`
}

/** Wraps RSS XML in the allorigins.win JSON envelope. */
export function allOriginsEnvelope(xml: string): string {
  return JSON.stringify({
    contents: xml,
    status: {
      url: 'https://news.google.com/rss',
      content_type: 'application/xml; charset=UTF-8',
      http_code: 200,
    },
  })
}

/**
 * Intercepts all /allorigins/get* requests and returns the given articles.
 * Call before page.goto().
 */
export async function mockFeed(page: Page, articles: MockArticle[]): Promise<void> {
  const xml = buildRssXml(articles)
  const body = allOriginsEnvelope(xml)

  await page.route('**/allorigins/get**', (route: Route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    })
  })
}

/**
 * Intercepts all /allorigins/get* requests and returns a 500 error.
 */
export async function mockFeedError(page: Page): Promise<void> {
  await page.route('**/allorigins/get**', (route: Route) => {
    void route.fulfill({ status: 500, body: 'Internal Server Error' })
  })
}

/** Builds a standard set of N articles with predictable titles.
 *  Pass pubDateOverride to fix every article's pubDate (e.g. for freshness tests).
 */
export function makeArticles(count: number, prefix = 'Article', pubDateOverride?: string): MockArticle[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `${prefix} ${i + 1}`,
    source: `Source ${i + 1}`,
    link: `https://example.com/article-${i + 1}`,
    ...(pubDateOverride !== undefined ? { pubDate: pubDateOverride } : {}),
  }))
}
