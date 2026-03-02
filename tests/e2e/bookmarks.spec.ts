/**
 * Bookmarks (003-bookmarks)
 * Tests: US1 bookmark toggle + persistence, US2 view bookmarks tab, US3 remove bookmarks + edge cases.
 *
 * Articles used across tests (after rssService strips the " - Source" suffix):
 *   title="Quantum Computing Advances"  sourceName="Tech Today"
 *   title="Space Mission Update"        sourceName="Science Weekly"
 *   title="Climate Summit Results"      sourceName="World News"
 */
import { test, expect } from '@playwright/test'
import { mockFeed } from '../helpers/mockRss'
import type { MockArticle } from '../helpers/mockRss'

const BOOKMARK_ARTICLES: MockArticle[] = [
  { title: 'Quantum Computing Advances', source: 'Tech Today', link: 'https://example.com/bm-1' },
  { title: 'Space Mission Update', source: 'Science Weekly', link: 'https://example.com/bm-2' },
  { title: 'Climate Summit Results', source: 'World News', link: 'https://example.com/bm-3' },
]

// ---------------------------------------------------------------------------
// US1 — Bookmark an Article
// ---------------------------------------------------------------------------

test.describe('US1 — Bookmark an Article', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, BOOKMARK_ARTICLES)
    await page.goto('/')
    await expect(page.getByLabel('Bookmark article').first()).toBeVisible({ timeout: 10_000 })
  })

  test('bookmark icon visible on every article card', async ({ page }) => {
    await expect(page.getByLabel('Bookmark article')).toHaveCount(3)
  })

  test('tapping bookmark icon fills it immediately', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await expect(page.getByLabel('Remove bookmark').first()).toBeVisible()
  })

  test('bookmarked article is saved to localStorage', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    const stored = await page.evaluate(() => localStorage.getItem('newsflow_bookmarks'))
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!) as Array<{ title: string }>
    expect(parsed.length).toBe(1)
    expect(parsed[0].title).toBe('Quantum Computing Advances')
  })

  test('bookmark icon persists after hard reload', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await expect(page.getByLabel('Remove bookmark').first()).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Remove bookmark').first()).toBeVisible({ timeout: 10_000 })
  })

  test('tapping filled icon empties it and removes from localStorage', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await expect(page.getByLabel('Remove bookmark').first()).toBeVisible()

    await page.getByLabel('Remove bookmark').first().click()
    await expect(page.getByLabel('Bookmark article').first()).toBeVisible()

    const stored = await page.evaluate(() => localStorage.getItem('newsflow_bookmarks'))
    const parsed = JSON.parse(stored ?? '[]') as unknown[]
    expect(parsed.length).toBe(0)
  })

  test('bookmark icon is filled when article appears in search results', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await expect(page.getByLabel('Remove bookmark').first()).toBeVisible()

    await page.getByRole('button', { name: 'Search articles' }).click()
    await page.getByPlaceholder('Search articles…').fill('Quantum')
    await expect(page.getByText('Quantum Computing Advances', { exact: false })).toBeVisible()
    await expect(page.getByLabel('Remove bookmark')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// US2 — View Saved Bookmarks
// ---------------------------------------------------------------------------

test.describe('US2 — View Saved Bookmarks', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, BOOKMARK_ARTICLES)
    await page.goto('/')
    await expect(page.getByLabel('Bookmark article').first()).toBeVisible({ timeout: 10_000 })
  })

  test('Bookmarks tab is visible in the tab bar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Bookmarks' })).toBeVisible()
  })

  test('Bookmarks tab shows empty-state when no bookmarks saved', async ({ page }) => {
    await page.getByRole('button', { name: 'Bookmarks' }).click()
    await expect(page.getByText('No bookmarks yet', { exact: false })).toBeVisible()
  })

  test('bookmarked articles appear in Bookmarks tab', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await page.getByRole('button', { name: 'Bookmarks' }).click()
    await expect(page.getByText('Quantum Computing Advances', { exact: false })).toBeVisible()
  })

  test('most recently bookmarked article appears first', async ({ page }) => {
    // Bookmark "Space Mission Update" (index 1) first
    await page.getByLabel('Bookmark article').nth(1).click()
    // Then bookmark "Quantum Computing Advances" (index 0) — now the most recent
    await page.getByLabel('Bookmark article').first().click()

    await page.getByRole('button', { name: 'Bookmarks' }).click()

    const headings = page.getByRole('heading', { level: 2 })
    await expect(headings.first()).toContainText('Quantum Computing Advances')
    await expect(headings.nth(1)).toContainText('Space Mission Update')
  })

  test('tapping article in Bookmarks tab opens it in a new browser tab', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await page.getByRole('button', { name: 'Bookmarks' }).click()
    await expect(page.getByText('Quantum Computing Advances', { exact: false })).toBeVisible()

    const [newTab] = await Promise.all([
      page.context().waitForEvent('page'),
      page.getByText('Quantum Computing Advances', { exact: false }).click(),
    ])
    await expect(newTab).toHaveURL('https://example.com/bm-1')
    await newTab.close()
  })

  test('Bookmarks tab stays active after opening an article', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await page.getByRole('button', { name: 'Bookmarks' }).click()

    const [newTab] = await Promise.all([
      page.context().waitForEvent('page'),
      page.getByText('Quantum Computing Advances', { exact: false }).click(),
    ])
    await newTab.close()

    await expect(page.getByRole('button', { name: 'Bookmarks' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  test('bookmarks survive a full page reload', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await page.reload()
    await expect(page.getByLabel('Remove bookmark').first()).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Bookmarks' }).click()
    await expect(page.getByText('Quantum Computing Advances', { exact: false })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// US3 — Remove a Bookmark
// ---------------------------------------------------------------------------

test.describe('US3 — Remove a Bookmark', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, BOOKMARK_ARTICLES)
    await page.goto('/')
    await expect(page.getByLabel('Bookmark article').first()).toBeVisible({ timeout: 10_000 })
  })

  test('tapping bookmark icon in Bookmarks tab removes article from list', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await page.getByRole('button', { name: 'Bookmarks' }).click()
    await expect(page.getByText('Quantum Computing Advances', { exact: false })).toBeVisible()

    await page.getByLabel('Remove bookmark').click()
    await expect(page.getByText('Quantum Computing Advances', { exact: false })).not.toBeVisible()
  })

  test('removing last bookmark shows empty-state message immediately', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await page.getByRole('button', { name: 'Bookmarks' }).click()

    await page.getByLabel('Remove bookmark').click()
    await expect(page.getByText('No bookmarks yet', { exact: false })).toBeVisible()
  })

  test('removing from Bookmarks tab reverts icon to outline in the feed', async ({ page }) => {
    await page.getByLabel('Bookmark article').first().click()
    await page.getByRole('button', { name: 'Bookmarks' }).click()

    await page.getByLabel('Remove bookmark').click()

    await page.getByRole('button', { name: 'Top Stories' }).click()
    await expect(page.getByText('Quantum Computing Advances', { exact: false })).toBeVisible({
      timeout: 10_000,
    })
    // Icon should be outline (not filled)
    await expect(page.getByLabel('Remove bookmark')).toHaveCount(0)
    await expect(page.getByLabel('Bookmark article').first()).toBeVisible()
  })

  test('tapping bookmark button does not navigate to the article', async ({ page }) => {
    const initialUrl = page.url()
    const initialPageCount = page.context().pages().length

    await page.getByLabel('Bookmark article').first().click()

    // Icon changed state — bookmark worked
    await expect(page.getByLabel('Remove bookmark').first()).toBeVisible()
    // URL did not change — no navigation triggered
    expect(page.url()).toBe(initialUrl)
    // No new tab opened
    expect(page.context().pages().length).toBe(initialPageCount)
  })
})
