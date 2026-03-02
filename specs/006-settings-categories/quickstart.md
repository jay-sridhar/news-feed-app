# Quickstart: Settings Page with Category Personalisation (006)

Integration scenarios for Playwright tests.

## Scenario 1 — Deselect categories, confirm tab bar updates

```ts
// Mock feed, go to app
await mockFeed(page, makeArticles(5))
await page.goto('/')
// Tap gear icon
await page.getByRole('button', { name: 'Open settings' }).click()
// Settings screen opens, 5 category toggles visible
await expect(page.getByText('News Categories')).toBeVisible()
// Deselect "Sports"
await page.getByRole('checkbox', { name: 'Sports' }).click()
// Close settings
await page.getByRole('button', { name: 'Close settings' }).click()
// Sports tab gone from tab bar
await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()
// Other tabs still present
await expect(page.getByRole('button', { name: 'Top Stories' })).toBeVisible()
```

## Scenario 2 — Min-one guard

```ts
// Deselect all but one category in Settings
// ... (deselect Top, Tech, Tamil Nadu, India)
// Only Sports remains
// Try to deselect Sports
await page.getByRole('checkbox', { name: 'Sports' }).click()
// Toggle must still show Sports as enabled
await expect(page.getByRole('checkbox', { name: 'Sports' })).toBeChecked()
// Guard message visible
await expect(page.getByText('At least one category must remain selected')).toBeVisible()
```

## Scenario 3 — Active tab auto-switch when deselected

```ts
// Activate Sports tab
await page.getByRole('button', { name: 'Sports' }).click()
// Open Settings
await page.getByRole('button', { name: 'Open settings' }).click()
// Deselect Sports
await page.getByRole('checkbox', { name: 'Sports' }).click()
// Close Settings
await page.getByRole('button', { name: 'Close settings' }).click()
// Active tab is no longer Sports (auto-switched to first enabled)
await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()
// Some other tab is active (e.g. Top Stories)
await expect(page.getByRole('button', { name: 'Top Stories' }).getAttribute('aria-current')).resolves.toBe('page')
```

## Scenario 4 — Preferences survive reload

```ts
// Deselect Tamil Nadu and Sports, close Settings
// ...
// Hard reload
await page.reload()
// Tamil Nadu and Sports still absent
await expect(page.getByRole('button', { name: 'Tamil Nadu / Chennai' })).not.toBeVisible()
await expect(page.getByRole('button', { name: 'Sports' })).not.toBeVisible()
```

## Scenario 5 — Re-enable a hidden category

```ts
// Tamil Nadu hidden (from previous state or setup)
// Open Settings
await page.getByRole('button', { name: 'Open settings' }).click()
// Tamil Nadu toggle is unchecked
await expect(page.getByRole('checkbox', { name: 'Tamil Nadu / Chennai' })).not.toBeChecked()
// Re-enable
await page.getByRole('checkbox', { name: 'Tamil Nadu / Chennai' }).click()
// Close
await page.getByRole('button', { name: 'Close settings' }).click()
// Tab reappears
await expect(page.getByRole('button', { name: 'Tamil Nadu / Chennai' })).toBeVisible()
```

## Scenario 6 — Dark mode toggle in Settings

```ts
// Confirm light mode
await expect(page.locator('html')).not.toHaveClass(/dark/)
// Open Settings
await page.getByRole('button', { name: 'Open settings' }).click()
// Dark mode toggle present
await expect(page.getByRole('button', { name: /switch to dark/i })).toBeVisible()
// Toggle dark mode
await page.getByRole('button', { name: /switch to dark/i }).click()
// html has dark class
await expect(page.locator('html')).toHaveClass(/dark/)
```

## Scenario 7 — Settings accessible from Bookmarks tab

```ts
await page.goto('/')
await page.getByRole('button', { name: 'Bookmarks' }).click()
await page.getByRole('button', { name: 'Open settings' }).click()
await expect(page.getByText('News Categories')).toBeVisible()
```
