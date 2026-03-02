/**
 * US4 — Infinite Scroll
 * Tests: PAGE_SIZE initial display, scroll-triggered load, end-of-feed message.
 */
import { test, expect } from '@playwright/test'
import { mockFeed, makeArticles } from '../helpers/mockRss'

const PAGE_SIZE = 10

test.describe('US4 — Infinite Scroll', () => {
  test('initially shows exactly PAGE_SIZE articles', async ({ page }) => {
    // 15 articles available — only first 10 should be visible
    await mockFeed(page, makeArticles(15))
    await page.goto('/')

    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    const cards = page.getByRole('link')
    await expect(cards).toHaveCount(PAGE_SIZE)
  })

  test('scrolling to bottom reveals more articles', async ({ page }) => {
    await mockFeed(page, makeArticles(15))
    await page.goto('/')
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    // Initial count = 10
    await expect(page.getByRole('link')).toHaveCount(PAGE_SIZE)

    // Scroll to bottom to trigger sentinel
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Should now show all 15 articles
    await expect(page.getByRole('link')).toHaveCount(15, { timeout: 5_000 })
  })

  test('shows "You\'re all caught up" when all articles are visible', async ({ page }) => {
    // Exactly PAGE_SIZE articles — all visible from the start
    await mockFeed(page, makeArticles(PAGE_SIZE))
    await page.goto('/')
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    await expect(page.getByText("You're all caught up")).toBeVisible({ timeout: 5_000 })
  })

  test('end-of-feed message appears after scrolling through all articles', async ({ page }) => {
    await mockFeed(page, makeArticles(15))
    await page.goto('/')
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    // No end message yet
    await expect(page.getByText("You're all caught up")).not.toBeVisible()

    // Trigger scroll to load remaining 5
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByRole('link')).toHaveCount(15, { timeout: 5_000 })

    // Scroll again to ensure sentinel is in view after new articles appended
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByText("You're all caught up")).toBeVisible({ timeout: 5_000 })
  })

  test('switching tabs resets displayed count to PAGE_SIZE', async ({ page }) => {
    // Sports is not enabled by default — enable it for this test
    await page.addInitScript(() => {
      localStorage.setItem(
        'newsflow_enabled_categories',
        JSON.stringify(['top', 'sports'])
      )
    })
    await mockFeed(page, makeArticles(15))
    await page.goto('/')
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    // Trigger load-more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByRole('link')).toHaveCount(15, { timeout: 5_000 })

    // Switch tab and back
    await page.getByRole('button', { name: 'Sports' }).click()
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Top Stories' }).click()
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })

    // displayCount should be reset to PAGE_SIZE
    await expect(page.getByRole('link')).toHaveCount(PAGE_SIZE, { timeout: 5_000 })
  })
})
