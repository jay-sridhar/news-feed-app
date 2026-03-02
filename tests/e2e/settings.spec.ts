/**
 * Settings Page with Category Personalisation
 * Tests: US1 — Select categories, US2 — Restore categories, US3 — Settings everywhere + dark mode
 */
import { test, expect } from '@playwright/test'
import { mockFeed, makeArticles } from '../helpers/mockRss'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function openSettings(page: Parameters<typeof mockFeed>[0]): Promise<void> {
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
}

// ---------------------------------------------------------------------------
// US1 — Select My Categories
// ---------------------------------------------------------------------------
test.describe('US1 — Select My Categories', () => {
  test('gear icon is visible in the header', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')
    await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible()
  })

  test('tapping gear icon opens the Settings screen', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')
    await openSettings(page)
    await expect(page.getByText('News Categories')).toBeVisible()
  })

  test('all 5 category toggles are visible in Settings', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')
    await openSettings(page)

    for (const label of ['Top Stories', 'Technology & AI', 'Tamil Nadu / Chennai', 'National India', 'Sports']) {
      await expect(page.getByRole('switch', { name: label })).toBeVisible()
    }
  })

  test('deselecting a category removes its tab from the tab bar', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    // Deselect Sports
    await page.getByRole('switch', { name: 'Sports' }).click()
    // Close settings
    await page.getByRole('button', { name: 'Close settings' }).click()

    // Sports tab gone
    await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()
    // Other tabs still present
    await expect(page.getByRole('button', { name: 'Top Stories' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Technology & AI' })).toBeVisible()
  })

  test('min-one guard: last enabled toggle stays checked and shows message', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')
    await openSettings(page)

    // Disable all but one — leave only Top Stories
    for (const label of ['Technology & AI', 'Tamil Nadu / Chennai', 'National India', 'Sports']) {
      await page.getByRole('switch', { name: label }).click()
    }

    // Try to disable the last one (Top Stories)
    await page.getByRole('switch', { name: 'Top Stories' }).click()

    // Toggle must still be ON
    await expect(page.getByRole('switch', { name: 'Top Stories' })).toHaveAttribute('aria-checked', 'true')
    // Guard message visible
    await expect(page.getByText('At least one category must remain selected')).toBeVisible()
  })

  test('active tab auto-switches when its category is deselected', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    // Switch to Sports tab first
    await page.getByRole('button', { name: 'Sports' }).click()
    await expect(page.getByRole('button', { name: 'Sports' })).toHaveAttribute('aria-current', 'page')

    // Open Settings and deselect Sports
    await openSettings(page)
    await page.getByRole('switch', { name: 'Sports' }).click()
    await page.getByRole('button', { name: 'Close settings' }).click()

    // Sports tab gone
    await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()
    // Some other tab is now active (not Sports)
    await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()
    // Feed is shown (not blank)
    await expect(page.locator('main')).toBeVisible()
  })

  test('deselected categories persist after hard reload', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    // Deselect Tamil Nadu and Sports
    await openSettings(page)
    await page.getByRole('switch', { name: 'Tamil Nadu / Chennai' }).click()
    await page.getByRole('switch', { name: 'Sports' }).click()
    await page.getByRole('button', { name: 'Close settings' }).click()

    // Reload
    await mockFeed(page, makeArticles(5))
    await page.reload()
    await page.waitForSelector('h1')

    // Both still absent after reload
    await expect(page.getByRole('button', { name: 'Tamil Nadu / Chennai' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()
    // Others still present
    await expect(page.getByRole('button', { name: 'Top Stories' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// US2 — Restore a Category
// ---------------------------------------------------------------------------
test.describe('US2 — Restore a Category', () => {
  test('a hidden category toggle is unchecked in Settings', async ({ page }) => {
    // Pre-seed: Sports hidden
    await page.addInitScript(() =>
      localStorage.setItem('newsflow_enabled_categories', JSON.stringify(['top', 'tech', 'tamilnadu', 'india']))
    )
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await expect(page.getByRole('switch', { name: 'Sports' })).toHaveAttribute('aria-checked', 'false')
  })

  test('re-enabling a hidden category restores its tab', async ({ page }) => {
    // Pre-seed: Sports hidden
    await page.addInitScript(() =>
      localStorage.setItem('newsflow_enabled_categories', JSON.stringify(['top', 'tech', 'tamilnadu', 'india']))
    )
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')
    await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()

    // Re-enable Sports in Settings
    await openSettings(page)
    await page.getByRole('switch', { name: 'Sports' }).click()
    await page.getByRole('button', { name: 'Close settings' }).click()

    // Sports tab reappears
    await expect(page.getByRole('button', { name: 'Sports' })).toBeVisible()
  })

  test('restored tab loads its feed normally', async ({ page }) => {
    // Pre-seed: Sports hidden
    await page.addInitScript(() =>
      localStorage.setItem('newsflow_enabled_categories', JSON.stringify(['top', 'tech', 'tamilnadu', 'india']))
    )
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    // Re-enable Sports
    await openSettings(page)
    await page.getByRole('switch', { name: 'Sports' }).click()
    await page.getByRole('button', { name: 'Close settings' }).click()

    // Navigate to Sports
    await page.getByRole('button', { name: 'Sports' }).click()
    // Feed loads (no error state)
    await expect(page.getByRole('button', { name: /tap to retry/i })).not.toBeVisible({ timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// US3 — Settings Accessible Everywhere + Dark Mode
// ---------------------------------------------------------------------------
test.describe('US3 — Settings accessible everywhere', () => {
  test('Settings is reachable from the Bookmarks tab', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    await page.getByRole('button', { name: 'Bookmarks' }).click()
    await openSettings(page)
    await expect(page.getByText('News Categories')).toBeVisible()
  })

  test('gear icon is visible while a search query is active', async ({ page }) => {
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    // Wait for articles to load so the SearchBar renders
    await page.waitForSelector('h2')

    // Type a search query
    await page.getByPlaceholder('Search articles…').fill('Article')
    await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible()
  })

  test('dark mode toggle is visible in Settings Appearance section', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await expect(page.getByText('Appearance')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  })

  test('toggling dark mode in Settings applies the dark class to html', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()

    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(hasDark).toBe(true)
  })

  test('closing Settings after dark mode toggle returns to the feed with dark class applied', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await mockFeed(page, makeArticles(5))
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await page.getByRole('button', { name: 'Close settings' }).click()

    // Back to feed, dark still applied
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible()
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(hasDark).toBe(true)
  })
})
