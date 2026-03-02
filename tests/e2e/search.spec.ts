/**
 * In-Feed Keyword Search (002-search-filter)
 * Tests: US1 real-time filter, US2 clear button, US3 no-results state, US4 tab-switch reset.
 *
 * Articles used across tests (after rssService strips the " - Source" suffix):
 *   title="React Hooks Deep Dive"  sourceName="Tech Insider"
 *   title="Cricket World Cup"      sourceName="Sports Weekly"
 *   title="Budget Analysis"        sourceName="Finance Daily"
 */
import { test, expect } from '@playwright/test'
import { mockFeed, mockFeedError } from '../helpers/mockRss'
import type { MockArticle } from '../helpers/mockRss'

const SEARCH_ARTICLES: MockArticle[] = [
  { title: 'React Hooks Deep Dive', source: 'Tech Insider', link: 'https://example.com/search-1' },
  { title: 'Cricket World Cup', source: 'Sports Weekly', link: 'https://example.com/search-2' },
  { title: 'Budget Analysis', source: 'Finance Daily', link: 'https://example.com/search-3' },
]

// ---------------------------------------------------------------------------
// US1 — Real-Time Keyword Filter
// ---------------------------------------------------------------------------

test.describe('US1 — Real-Time Keyword Filter', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, SEARCH_ARTICLES)
    await page.goto('/')
    // Wait for articles to load and search bar to appear
    await expect(page.getByPlaceholder('Search articles…')).toBeVisible({ timeout: 10_000 })
  })

  test('search bar is visible when articles are loaded', async ({ page }) => {
    await expect(page.getByPlaceholder('Search articles…')).toBeVisible()
  })

  test('typing filters articles by headline', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('Cricket')

    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()
    await expect(page.getByText('Budget Analysis', { exact: false })).not.toBeVisible()
  })

  test('filtering is case-insensitive', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('CRICKET')
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()
  })

  test('typing filters articles by source name', async ({ page }) => {
    // "Sports" appears only in the sourceName "Sports Weekly", not in "Cricket World Cup"
    await page.getByPlaceholder('Search articles…').fill('Sports')
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()
    await expect(page.getByText('Budget Analysis', { exact: false })).not.toBeVisible()
  })

  test('deleting characters progressively restores more results', async ({ page }) => {
    const input = page.getByPlaceholder('Search articles…')
    await input.fill('Cricket')
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()

    // Delete one character at a time until empty
    await input.press('Backspace')
    await input.press('Backspace')
    await input.press('Backspace')
    await input.press('Backspace')
    await input.press('Backspace')
    await input.press('Backspace')
    await input.press('Backspace')
    // Input is now empty — all articles should be visible
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
    await expect(page.getByText('Budget Analysis', { exact: false })).toBeVisible()
  })

  test('whitespace-only query shows all articles', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('   ')
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
    await expect(page.getByText('Budget Analysis', { exact: false })).toBeVisible()
  })

  test('search bar is not shown on error screen', async ({ page }) => {
    // Set up a fresh page with error mock
    const errorPage = page
    await errorPage.unroute('**/api/get**')
    await mockFeedError(errorPage)
    await errorPage.goto('/')
    await expect(errorPage.getByText(/unable to load/i)).toBeVisible({ timeout: 10_000 })
    await expect(errorPage.getByPlaceholder('Search articles…')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// US2 — Clear Search
// ---------------------------------------------------------------------------

test.describe('US2 — Clear Search', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, SEARCH_ARTICLES)
    await page.goto('/')
    await expect(page.getByPlaceholder('Search articles…')).toBeVisible({ timeout: 10_000 })
  })

  test('clear button (×) appears when input contains text', async ({ page }) => {
    await expect(page.getByLabel('Clear search')).not.toBeVisible()
    await page.getByPlaceholder('Search articles…').fill('cricket')
    await expect(page.getByLabel('Clear search')).toBeVisible()
  })

  test('clear button is absent when input is empty', async ({ page }) => {
    await expect(page.getByLabel('Clear search')).not.toBeVisible()
  })

  test('tapping clear button restores full article list', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('cricket')
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()

    await page.getByLabel('Clear search').click()

    await expect(page.getByPlaceholder('Search articles…')).toHaveValue('')
    await expect(page.getByLabel('Clear search')).not.toBeVisible()
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
    await expect(page.getByText('Budget Analysis', { exact: false })).toBeVisible()
  })

  test('manually deleting all characters restores full list', async ({ page }) => {
    const input = page.getByPlaceholder('Search articles…')
    await input.fill('cricket')
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()

    // Clear by selecting all and deleting
    await input.selectText()
    await input.press('Backspace')

    await expect(input).toHaveValue('')
    await expect(page.getByLabel('Clear search')).not.toBeVisible()
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// US3 — No Results State
// ---------------------------------------------------------------------------

test.describe('US3 — No Results State', () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, SEARCH_ARTICLES)
    await page.goto('/')
    await expect(page.getByPlaceholder('Search articles…')).toBeVisible({ timeout: 10_000 })
  })

  test('shows no-results message for an unmatched query', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('zzzzzzzzz')

    await expect(page.getByText(/No articles match/i)).toBeVisible()
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).not.toBeVisible()
    await expect(page.getByText('Budget Analysis', { exact: false })).not.toBeVisible()
  })

  test('no blank screen — no-results message replaces article list', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('zzzzzzzzz')
    // Should not be a blank screen — the message must be present
    await expect(page.getByText(/No articles match/i)).toBeVisible()
    // No article links visible
    const links = page.getByRole('link')
    await expect(links).toHaveCount(0)
  })

  test('message disappears when query edited to match an article', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('zzzzzzzzz')
    await expect(page.getByText(/No articles match/i)).toBeVisible()

    // Edit query to something that matches
    await page.getByPlaceholder('Search articles…').fill('cricket')
    await expect(page.getByText(/No articles match/i)).not.toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
  })

  test('clearing from no-results state restores all articles', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('zzzzzzzzz')
    await expect(page.getByText(/No articles match/i)).toBeVisible()

    await page.getByLabel('Clear search').click()

    await expect(page.getByText(/No articles match/i)).not.toBeVisible()
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
    await expect(page.getByText('Budget Analysis', { exact: false })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// US4 — Search Resets on Tab Switch
// ---------------------------------------------------------------------------

test.describe('US4 — Search Resets on Tab Switch', () => {
  test.beforeEach(async ({ page }) => {
    // Enable 'tech' tab so tab-switch tests can click it
    await page.addInitScript(() => {
      localStorage.setItem(
        'newsflow_enabled_categories',
        JSON.stringify(['top', 'tech'])
      )
    })
    await mockFeed(page, SEARCH_ARTICLES)
    await page.goto('/')
    await expect(page.getByPlaceholder('Search articles…')).toBeVisible({ timeout: 10_000 })
  })

  test('switching tabs clears the search query', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('cricket')
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).not.toBeVisible()

    await page.getByRole('button', { name: 'Technology' }).click()

    // Wait for new feed to load and search bar to reappear
    const searchBar = page.getByPlaceholder('Search articles…')
    await expect(searchBar).toBeVisible({ timeout: 10_000 })
    await expect(searchBar).toHaveValue('')
  })

  test('new tab feed is shown unfiltered after tab switch', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('cricket')

    await page.getByRole('button', { name: 'Technology' }).click()

    // After switching, all mock articles should be visible (feed is unfiltered)
    await expect(page.getByPlaceholder('Search articles…')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('React Hooks Deep Dive', { exact: false })).toBeVisible()
    await expect(page.getByText('Cricket World Cup', { exact: false })).toBeVisible()
  })

  test('switching back to original tab shows empty search', async ({ page }) => {
    await page.getByPlaceholder('Search articles…').fill('budget')

    await page.getByRole('button', { name: 'Technology' }).click()
    await expect(page.getByPlaceholder('Search articles…')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Top Stories' }).click()
    const searchBar = page.getByPlaceholder('Search articles…')
    await expect(searchBar).toBeVisible({ timeout: 10_000 })
    await expect(searchBar).toHaveValue('')
  })
})
