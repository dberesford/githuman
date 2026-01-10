import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { TEST_REPO_PATH, uid } from './test-helpers.ts'

// Test file path for staging
const TEST_FILE = join(TEST_REPO_PATH, 'test-file-for-staged-review.ts')

test.describe('New Review - Staged Changes', () => {
  test.describe('with staged changes', () => {
    // Setup: Stage a test file
    test.beforeAll(async () => {
      writeFileSync(TEST_FILE, `// Test file ${uid()}\nconst staged = true;\n`)
      execSync(`git add "${TEST_FILE}"`, { cwd: TEST_REPO_PATH })
    })

    // Cleanup: Remove test file and unstage
    test.afterAll(async () => {
      try {
        execSync(`git reset HEAD "${TEST_FILE}"`, { cwd: TEST_REPO_PATH, stdio: 'ignore' })
      } catch { /* ignore */ }
      try {
        if (existsSync(TEST_FILE)) {
          unlinkSync(TEST_FILE)
        }
      } catch { /* ignore */ }
    })

    test('should display staged changes option as available', async ({ page }) => {
      await page.goto('/new')

      // Wait for page to load
      await expect(page.locator('h1')).toContainText('Create New Review')

      // Verify "Staged Changes" option shows "Available" badge
      const stagedOption = page.locator('button').filter({ hasText: 'Staged Changes' })
      await expect(stagedOption).toBeVisible()
      await expect(stagedOption.getByText('Available')).toBeVisible()
    })

    test('should create review from staged changes', async ({ page }) => {
      await page.goto('/new')

      // Wait for page to load
      await expect(page.locator('h1')).toContainText('Create New Review')

      // Click on "Staged Changes" option
      await page.locator('button').filter({ hasText: 'Staged Changes' }).click()

      // Verify "Create Review" button is enabled
      const createButton = page.getByRole('button', { name: 'Create Review', exact: true })
      await expect(createButton).toBeEnabled()

      // Click "Create Review"
      await createButton.click()

      // Wait for navigation to review page
      await expect(page).toHaveURL(/\/reviews\//, { timeout: 10000 })

      // Verify review shows "Staged changes" label
      await expect(page.getByText('Staged changes', { exact: true })).toBeVisible()
    })
  })

  test.describe('without staged changes', () => {
    test('should show disabled state when no staged changes', async ({ page }) => {
      // Ensure no staged changes by resetting
      try {
        execSync('git reset HEAD', { cwd: TEST_REPO_PATH, stdio: 'ignore' })
      } catch { /* ignore */ }

      await page.goto('/new')

      // Wait for page to load
      await expect(page.locator('h1')).toContainText('Create New Review')

      // Click on "Staged Changes" option
      await page.locator('button').filter({ hasText: 'Staged Changes' }).click()

      // Verify message shows "No staged changes available"
      await expect(page.getByText('No staged changes available')).toBeVisible()

      // Verify "Create Review" button is disabled
      const createButton = page.getByRole('button', { name: 'Create Review', exact: true })
      await expect(createButton).toBeDisabled()
    })
  })
})
