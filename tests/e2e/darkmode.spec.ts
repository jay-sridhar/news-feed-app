import { test, expect } from '@playwright/test'
import { mockFeed, makeArticles } from '../helpers/mockRss'

// ---------------------------------------------------------------------------
// Shared setup — mock RSS feeds so tests don't hit the network
// ---------------------------------------------------------------------------
async function setupMocks(page: Parameters<typeof mockFeed>[0]) {
  await mockFeed(page, makeArticles(5, 'Article'))
}

/** Open the Settings screen via the gear icon. */
async function openSettings(page: Parameters<typeof mockFeed>[0]) {
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
}

// ---------------------------------------------------------------------------
// US1 — OS Auto-Detect
// ---------------------------------------------------------------------------
test.describe('US1 — OS auto-detect', () => {
  test('html has dark class when OS is dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(true)
  })

  test('html does NOT have dark class when OS is light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(false)
  })

  test('real-time OS change updates dark class without reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    // Confirm starts light
    let hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(false)

    // Switch OS to dark
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(100)

    hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// US2 — Manual Toggle (toggle now lives in Settings > Appearance)
// ---------------------------------------------------------------------------
test.describe('US2 — manual theme toggle', () => {
  test('toggle button is visible in the header', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')
    // Toggle is now inside Settings — open Settings to find it
    await openSettings(page)
    const btn = page.getByRole('button', { name: /switch to (dark|light) mode/i })
    await expect(btn).toBeVisible()
  })

  test('aria-label is "Switch to dark mode" when theme is light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')
    await openSettings(page)
    const btn = page.getByRole('button', { name: 'Switch to dark mode' })
    await expect(btn).toBeVisible()
  })

  test('tapping toggle adds dark class to html', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()

    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(true)
  })

  test('aria-label changes to "Switch to light mode" after toggling to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()

    const btn = page.getByRole('button', { name: 'Switch to light mode' })
    await expect(btn).toBeVisible()
  })

  test('tapping toggle again removes dark class', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await page.getByRole('button', { name: 'Switch to light mode' }).click()

    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(false)
  })

  test('manual dark overrides OS light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()

    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(true)
  })

  test('localStorage has "dark" after toggling to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()

    const stored = await page.evaluate(() => localStorage.getItem('newsflow_theme'))
    expect(stored).toBe('dark')
  })
})

// ---------------------------------------------------------------------------
// US3 — Persistence
// ---------------------------------------------------------------------------
test.describe('US3 — persistent preference', () => {
  test('html has dark class immediately on load when stored preference is dark', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('newsflow_theme', 'dark'))
    await setupMocks(page)
    await page.goto('/')
    // Check BEFORE React necessarily mounts (inline script should have run)
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(true)
  })

  test('localStorage has "dark" after toggling to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()

    const stored = await page.evaluate(() => localStorage.getItem('newsflow_theme'))
    expect(stored).toBe('dark')
  })

  test('localStorage has "light" after second toggle', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await page.getByRole('button', { name: 'Switch to light mode' }).click()

    const stored = await page.evaluate(() => localStorage.getItem('newsflow_theme'))
    expect(stored).toBe('light')
  })

  test('deleting stored key and reloading follows OS preference', async ({ page }) => {
    // Load with dark OS, no stored pref → dark
    await page.emulateMedia({ colorScheme: 'dark' })
    await setupMocks(page)
    await page.goto('/')
    await page.waitForSelector('h1')

    // Toggle to light via Settings
    await openSettings(page)
    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await page.getByRole('button', { name: 'Close settings' }).click()

    let hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(false)

    // Delete the stored key and reload
    await page.evaluate(() => localStorage.removeItem('newsflow_theme'))
    await setupMocks(page)
    await page.reload()
    await page.waitForSelector('h1')

    // OS (dark) should win now that no manual preference is stored
    hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(hasDark).toBe(true)
  })
})
