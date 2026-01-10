import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { TEST_REPO_PATH, uid } from './test-helpers.ts'

test.describe('Staged Changes Page', () => {
  test('should display staged changes page', async ({ page }) => {
    await page.goto('/')

    // Should load without errors - check for GitHuman branding
    await expect(page.getByRole('link', { name: /GitHuman/i })).toBeVisible()
  })

  test('should show staged/unstaged tabs', async ({ page }) => {
    await page.goto('/')

    // Wait for content to load
    await page.waitForTimeout(500)

    // Should show Staged and Unstaged tabs
    await expect(page.getByRole('button', { name: 'Staged', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unstaged', exact: true })).toBeVisible()
  })

  test('should show empty state when no staged changes', async ({ page }) => {
    await page.goto('/')

    // Wait for API response
    await page.waitForResponse((response) =>
      response.url().includes('/api/diff') && response.status() === 200
    )

    // Since we're testing against a clean repo, we should see empty state or files list
    // The exact content depends on whether there are staged changes
    const content = page.locator('main')
    await expect(content).toBeVisible()
  })

  test('should display diff summary when files exist', async ({ page }) => {
    await page.goto('/')

    // Wait for API response
    const response = await page.waitForResponse((response) =>
      response.url().includes('/api/diff') && response.status() === 200
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

// Test file path for expand/collapse test
const TEST_FILE = join(TEST_REPO_PATH, 'test-file-for-expand-collapse.ts')

test.describe('File Expand/Collapse', () => {
  // Setup: Stage a test file
  test.beforeAll(async () => {
    writeFileSync(TEST_FILE, `// Test file for expand/collapse ${uid()}\nconst expanded = true;\nconst line2 = 'test';\n`)
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

  test('should toggle file expansion when clicking file header', async ({ page }) => {
    await page.goto('/')

    // Wait for the diff to load
    await page.waitForResponse((response) =>
      response.url().includes('/api/diff') && response.status() === 200
    )

    // Find the file header for our test file (the one in main content with stats)
    const fileHeader = page.getByRole('button', { name: /test-file-for-expand-collapse\.ts.*Added/ })
    await expect(fileHeader).toBeVisible({ timeout: 10000 })

    // Verify file is expanded by default (diff lines visible)
    // Diff lines are buttons containing line numbers and code
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).first()
    await expect(diffLine).toBeVisible()

    // Click file header to collapse
    await fileHeader.click()

    // Verify diff lines are hidden
    await expect(diffLine).not.toBeVisible()

    // Click again to expand
    await fileHeader.click()

    // Verify diff lines are visible again
    await expect(diffLine).toBeVisible()
  })
})
