import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should display the homepage with header', async ({ page }) => {
    await page.goto('/')

    // Should show the header
    await expect(page.getByRole('link', { name: 'Code Review' })).toBeVisible()

    // Should show navigation links
    await expect(page.getByRole('link', { name: 'Staged Changes', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Reviews', exact: true })).toBeVisible()
  })

  test('should display repository info in header', async ({ page }) => {
    await page.goto('/')

    // Should show repo name
    await expect(page.getByText('local-code-reviewier')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to staged changes page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Staged Changes' }).click()

    await expect(page).toHaveURL('/staged')
  })

  test('should navigate back to reviews from staged changes', async ({ page }) => {
    await page.goto('/staged')

    await page.getByRole('link', { name: 'Reviews' }).click()

    await expect(page).toHaveURL('/')
  })

  test('should navigate home when clicking logo', async ({ page }) => {
    await page.goto('/staged')

    await page.getByRole('link', { name: 'Code Review' }).click()

    await expect(page).toHaveURL('/')
  })
})
