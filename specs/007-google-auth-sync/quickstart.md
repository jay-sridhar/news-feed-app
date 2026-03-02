# Quickstart: Google Sign-In with Cloud Sync (007)

Integration scenarios. Note: full OAuth flow requires real Firebase credentials or emulator.
Tests marked [TESTABLE] can run in Playwright with mocked/injected state.

## Scenario 1 — Signed-out UI [TESTABLE]

```ts
// No auth setup needed — default state is signed out
await mockFeed(page, makeArticles(5))
await page.goto('/')
await page.waitForSelector('h1')
await page.getByRole('button', { name: 'Open settings' }).click()
await expect(page.getByText('Account')).toBeVisible()
await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
```

## Scenario 2 — Signed-in UI [TESTABLE via injected state]

```ts
// Inject a mock user before app loads
await page.addInitScript(() => {
  window.__MOCK_AUTH_USER__ = {
    uid: 'test-uid-123',
    displayName: 'Jay Sridhar',
    email: 'jay@example.com',
    photoURL: null,
  }
})
await mockFeed(page, makeArticles(5))
await page.goto('/')
await page.waitForSelector('h1')
await page.getByRole('button', { name: 'Open settings' }).click()
await expect(page.getByText('Jay Sridhar')).toBeVisible()
await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
await expect(page.getByRole('button', { name: /sign in with google/i })).not.toBeVisible()
```

## Scenario 3 — Sign-out reverts to local bookmarks [TESTABLE via injected state]

```ts
// Seed localStorage bookmarks + mock signed-in user
await page.addInitScript(() => {
  window.__MOCK_AUTH_USER__ = {
    uid: 'test-uid-123', displayName: 'Jay', email: 'j@x.com', photoURL: null
  }
  localStorage.setItem('newsflow_bookmarks', JSON.stringify([
    { id: 'local-1', title: 'Local Bookmark', link: 'https://example.com/local-1',
      pubDate: '', sourceName: 'Test', categoryId: 'top', savedAt: Date.now() }
  ]))
})
// ... sign out via settings
await page.getByRole('button', { name: /sign out/i }).click()
// Local bookmark visible after sign-out
await page.getByRole('button', { name: 'Bookmarks' }).click()
await expect(page.getByText('Local Bookmark')).toBeVisible()
```

## Scenario 4 — Auth loading state [TESTABLE]

```ts
// Firebase not configured (no env vars) → authLoading resolves quickly, stays signed out
await mockFeed(page, makeArticles(5))
await page.goto('/')
await page.waitForSelector('h1')
// App renders normally — no blank screen during auth loading
await expect(page.getByRole('heading', { name: 'NewsFlow' })).toBeVisible()
```

## Scenario 5 — Offline: bookmarks still work [TESTABLE]

```ts
// Works identically to pre-007 — localStorage is always the immediate store
await mockFeed(page, makeArticles(5))
await page.goto('/')
await page.waitForSelector('h2')
// Bookmark an article
await page.locator('[aria-label^="Bookmark"]').first().click()
// Navigate to bookmarks — it's there (from localStorage)
await page.getByRole('button', { name: 'Bookmarks' }).click()
await expect(page.locator('[data-testid="bookmark-card"]').first()).toBeVisible()
```

## Scenario 6 — Firebase not configured: app works normally [TESTABLE]

```ts
// No VITE_FIREBASE_* env vars in test environment → firebase.ts returns null exports
// App should still function: local bookmarks, local preferences, no crash
await mockFeed(page, makeArticles(5))
await page.goto('/')
await page.waitForSelector('h1')
await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible()
// Settings shows sign-in button (signed out, Firebase unavailable)
await page.getByRole('button', { name: 'Open settings' }).click()
await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
```
