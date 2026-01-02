import { test, expect } from '@playwright/test';

test.describe('Reviews Page', () => {
  test('should display reviews list page', async ({ page }) => {
    await page.goto('/');

    // Should show the page title
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();

    // Should show "New Review" button
    await expect(page.getByRole('link', { name: 'New Review' })).toBeVisible();
  });

  test('should show empty state when no reviews exist', async ({ page }) => {
    await page.goto('/');

    // Wait for API response
    const response = await page.waitForResponse((response) =>
      response.url().includes('/api/reviews') && response.status() === 200
    );

    const data = await response.json();

    if (data.data && data.data.length === 0) {
      // Should show empty state message
      await expect(page.getByText('No reviews yet')).toBeVisible();
    }
  });

  test('should navigate to new review page when clicking New Review', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'New Review' }).click();

    await expect(page).toHaveURL('/new');
  });

  test('should handle 404 for non-existent review', async ({ page }) => {
    await page.goto('/reviews/non-existent-id');

    // Should show error message
    await expect(page.getByText('Review not found')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('API Health', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('should return repository info', async ({ request }) => {
    const response = await request.get('/api/info');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.name).toBe('local-code-reviewier');
    expect(data.branch).toBeDefined();
    expect(data.path).toBeDefined();
  });

  test('should return reviews list', async ({ request }) => {
    const response = await request.get('/api/reviews');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.data).toBeInstanceOf(Array);
    expect(data.total).toBeDefined();
    expect(data.page).toBeDefined();
    expect(data.pageSize).toBeDefined();
  });

  test('should return staged diff', async ({ request }) => {
    const response = await request.get('/api/diff/staged');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.files).toBeInstanceOf(Array);
    expect(data.summary).toBeDefined();
    expect(data.repository).toBeDefined();
  });
});
