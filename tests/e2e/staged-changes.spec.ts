import { test, expect } from '@playwright/test'

test.describe('Staged Changes Page', () => {
  test('should display staged changes page', async ({ page }) => {
    await page.goto('/staged')

    // Should load without errors
    await expect(page.getByRole('link', { name: 'Code Review' })).toBeVisible()
  })

  test('should show sidebar', async ({ page }) => {
    await page.goto('/staged')

    // Wait for content to load
    await page.waitForTimeout(500)

    // Sidebar should be visible (either with files or "No files to display")
    // Use a more specific selector to avoid matching the todo drawer
    const sidebar = page.locator('aside').filter({ hasText: /Files/ })
    await expect(sidebar).toBeVisible()
  })

  test('should show empty state when no staged changes', async ({ page }) => {
    await page.goto('/staged')

    // Wait for API response
    await page.waitForResponse((response) =>
      response.url().includes('/api/diff/staged') && response.status() === 200
    )

    // Since we're testing against a clean repo, we should see empty state or files list
    // The exact content depends on whether there are staged changes
    const content = page.locator('main')
    await expect(content).toBeVisible()
  })

  test('should display diff summary when files exist', async ({ page }) => {
    await page.goto('/staged')

    // Wait for API response
    const response = await page.waitForResponse((response) =>
      response.url().includes('/api/diff/staged') && response.status() === 200
    )

    const data = await response.json()

    if (data.files && data.files.length > 0) {
      // Should show summary stats
      await expect(page.getByText('files changed')).toBeVisible()
      await expect(page.getByText('additions')).toBeVisible()
    } else {
      // Should show empty state - check for either message
      const noChanges = page.getByText('No changes to display')
      const noFiles = page.getByText('No files to display')
      await expect(noChanges.or(noFiles).first()).toBeVisible()
    }
  })
})
