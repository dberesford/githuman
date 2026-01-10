import { test, expect, type Page } from '@playwright/test'
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { TEST_REPO_PATH, uid } from './test-helpers.ts'

// Test file path for staging
const TEST_FILE = join(TEST_REPO_PATH, 'test-file-for-comments.ts')

// Helper to create a review from staged changes via UI
async function createReviewFromStagedChanges (page: Page): Promise<string> {
  await page.goto('/new')
  await expect(page.locator('h1')).toContainText('Create New Review')

  // Click on "Staged Changes" option
  await page.locator('button').filter({ hasText: 'Staged Changes' }).click()

  // Click "Create Review"
  const createButton = page.getByRole('button', { name: 'Create Review', exact: true })
  await expect(createButton).toBeEnabled()
  await createButton.click()

  // Wait for navigation to review page
  await expect(page).toHaveURL(/\/reviews\//, { timeout: 10000 })

  return page.url()
}

// Setup: Stage a test file so we can create reviews with diff lines
test.beforeAll(async () => {
  writeFileSync(TEST_FILE, `// Test file for comments ${uid()}\nconst x = 1;\nconst y = 2;\nconst z = 3;\n`)
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

test.describe('Line Comments', () => {
  test('should show comment form when clicking a diff line', async ({ page }) => {
    // Create a review from staged changes via UI
    await createReviewFromStagedChanges(page)

    // Wait for the diff to load
    await expect(page.getByRole('button', { name: /^\d+ \+ / }).first()).toBeVisible({ timeout: 10000 })

    // Click on a diff line (added line)
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).filter({ hasText: 'const x' }).first()
    await diffLine.click()

    // Verify comment form appears
    await expect(page.getByPlaceholder('Write a comment...')).toBeVisible()
  })

  test('should add a comment to a diff line', async ({ page }) => {
    const commentText = `Test comment ${uid()}`

    // Create a review from staged changes via UI
    await createReviewFromStagedChanges(page)

    // Wait for the diff to load
    await expect(page.getByRole('button', { name: /^\d+ \+ / }).first()).toBeVisible({ timeout: 10000 })

    // Click on a diff line
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).filter({ hasText: 'const x' }).first()
    await diffLine.click()

    // Enter comment text
    await page.getByPlaceholder('Write a comment...').fill(commentText)

    // Click Add Comment button
    await page.getByRole('button', { name: 'Add Comment' }).click()

    // Verify comment appears in UI
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10000 })
  })

  test('should add comment with code suggestion', async ({ page }) => {
    const commentText = `Suggestion comment ${uid()}`
    const suggestionCode = 'const x = 42;'

    // Create a review from staged changes via UI
    await createReviewFromStagedChanges(page)

    // Wait for the diff to load
    await expect(page.getByRole('button', { name: /^\d+ \+ / }).first()).toBeVisible({ timeout: 10000 })

    // Click on a diff line
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).filter({ hasText: 'const x' }).first()
    await diffLine.click()

    // Enter comment text
    await page.getByPlaceholder('Write a comment...').fill(commentText)

    // Click to add code suggestion
    await page.getByText('+ Add code suggestion').click()

    // Enter suggestion code
    await page.getByPlaceholder('Paste or type the suggested code...').fill(suggestionCode)

    // Click Add Comment button
    await page.getByRole('button', { name: 'Add Comment' }).click()

    // Verify comment and suggestion appear in UI
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(suggestionCode)).toBeVisible()
  })

  test('should edit a comment', async ({ page }) => {
    const originalText = `Original comment ${uid()}`
    const updatedText = `Updated comment ${uid()}`

    // Create a review from staged changes via UI
    await createReviewFromStagedChanges(page)

    // Wait for the diff to load
    await expect(page.getByRole('button', { name: /^\d+ \+ / }).first()).toBeVisible({ timeout: 10000 })

    // Add a comment first
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).filter({ hasText: 'const x' }).first()
    await diffLine.click()
    await page.getByPlaceholder('Write a comment...').fill(originalText)
    await page.getByRole('button', { name: 'Add Comment' }).click()

    // Wait for comment to appear
    await expect(page.getByText(originalText)).toBeVisible({ timeout: 10000 })

    // Find the comment header (timestamp) and click to expand actions
    const commentHeader = page.locator('.cursor-pointer').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first()
    await commentHeader.click()

    // Wait for actions to appear, then click Edit
    const editButton = page.getByRole('button', { name: 'Edit' })
    await expect(editButton).toBeVisible({ timeout: 5000 })
    await editButton.click()

    // Clear and enter new text in the textarea
    const editTextarea = page.locator('textarea').first()
    await editTextarea.clear()
    await editTextarea.fill(updatedText)

    // Click Save
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify updated comment appears
    await expect(page.getByText(updatedText)).toBeVisible({ timeout: 10000 })
  })

  test('should delete a comment', async ({ page }) => {
    const commentText = `Delete me comment ${uid()}`

    // Create a review from staged changes via UI
    await createReviewFromStagedChanges(page)

    // Wait for the diff to load
    await expect(page.getByRole('button', { name: /^\d+ \+ / }).first()).toBeVisible({ timeout: 10000 })

    // Add a comment first
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).filter({ hasText: 'const x' }).first()
    await diffLine.click()
    await page.getByPlaceholder('Write a comment...').fill(commentText)
    await page.getByRole('button', { name: 'Add Comment' }).click()

    // Verify comment exists
    const commentElement = page.getByText(commentText)
    await expect(commentElement).toBeVisible({ timeout: 10000 })

    // Find the comment header (timestamp) which is a sibling or near the comment text
    // The structure is: div.cursor-pointer contains timestamp, then sibling paragraph has the comment
    const commentHeader = page.locator('.cursor-pointer').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first()
    await commentHeader.click()

    // Wait for actions to appear, then click Delete
    const deleteButton = page.getByRole('button', { name: 'Delete' }).nth(1) // Skip the review Delete button
    await expect(deleteButton).toBeVisible({ timeout: 5000 })
    await deleteButton.click()

    // Verify comment is removed
    await expect(commentElement).not.toBeVisible({ timeout: 10000 })
  })

  test('should resolve and unresolve a comment', async ({ page }) => {
    const commentText = `Resolve me comment ${uid()}`

    // Create a review from staged changes via UI
    await createReviewFromStagedChanges(page)

    // Wait for the diff to load
    await expect(page.getByRole('button', { name: /^\d+ \+ / }).first()).toBeVisible({ timeout: 10000 })

    // Add a comment first
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).filter({ hasText: 'const x' }).first()
    await diffLine.click()
    await page.getByPlaceholder('Write a comment...').fill(commentText)
    await page.getByRole('button', { name: 'Add Comment' }).click()

    // Wait for comment to appear
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10000 })

    // Find the comment header (timestamp) and click to expand actions
    const commentHeader = page.locator('.cursor-pointer').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first()
    await commentHeader.click()

    // Wait for actions to appear, then click Resolve
    await expect(page.getByRole('button', { name: 'Resolve' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Resolve' }).click()

    // Verify Resolved badge appears
    await expect(page.getByText('Resolved')).toBeVisible({ timeout: 10000 })

    // The button toggles to Unresolve - click it directly (actions bar stays open)
    await expect(page.getByRole('button', { name: 'Unresolve' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Unresolve' }).click()

    // Verify Resolved badge is removed
    await expect(page.getByText('Resolved')).not.toBeVisible({ timeout: 10000 })
  })

  test('should cancel adding a comment', async ({ page }) => {
    // Create a review from staged changes via UI
    await createReviewFromStagedChanges(page)

    // Wait for the diff to load
    await expect(page.getByRole('button', { name: /^\d+ \+ / }).first()).toBeVisible({ timeout: 10000 })

    // Click on a diff line
    const diffLine = page.getByRole('button', { name: /^\d+ \+ / }).filter({ hasText: 'const x' }).first()
    await diffLine.click()

    // Verify comment form appears
    await expect(page.getByPlaceholder('Write a comment...')).toBeVisible()

    // Click Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify form is hidden
    await expect(page.getByPlaceholder('Write a comment...')).not.toBeVisible()
  })
})
