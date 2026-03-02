/**
 * Error states and edge cases
 * Tests: fetch failure, retry, missing fields graceful handling.
 */
import { test, expect } from '@playwright/test'
import { mockFeed, mockFeedError, buildRssXml, allOriginsEnvelope } from '../helpers/mockRss'
import type { Route } from '@playwright/test'

test.describe('Error handling', () => {
  test('shows error state when feed fetch returns 500', async ({ page }) => {
    await mockFeedError(page)
    await page.goto('/')

    await expect(page.getByText(/unable to load/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /tap to retry/i })).toBeVisible()
  })

  test('retry button re-fetches and shows articles on success', async ({ page }) => {
    let callCount = 0

    await page.route('**/api/get**', (route: Route) => {
      callCount++
      if (callCount <= 2) {
        // First two calls fail (React Strict Mode double-invokes effects in dev)
        void route.fulfill({ status: 500, body: 'error' })
      } else {
        // Subsequent calls (after retry click): succeed
        const xml = buildRssXml(
          [{ title: 'Retry Article', source: 'Test Source', link: 'https://example.com/retry' }]
        )
        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: allOriginsEnvelope(xml),
        })
      }
    })

    await page.goto('/')
    await expect(page.getByRole('button', { name: /tap to retry/i })).toBeVisible({
      timeout: 10_000,
    })

    await page.getByRole('button', { name: /tap to retry/i }).click()

    await expect(page.getByText('Retry Article')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /tap to retry/i })).not.toBeVisible()
  })

  test('no blank screen on empty feed response', async ({ page }) => {
    await page.route('**/api/get**', (route: Route) => {
      // Empty items array
      const xml = buildRssXml([])
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: allOriginsEnvelope(xml),
      })
    })

    await page.goto('/')

    // Should show the empty-state message, not a white blank screen or loading spinner
    await expect(page.getByText('No recent articles. Check back later.')).toBeVisible({ timeout: 10_000 })
    // Body should have content (not empty)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(10)
  })

  test('card with missing link renders without crashing', async ({ page }) => {
    // Track JS errors before navigation
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.route('**/api/get**', (route: Route) => {
      // Article with empty link — rssService renders a <div> not an <a>
      const xml = buildRssXml([
        { title: 'No Link Article', source: 'Test Source', link: '' },
        { title: 'Normal Article', source: 'Test Source', link: 'https://example.com/normal' },
      ])
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: allOriginsEnvelope(xml),
      })
    })

    await page.goto('/')

    // Normal article renders as a link; "No Link Article" renders as a div (no <a>)
    await expect(page.getByRole('link', { name: /Normal Article/i })).toBeVisible({ timeout: 10_000 })
    // Headline text is still visible even without a link wrapper
    await expect(page.getByText('No Link Article')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('card with missing source defaults to "Unknown Source"', async ({ page }) => {
    await page.route('**/api/get**', (route: Route) => {
      // Title without " - Source" suffix, no <source> element
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>https://news.google.com</link>
    <item>
      <title>Sourceless Article</title>
      <link>https://example.com/no-source</link>
      <pubDate>${new Date(Date.now() - 60_000).toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: allOriginsEnvelope(xml),
      })
    })

    await page.goto('/')

    await expect(page.getByText('Sourceless Article')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Unknown Source')).toBeVisible()
  })

  test('switching tabs during in-flight fetch shows new tab content', async ({ page }) => {
    // Sports is not enabled by default — enable it so its tab is visible
    await page.addInitScript(() => {
      localStorage.setItem(
        'newsflow_enabled_categories',
        JSON.stringify(['top', 'sports'])
      )
    })

    await page.route('**/api/get**', async (route: Route) => {
      const url = new URL(route.request().url())
      const feedUrl = decodeURIComponent(url.searchParams.get('url') ?? '')

      if (feedUrl.includes('topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1')) {
        // Sports — respond immediately
        const xml = buildRssXml([{ title: 'Sports Story', source: 'ESPN', link: 'https://espn.com/1' }])
        void route.fulfill({ status: 200, contentType: 'application/json', body: allOriginsEnvelope(xml) })
      } else {
        // All other feeds — slow response (500ms)
        await new Promise((r) => setTimeout(r, 500))
        const xml = buildRssXml([{ title: 'Top Story', source: 'Reuters', link: 'https://reuters.com/1' }])
        void route.fulfill({ status: 200, contentType: 'application/json', body: allOriginsEnvelope(xml) })
      }
    })

    await page.goto('/')

    // Wait for Sports tab to be visible, then immediately switch
    const sportsTab = page.getByRole('button', { name: 'Sports' })
    await expect(sportsTab).toBeVisible()
    await sportsTab.click()

    // Sports content should appear — slow Top Stories fetch is aborted/discarded
    await expect(page.getByText('Sports Story')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Top Story')).not.toBeVisible()
  })
})
