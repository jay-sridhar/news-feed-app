import { test, expect } from '@playwright/test'
import { mockFeed, makeArticles } from '../helpers/mockRss'

const STALE = new Date(Date.now() - 48 * 60 * 60 * 1000).toUTCString()  // 48 h ago
const RECENT = new Date(Date.now() - 2 * 60 * 60 * 1000).toUTCString()   // 2 h ago

// ---------------------------------------------------------------------------
// US1 — Fresh feed only
// ---------------------------------------------------------------------------
test.describe('US1 — 24-hour freshness filter', () => {
  test('stale articles (48 h old) are not shown', async ({ page }) => {
    await mockFeed(page, [
      ...makeArticles(3, 'Recent', RECENT),
      ...makeArticles(2, 'Stale', STALE),
    ])
    await page.goto('/')
    await page.waitForSelector('h2')

    // Recent articles visible
    await expect(page.getByText('Recent 1', { exact: true })).toBeVisible()
    await expect(page.getByText('Recent 2', { exact: true })).toBeVisible()
    await expect(page.getByText('Recent 3', { exact: true })).toBeVisible()

    // Stale articles not present
    await expect(page.getByText('Stale 1', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Stale 2', { exact: true })).not.toBeVisible()
  })

  test('all-stale feed shows "No recent articles. Check back later."', async ({ page }) => {
    await mockFeed(page, makeArticles(5, 'Old', STALE))
    await page.goto('/')
    await expect(page.getByText('No recent articles. Check back later.')).toBeVisible()
  })

  test('no spinner or blank screen when all articles are stale', async ({ page }) => {
    await mockFeed(page, makeArticles(3, 'Old', STALE))
    await page.goto('/')
    // Empty-state message present — not a blank page or loading spinner
    await expect(page.getByText('No recent articles. Check back later.')).toBeVisible()
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// US2 — Graceful handling of missing / malformed dates
// ---------------------------------------------------------------------------
test.describe('US2 — graceful missing-date fallback', () => {
  test('articles with empty pubDate are shown', async ({ page }) => {
    await mockFeed(page, makeArticles(3, 'NoPubDate', ''))
    await page.goto('/')
    await page.waitForSelector('h2')
    await expect(page.getByText('NoPubDate 1', { exact: true })).toBeVisible()
    await expect(page.getByText('NoPubDate 2', { exact: true })).toBeVisible()
    await expect(page.getByText('NoPubDate 3', { exact: true })).toBeVisible()
  })

  test('articles with malformed pubDate are shown', async ({ page }) => {
    await mockFeed(page, makeArticles(2, 'BadDate', 'not-a-date'))
    await page.goto('/')
    await page.waitForSelector('h2')
    await expect(page.getByText('BadDate 1', { exact: true })).toBeVisible()
    await expect(page.getByText('BadDate 2', { exact: true })).toBeVisible()
  })

  test('all-missing-date feed is not empty', async ({ page }) => {
    await mockFeed(page, makeArticles(4, 'NoDate', ''))
    await page.goto('/')
    await page.waitForSelector('h2')
    // Should show articles, not the "No recent articles" empty state
    await expect(page.getByText('No recent articles. Check back later.')).not.toBeVisible()
    await expect(page.getByText('NoDate 1', { exact: true })).toBeVisible()
  })

  test('mix of missing-date and stale articles: missing-date ones still show', async ({ page }) => {
    await mockFeed(page, [
      ...makeArticles(2, 'NoDate', ''),
      ...makeArticles(2, 'Stale', STALE),
    ])
    await page.goto('/')
    await page.waitForSelector('h2')
    await expect(page.getByText('NoDate 1', { exact: true })).toBeVisible()
    await expect(page.getByText('Stale 1', { exact: true })).not.toBeVisible()
  })
})
