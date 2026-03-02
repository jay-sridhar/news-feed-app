import { test, expect } from '@playwright/test'
import { mockFeed, makeArticles } from '../helpers/mockRss'
import type { UserProfile } from '../../src/types'

// ---------------------------------------------------------------------------
// Scenario 1 — Signed-out UI: Account section shows sign-in button
// ---------------------------------------------------------------------------
test('signed-out: Settings shows Sign in with Google button', async ({ page }) => {
  await mockFeed(page, makeArticles(3))
  await page.goto('/')
  await page.waitForSelector('h1')
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByText('Account')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario 2 — Signed-in UI via injected mock user
// ---------------------------------------------------------------------------
test('signed-in (mock): Settings shows user name and Sign out button', async ({ page }) => {
  const mockUser: UserProfile = {
    uid: 'test-uid-123',
    displayName: 'Jay Sridhar',
    email: 'jay@example.com',
    photoURL: null,
  }
  await page.addInitScript((user) => {
    ;(window as { __MOCK_AUTH_USER__?: UserProfile }).__MOCK_AUTH_USER__ = user
  }, mockUser)

  await mockFeed(page, makeArticles(3))
  await page.goto('/')
  await page.waitForSelector('h1')
  await page.getByRole('button', { name: 'Open settings' }).click()

  await expect(page.getByText('Jay Sridhar')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in with google/i })).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario 3 — Sign-out reverts to local bookmarks
// ---------------------------------------------------------------------------
test('sign-out: local bookmarks remain visible after signing out', async ({ page }) => {
  const mockUser: UserProfile = {
    uid: 'test-uid-123',
    displayName: 'Jay',
    email: 'j@x.com',
    photoURL: null,
  }
  await page.addInitScript((user) => {
    ;(window as { __MOCK_AUTH_USER__?: UserProfile }).__MOCK_AUTH_USER__ = user
    localStorage.setItem(
      'newsflow_bookmarks',
      JSON.stringify([
        {
          id: 'local-1',
          title: 'Local Bookmark',
          link: 'https://example.com/local-1',
          pubDate: new Date().toUTCString(),
          sourceName: 'Test',
          categoryId: 'top',
          savedAt: Date.now(),
        },
      ])
    )
  }, mockUser)

  await mockFeed(page, makeArticles(3))
  await page.goto('/')
  await page.waitForSelector('h1')

  // Open settings and sign out
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('button', { name: /sign out/i }).click()

  // Close settings and go to bookmarks
  await page.getByRole('button', { name: 'Close settings' }).click()
  await page.getByRole('button', { name: 'Bookmarks' }).click()
  await expect(page.getByText('Local Bookmark')).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario 4 — Auth loading: app renders without blank screen
// ---------------------------------------------------------------------------
test('auth loading: app renders normally without Firebase env vars', async ({ page }) => {
  await mockFeed(page, makeArticles(3))
  await page.goto('/')
  await page.waitForSelector('h1')
  // App should render normally — no blank/loading screen
  await expect(page.getByRole('heading', { name: 'NewsFlow' })).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario 5 — Offline bookmark: works without auth (localStorage path)
// ---------------------------------------------------------------------------
test('offline bookmark: saving bookmark works without sign-in', async ({ page }) => {
  await mockFeed(page, makeArticles(5))
  await page.goto('/')
  await page.waitForSelector('h2')

  // Bookmark the first article
  await page.locator('[aria-label^="Bookmark"]').first().click()

  // Navigate to bookmarks — article should be there (Remove bookmark label = bookmarked)
  await page.getByRole('button', { name: 'Bookmarks' }).click()
  await expect(page.getByLabel('Remove bookmark').first()).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario 6 — Firebase not configured: Settings still shows sign-in button
// ---------------------------------------------------------------------------
test('Firebase not configured: sign-in button visible, no crash', async ({ page }) => {
  await mockFeed(page, makeArticles(3))
  await page.goto('/')
  await page.waitForSelector('h1')
  await page.getByRole('button', { name: 'Open settings' }).click()
  // Sign-in button should still be visible (signed out, Firebase unavailable)
  await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
})
