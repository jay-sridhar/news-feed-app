/**
 * US2 — Switch News Categories
 * Tests: tab rendering, switching feeds, sticky behaviour.
 */
import { test, expect, type Page, type Route } from '@playwright/test'
import { mockFeed, buildRssXml, allOriginsEnvelope, makeArticles } from '../helpers/mockRss'

const CATEGORY_LABELS = [
  'Top Stories',
  'Technology & AI',
  'Tamil Nadu / Chennai',
  'National India',
  'Sports',
]

/** Intercepts allorigins requests and returns category-specific articles based on the URL param. */
async function mockAllCategories(page: Page): Promise<void> {
  await page.route('**/allorigins/get**', (route: Route) => {
    const url = new URL(route.request().url())
    const encodedFeedUrl = url.searchParams.get('url') ?? ''
    const feedUrl = decodeURIComponent(encodedFeedUrl)

    let prefix = 'Story'
    if (feedUrl.includes('topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRq')) prefix = 'Tech Story'
    else if (feedUrl.includes('search?q=Tamil')) prefix = 'TN Story'
    else if (feedUrl.includes('topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4')) prefix = 'India Story'
    else if (feedUrl.includes('topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1')) prefix = 'Sports Story'

    const xml = buildRssXml(makeArticles(10, prefix), `${prefix} Feed`)
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: allOriginsEnvelope(xml),
    })
  })
}

test.describe('US2 — Switch News Categories', () => {
  test('tab bar displays all 5 category tabs', async ({ page }) => {
    await mockFeed(page, makeArticles(10))
    await page.goto('/')

    for (const label of CATEGORY_LABELS) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })

  test('app name "NewsFlow" is visible in the header', async ({ page }) => {
    await mockFeed(page, makeArticles(10))
    await page.goto('/')
    await expect(page.getByText('NewsFlow')).toBeVisible()
  })

  test('switching to Technology & AI shows tech articles', async ({ page }) => {
    await mockAllCategories(page)
    await page.goto('/')

    // Wait for initial load
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    // Switch tab
    await page.getByRole('button', { name: 'Technology & AI' }).click()

    // Tech articles should appear
    await expect(page.getByText('Tech Story 1').first()).toBeVisible({ timeout: 10_000 })
    // Old top-stories articles should be gone (exact match avoids hitting "Tech Story 1")
    await expect(page.getByText('Story 1', { exact: true }).first()).not.toBeVisible()
  })

  test('switching tabs sets the correct aria-current', async ({ page }) => {
    await mockFeed(page, makeArticles(10))
    await page.goto('/')

    const techTab = page.getByRole('button', { name: 'Technology & AI' })
    await techTab.click()

    await expect(techTab).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: 'Top Stories' })).not.toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  test('switching tabs resets feed scroll to top', async ({ page }) => {
    await mockAllCategories(page)
    await page.goto('/')
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))

    // Switch tab
    await page.getByRole('button', { name: 'Sports' }).click()

    // Feed container should be at top after switch
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBe(0)
  })

  test('tab bar is sticky and visible after scrolling', async ({ page }) => {
    // Use many articles to create scrollable content
    await mockFeed(page, makeArticles(20))
    await page.goto('/')
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    await page.evaluate(() => window.scrollTo(0, 600))

    const nav = page.getByRole('navigation', { name: 'News categories' })
    await expect(nav).toBeInViewport()
  })

  test('cycles through all tabs without errors', async ({ page }) => {
    await mockAllCategories(page)
    await page.goto('/')
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    for (const label of CATEGORY_LABELS) {
      await page.getByRole('button', { name: label }).click()
      // Each tab should show articles (not an error state)
      await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })
    }
  })
})
