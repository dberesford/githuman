import { test, expect } from '@playwright/test';

// Helper to generate unique test identifiers
const uid = () => Math.random().toString(36).substring(2, 8);

test.describe('Todo Drawer UI', () => {
  test('should open and close todo drawer', async ({ page }) => {
    await page.goto('/');

    // Click the Todos button in the header (using aria-label)
    await page.getByRole('button', { name: 'Toggle todos' }).click();

    // Drawer should be visible
    const drawer = page.getByTestId('todo-drawer');
    await expect(drawer).toBeVisible();

    // Close button should work
    await page.getByRole('button', { name: 'Close todos' }).click();

    // Drawer should be closed (translated off screen)
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('should add a todo', async ({ page }) => {
    await page.goto('/');
    const todoText = `Test todo item ${uid()}`;

    // Open the todo drawer
    await page.getByRole('button', { name: 'Toggle todos' }).click();
    const drawer = page.getByTestId('todo-drawer');
    await expect(drawer).toBeVisible();

    // Fill in the input and click add
    await drawer.getByPlaceholder('Add a todo...').fill(todoText);
    await drawer.getByRole('button', { name: 'Add' }).click();

    // The todo should appear in the list
    await expect(drawer.getByText(todoText)).toBeVisible();
  });

  test('should toggle todo completion', async ({ page }) => {
    await page.goto('/');
    const todoText = `Toggle test todo ${uid()}`;

    // Open the todo drawer and add a todo
    await page.getByRole('button', { name: 'Toggle todos' }).click();
    const drawer = page.getByTestId('todo-drawer');
    await drawer.getByPlaceholder('Add a todo...').fill(todoText);
    await drawer.getByRole('button', { name: 'Add' }).click();

    // Wait for the todo to appear
    await expect(drawer.getByText(todoText)).toBeVisible();

    // Find the todo item using data-testid pattern and click the checkbox
    const todoItem = drawer.locator('[data-testid^="todo-item-"]').filter({ hasText: todoText });
    await todoItem.getByRole('button', { name: /mark as complete/i }).click();

    // The todo should be marked as complete (has line-through style)
    await expect(todoItem.locator('span.line-through')).toBeVisible();
  });

  test('should delete a todo', async ({ page }) => {
    await page.goto('/');
    const todoText = `Delete test todo ${uid()}`;

    // Open the todo drawer and add a todo
    await page.getByRole('button', { name: 'Toggle todos' }).click();
    const drawer = page.getByTestId('todo-drawer');
    await drawer.getByPlaceholder('Add a todo...').fill(todoText);
    await drawer.getByRole('button', { name: 'Add' }).click();

    // Wait for the todo to appear
    await expect(drawer.getByText(todoText)).toBeVisible();

    // Find the todo item and hover to reveal delete button
    const todoItem = drawer.locator('[data-testid^="todo-item-"]').filter({ hasText: todoText });
    await todoItem.hover();

    // Click delete
    await todoItem.getByRole('button', { name: 'Delete todo' }).click();

    // The todo should be removed
    await expect(drawer.getByText(todoText)).not.toBeVisible();
  });

  test('should filter todos by status', async ({ page }) => {
    await page.goto('/');
    const suffix = uid();
    const pendingText = `Pending todo ${suffix}`;
    const completedText = `Completed todo ${suffix}`;

    // Open the todo drawer
    await page.getByRole('button', { name: 'Toggle todos' }).click();
    const drawer = page.getByTestId('todo-drawer');

    // Add two todos
    await drawer.getByPlaceholder('Add a todo...').fill(pendingText);
    await drawer.getByRole('button', { name: 'Add' }).click();
    await expect(drawer.getByText(pendingText)).toBeVisible();

    await drawer.getByPlaceholder('Add a todo...').fill(completedText);
    await drawer.getByRole('button', { name: 'Add' }).click();
    await expect(drawer.getByText(completedText)).toBeVisible();

    // Mark one as complete using data-testid
    const completedItem = drawer.locator('[data-testid^="todo-item-"]').filter({ hasText: completedText });
    await completedItem.getByRole('button', { name: /mark as complete/i }).click();

    // Click Pending filter - wait for completed item to disappear
    await drawer.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(drawer.getByText(completedText)).not.toBeVisible({ timeout: 10000 });
    await expect(drawer.getByText(pendingText)).toBeVisible();

    // Click Done filter (use exact: true to avoid matching "Clear done")
    await drawer.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(drawer.getByText(pendingText)).not.toBeVisible({ timeout: 10000 });
    await expect(drawer.getByText(completedText)).toBeVisible();

    // Click All filter
    await drawer.getByRole('button', { name: 'All', exact: true }).click();
    await expect(drawer.getByText(pendingText)).toBeVisible({ timeout: 10000 });
    await expect(drawer.getByText(completedText)).toBeVisible();
  });
});

test.describe('Todo API', () => {
  let createdTodoId: string;

  test('should create a todo', async ({ request }) => {
    const response = await request.post('/api/todos', {
      data: { content: 'E2E test todo' },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.content).toBe('E2E test todo');
    expect(data.completed).toBe(false);
    expect(data.id).toBeDefined();

    createdTodoId = data.id;
  });

  test('should get todos list', async ({ request }) => {
    const response = await request.get('/api/todos');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toBeInstanceOf(Array);
  });

  test('should get todo stats', async ({ request }) => {
    const response = await request.get('/api/todos/stats');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.total).toBeDefined();
    expect(data.completed).toBeDefined();
    expect(data.pending).toBeDefined();
  });

  test('should update a todo', async ({ request }) => {
    // First create a todo
    const createResponse = await request.post('/api/todos', {
      data: { content: 'Update test todo' },
    });
    const created = await createResponse.json();

    // Update it
    const response = await request.patch(`/api/todos/${created.id}`, {
      data: { content: 'Updated content' },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.content).toBe('Updated content');
  });

  test('should toggle a todo', async ({ request }) => {
    // First create a todo
    const createResponse = await request.post('/api/todos', {
      data: { content: 'Toggle test todo' },
    });
    const created = await createResponse.json();
    expect(created.completed).toBe(false);

    // Toggle it
    const response = await request.post(`/api/todos/${created.id}/toggle`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.completed).toBe(true);

    // Toggle again
    const response2 = await request.post(`/api/todos/${created.id}/toggle`);
    const data2 = await response2.json();
    expect(data2.completed).toBe(false);
  });

  test('should delete a todo', async ({ request }) => {
    // First create a todo
    const createResponse = await request.post('/api/todos', {
      data: { content: 'Delete test todo' },
    });
    const created = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/todos/${created.id}`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify it's gone
    const getResponse = await request.get(`/api/todos/${created.id}`);
    expect(getResponse.status()).toBe(404);
  });

  test('should clear completed todos', async ({ request }) => {
    // Create and complete a todo
    const createResponse = await request.post('/api/todos', {
      data: { content: 'Clear test todo' },
    });
    const created = await createResponse.json();

    // Toggle to complete it
    await request.post(`/api/todos/${created.id}/toggle`);

    // Clear completed
    const response = await request.delete('/api/todos/completed');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.deleted).toBeGreaterThanOrEqual(1);
  });
});
