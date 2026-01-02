import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Helper to generate unique test identifiers
const uid = () => Math.random().toString(36).substring(2, 8);

// Test file path for staging
const TEST_FILE = join(process.cwd(), 'test-file-for-e2e.txt');

// Setup: Stage a test file so we can create reviews
test.beforeAll(async () => {
  writeFileSync(TEST_FILE, `Test content ${uid()}\n`);
  execSync(`git add "${TEST_FILE}"`, { cwd: process.cwd() });
});

// Cleanup: Remove test file and unstage
test.afterAll(async () => {
  try {
    execSync(`git reset HEAD "${TEST_FILE}"`, { cwd: process.cwd(), stdio: 'ignore' });
  } catch { /* ignore */ }
  try {
    if (existsSync(TEST_FILE)) {
      unlinkSync(TEST_FILE);
    }
  } catch { /* ignore */ }
});

test.describe('Review CRUD API', () => {
  let createdReviewId: string;

  test('should create a review from staged changes', async ({ request }) => {
    const response = await request.post('/api/reviews', {
      data: {},
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('in_progress');
    expect(data.id).toBeDefined();
    expect(data.files).toBeInstanceOf(Array);
    expect(data.files.length).toBeGreaterThan(0);
    expect(data.summary).toBeDefined();
    expect(data.repository).toBeDefined();

    createdReviewId = data.id;
  });

  test('should get a review by ID', async ({ request }) => {
    // First create a review
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Get it by ID
    const response = await request.get(`/api/reviews/${created.id}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.files).toBeInstanceOf(Array);
    expect(data.summary).toBeDefined();
  });

  test('should update a review status to approved', async ({ request }) => {
    // First create a review
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();
    expect(created.status).toBe('in_progress');

    // Update status to approved
    const response = await request.patch(`/api/reviews/${created.id}`, {
      data: { status: 'approved' },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('approved');
  });

  test('should update a review status to changes_requested', async ({ request }) => {
    // First create a review
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Update status
    const response = await request.patch(`/api/reviews/${created.id}`, {
      data: { status: 'changes_requested' },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('changes_requested');
  });

  test('should delete a review', async ({ request }) => {
    // First create a review
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/reviews/${created.id}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify it's gone
    const getResponse = await request.get(`/api/reviews/${created.id}`);
    expect(getResponse.status()).toBe(404);
  });

  test('should get review statistics', async ({ request }) => {
    const response = await request.get('/api/reviews/stats');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.total).toBeDefined();
    expect(data.inProgress).toBeDefined();
    expect(data.approved).toBeDefined();
    expect(data.changesRequested).toBeDefined();
  });

  test('should export a review as markdown', async ({ request }) => {
    // First create a review
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Export it
    const response = await request.get(`/api/reviews/${created.id}/export`);

    expect(response.ok()).toBeTruthy();

    const markdown = await response.text();
    expect(markdown).toContain('# Code Review:');
    expect(markdown).toContain('In Progress');
  });

  test('should return 404 for non-existent review', async ({ request }) => {
    const response = await request.get('/api/reviews/non-existent-id');

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('Review not found');
  });

  test('should filter reviews by status', async ({ request }) => {
    // Create a review and approve it
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    await request.patch(`/api/reviews/${created.id}`, {
      data: { status: 'approved' },
    });

    // Filter by approved status
    const response = await request.get('/api/reviews?status=approved');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.data).toBeInstanceOf(Array);
    // All returned reviews should be approved
    for (const review of data.data) {
      expect(review.status).toBe('approved');
    }
  });

  test('should paginate reviews', async ({ request }) => {
    // Request with pagination
    const response = await request.get('/api/reviews?page=1&pageSize=5');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(5);
    expect(data.total).toBeDefined();
    expect(data.data.length).toBeLessThanOrEqual(5);
  });
});

test.describe('Review Detail UI', () => {
  test('should display review details', async ({ page, request }) => {
    // Create a review via API
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Navigate to the review
    await page.goto(`/reviews/${created.id}`);

    // Wait for the review to load (should show staged changes label)
    await expect(page.getByText('Staged changes', { exact: true })).toBeVisible({ timeout: 10000 });

    // Should show status in dropdown
    const statusSelect = page.locator('select');
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect).toHaveValue('in_progress');
  });

  test('should change review status to approved from UI', async ({ page, request }) => {
    // Create a review via API
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Navigate to the review
    await page.goto(`/reviews/${created.id}`);

    // Wait for the review to load
    await expect(page.getByText('Staged changes', { exact: true })).toBeVisible({ timeout: 10000 });

    // Change status via dropdown
    const statusSelect = page.locator('select');
    await statusSelect.selectOption('approved');

    // Wait for update to complete
    await page.waitForResponse((response) =>
      response.url().includes('/api/reviews/') && response.request().method() === 'PATCH'
    );

    // Status should be updated
    await expect(statusSelect).toHaveValue('approved');
  });

  test('should change review status to changes requested from UI', async ({ page, request }) => {
    // Create a review via API
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Navigate to the review
    await page.goto(`/reviews/${created.id}`);

    // Wait for the review to load
    await expect(page.getByText('Staged changes', { exact: true })).toBeVisible({ timeout: 10000 });

    // Change status via dropdown
    const statusSelect = page.locator('select');
    await statusSelect.selectOption('changes_requested');

    // Wait for update to complete
    await page.waitForResponse((response) =>
      response.url().includes('/api/reviews/') && response.request().method() === 'PATCH'
    );

    // Status should be updated
    await expect(statusSelect).toHaveValue('changes_requested');
  });

  test('should delete review from UI', async ({ page, request }) => {
    // Create a review via API
    const createResponse = await request.post('/api/reviews', {
      data: {},
    });
    const created = await createResponse.json();

    // Navigate to the review
    await page.goto(`/reviews/${created.id}`);

    // Wait for the review to load
    await expect(page.getByText('Staged changes', { exact: true })).toBeVisible({ timeout: 10000 });

    // Click delete button to open modal
    await page.getByRole('button', { name: 'Delete' }).first().click();

    // Confirm deletion in modal
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.getByText('Are you sure you want to delete this review?')).toBeVisible();

    // Click the confirm delete button inside the modal (the red one)
    await modal.getByRole('button', { name: 'Delete' }).click();

    // Should navigate back to reviews list
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show review in reviews list', async ({ page, request }) => {
    // Create a review via API
    await request.post('/api/reviews', {
      data: {},
    });

    // Navigate to reviews list
    await page.goto('/');

    // Wait for the list to load
    await page.waitForResponse((response) =>
      response.url().includes('/api/reviews') && response.status() === 200
    );

    // Should show at least one review in the list
    const reviewItems = page.locator('[data-testid="review-item"]');
    // If no data-testid, look for links to reviews
    const reviewLinks = page.locator('a[href^="/reviews/"]');

    const hasReviewItems = await reviewItems.count() > 0;
    const hasReviewLinks = await reviewLinks.count() > 0;

    expect(hasReviewItems || hasReviewLinks).toBeTruthy();
  });
});
