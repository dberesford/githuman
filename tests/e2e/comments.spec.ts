import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Helper to generate unique test identifiers
const uid = () => Math.random().toString(36).substring(2, 8);

// Test file path for staging
const TEST_FILE = join(process.cwd(), 'test-file-for-comments-e2e.txt');

// Setup: Stage a test file so we can create reviews
test.beforeAll(async () => {
  writeFileSync(TEST_FILE, `Test content for comments ${uid()}\n`);
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

test.describe('Comments API', () => {
  test('should create a comment on a review', async ({ request }) => {
    // First create a review
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    // Add a comment
    const response = await request.post(`/api/reviews/${review.id}/comments`, {
      data: {
        filePath: 'test-file-for-comments-e2e.txt',
        lineNumber: 1,
        lineType: 'added',
        content: 'This is a test comment',
      },
    });

    expect(response.ok()).toBeTruthy();

    const comment = await response.json();
    expect(comment.filePath).toBe('test-file-for-comments-e2e.txt');
    expect(comment.lineNumber).toBe(1);
    expect(comment.content).toBe('This is a test comment');
    expect(comment.resolved).toBe(false);
    expect(comment.id).toBeDefined();
  });

  test('should create a comment with code suggestion', async ({ request }) => {
    // First create a review
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    // Add a comment with suggestion
    const response = await request.post(`/api/reviews/${review.id}/comments`, {
      data: {
        filePath: 'test-file-for-comments-e2e.txt',
        lineNumber: 1,
        lineType: 'added',
        content: 'Consider using a more descriptive name',
        suggestion: 'const descriptiveName = getValue();',
      },
    });

    expect(response.ok()).toBeTruthy();

    const comment = await response.json();
    expect(comment.content).toBe('Consider using a more descriptive name');
    expect(comment.suggestion).toBe('const descriptiveName = getValue();');
  });

  test('should get comments for a review', async ({ request }) => {
    // Create a review and add comments
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    // Add multiple comments
    await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Comment 1' },
    });
    await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Comment 2' },
    });

    // Get all comments
    const response = await request.get(`/api/reviews/${review.id}/comments`);

    expect(response.ok()).toBeTruthy();

    const comments = await response.json();
    expect(comments).toBeInstanceOf(Array);
    expect(comments.length).toBeGreaterThanOrEqual(2);
  });

  test('should filter comments by file path', async ({ request }) => {
    // Create a review and add comments
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    // Add comments
    await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Comment on file' },
    });

    // Filter by file path
    const response = await request.get(
      `/api/reviews/${review.id}/comments?filePath=test-file-for-comments-e2e.txt`
    );

    expect(response.ok()).toBeTruthy();

    const comments = await response.json();
    expect(comments).toBeInstanceOf(Array);
    for (const comment of comments) {
      expect(comment.filePath).toBe('test-file-for-comments-e2e.txt');
    }
  });

  test('should get comment statistics', async ({ request }) => {
    // Create a review
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    // Add a comment
    await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Test' },
    });

    // Get stats
    const response = await request.get(`/api/reviews/${review.id}/comments/stats`);

    expect(response.ok()).toBeTruthy();

    const stats = await response.json();
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.resolved).toBeDefined();
    expect(stats.unresolved).toBeDefined();
  });

  test('should get a comment by ID', async ({ request }) => {
    // Create a review and comment
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    const commentResponse = await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Get me' },
    });
    const comment = await commentResponse.json();

    // Get by ID
    const response = await request.get(`/api/comments/${comment.id}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.id).toBe(comment.id);
    expect(data.content).toBe('Get me');
  });

  test('should update a comment', async ({ request }) => {
    // Create a review and comment
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    const commentResponse = await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Original content' },
    });
    const comment = await commentResponse.json();

    // Update it
    const response = await request.patch(`/api/comments/${comment.id}`, {
      data: {
        content: 'Updated content',
        suggestion: 'New suggestion',
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.content).toBe('Updated content');
    expect(data.suggestion).toBe('New suggestion');
  });

  test('should delete a comment', async ({ request }) => {
    // Create a review and comment
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    const commentResponse = await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Delete me' },
    });
    const comment = await commentResponse.json();

    // Delete it
    const response = await request.delete(`/api/comments/${comment.id}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify it's gone
    const getResponse = await request.get(`/api/comments/${comment.id}`);
    expect(getResponse.status()).toBe(404);
  });

  test('should resolve a comment', async ({ request }) => {
    // Create a review and comment
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    const commentResponse = await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Resolve me' },
    });
    const comment = await commentResponse.json();
    expect(comment.resolved).toBe(false);

    // Resolve it
    const response = await request.post(`/api/comments/${comment.id}/resolve`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.resolved).toBe(true);
  });

  test('should unresolve a comment', async ({ request }) => {
    // Create a review and comment
    const reviewResponse = await request.post('/api/reviews', {
      data: {},
    });
    const review = await reviewResponse.json();

    const commentResponse = await request.post(`/api/reviews/${review.id}/comments`, {
      data: { filePath: 'test-file-for-comments-e2e.txt', lineNumber: 1, lineType: 'added', content: 'Toggle me' },
    });
    const comment = await commentResponse.json();

    // Resolve first
    await request.post(`/api/comments/${comment.id}/resolve`);

    // Then unresolve
    const response = await request.post(`/api/comments/${comment.id}/unresolve`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.resolved).toBe(false);
  });

  test('should return 404 for comment on non-existent review', async ({ request }) => {
    const response = await request.post('/api/reviews/non-existent/comments', {
      data: { filePath: 'file.ts', lineNumber: 1, content: 'Test' },
    });

    expect(response.status()).toBe(404);
  });

  test('should return 404 for non-existent comment', async ({ request }) => {
    const response = await request.get('/api/comments/non-existent-id');

    expect(response.status()).toBe(404);
  });
});
