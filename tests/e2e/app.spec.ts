/**
 * US1 — Browse Top Stories
 * Tests: app load, card content, article link behaviour.
 */
import { test, expect } from '@playwright/test'
import { mockFeed, makeArticles } from '../helpers/mockRss'

test.describe('US1 — Browse Top Stories', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, makeArticles(12, 'Top Story'))
    await page.goto('/')
  })

  test('Top Stories tab is active by default', async ({ page }) => {
    const topTab = page.getByRole('button', { name: 'Top Stories' })
    await expect(topTab).toHaveAttribute('aria-current', 'page')
  })

  test('news cards are visible after loading', async ({ page }) => {
    // Wait for at least one card to appear
    await expect(page.getByRole('link').first()).toBeVisible({ timeout: 10_000 })
  })

  test('each card shows headline, source name and relative time', async ({ page }) => {
    // Wait for the first article
    const firstCard = page.getByRole('link').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })

    // Headline
    await expect(page.getByText('Top Story 1').first()).toBeVisible()

    // Source name
    await expect(page.getByText('Source 1').first()).toBeVisible()

    // Relative time — should contain "ago" for a 2-hour-old article
    const timeEl = page.locator('span').filter({ hasText: /ago|just now|recently/i }).first()
    await expect(timeEl).toBeVisible()
  })

  test('tapping a card opens the article in a new tab', async ({ page, context }) => {
    const firstCard = page.getByRole('link').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      firstCard.click(),
    ])

    expect(newPage.url()).toContain('example.com/article-1')
  })

  test('original tab remains open after clicking a card', async ({ page, context }) => {
    const firstCard = page.getByRole('link').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })

    await Promise.all([
      context.waitForEvent('page'),
      firstCard.click(),
    ])

    // Original page URL unchanged
    expect(page.url()).toContain('localhost:5173')
  })

  test('app renders with visible content', async ({ page }) => {
    // Either loading spinner OR articles — the app is alive
    await expect(
      page.getByRole('navigation', { name: 'News categories' })
    ).toBeVisible()
  })
})
