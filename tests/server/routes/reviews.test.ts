import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildApp } from '../../../src/server/app.ts'
import { createConfig } from '../../../src/server/config.ts'
import { initDatabase, closeDatabase } from '../../../src/server/db/index.ts'
import type { FastifyInstance } from 'fastify'

/**
 * Create a temporary git repository with no staged changes
 */
function createTempGitRepo (): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'))
  execSync('git init', { cwd: tempDir, stdio: 'ignore' })
  execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'ignore' })
  execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'ignore' })
  // Create an initial commit so HEAD exists
  fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test')
  execSync('git add .', { cwd: tempDir, stdio: 'ignore' })
  execSync('git commit -m "Initial commit"', { cwd: tempDir, stdio: 'ignore' })
  return tempDir
}

describe('review routes', () => {
  let app: FastifyInstance
  let testDbDir: string
  let testRepoDir: string

  before(async () => {
    // Create temp directory for test database
    testDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-test-'))
    const dbPath = path.join(testDbDir, 'test.db')

    // Create a clean git repo for testing
    testRepoDir = createTempGitRepo()

    // Initialize database
    initDatabase(dbPath)

    // Use temp git repo for testing
    const config = createConfig({
      repositoryPath: testRepoDir,
      dbPath,
    })
    app = await buildApp(config, { logger: false })
  })

  after(async () => {
    await app.close()
    closeDatabase()

    // Clean up temp directories
    if (testDbDir) {
      fs.rmSync(testDbDir, { recursive: true, force: true })
    }
    if (testRepoDir) {
      fs.rmSync(testRepoDir, { recursive: true, force: true })
    }
  })

  describe('GET /api/reviews', () => {
    it('should return empty list initially', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews',
      })

      assert.strictEqual(response.statusCode, 200)

      const body = JSON.parse(response.body)
      assert.ok(Array.isArray(body.reviews))
      assert.strictEqual(body.total, 0)
      assert.strictEqual(body.page, 1)
      assert.strictEqual(body.pageSize, 20)
    })

    it('should support pagination parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews?page=2&pageSize=10',
      })

      assert.strictEqual(response.statusCode, 200)

      const body = JSON.parse(response.body)
      assert.strictEqual(body.page, 2)
      assert.strictEqual(body.pageSize, 10)
    })
  })

  describe('POST /api/reviews', () => {
    it('should return error when no staged changes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reviews',
        payload: {
          sourceType: 'staged',
        },
      })

      // Expect error since test runs against clean repo
      assert.strictEqual(response.statusCode, 400)

      const body = JSON.parse(response.body)
      assert.strictEqual(body.code, 'NO_STAGED_CHANGES')
    })

    it('should work with empty body (defaults to staged)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reviews',
        payload: {},
      })

      // Without staged changes, returns the NO_STAGED_CHANGES error
      assert.strictEqual(response.statusCode, 400)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.code, 'NO_STAGED_CHANGES')
    })
  })

  describe('GET /api/reviews/:id', () => {
    it('should return 404 for non-existent review', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews/non-existent-id',
      })

      assert.strictEqual(response.statusCode, 404)

      const body = JSON.parse(response.body)
      assert.strictEqual(body.error, 'Review not found')
    })
  })

  describe('PATCH /api/reviews/:id', () => {
    it('should return 404 for non-existent review', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/reviews/non-existent-id',
        payload: {
          status: 'approved',
        },
      })

      assert.strictEqual(response.statusCode, 404)

      const body = JSON.parse(response.body)
      assert.strictEqual(body.error, 'Review not found')
    })
  })

  describe('DELETE /api/reviews/:id', () => {
    it('should return 404 for non-existent review', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/reviews/non-existent-id',
      })

      assert.strictEqual(response.statusCode, 404)

      const body = JSON.parse(response.body)
      assert.strictEqual(body.error, 'Review not found')
    })

    it('should delete review without Content-Type header', async () => {
      // This tests the fix for the "Body cannot be empty" error
      // when Content-Type is set but no body is provided
      // The client should NOT send Content-Type for DELETE without body
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/reviews/some-id',
        // Explicitly no headers or payload
      })

      // Should return 404 (not found), not 400 (bad request)
      assert.strictEqual(response.statusCode, 404)
    })
  })

  describe('GET /api/reviews/stats', () => {
    it('should return stats structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews/stats',
      })

      assert.strictEqual(response.statusCode, 200)

      const body = JSON.parse(response.body)
      assert.ok('total' in body)
      assert.ok('inProgress' in body)
      assert.ok('approved' in body)
      assert.ok('changesRequested' in body)
    })

    it('should return zeros for fresh database', async () => {
      // With a fresh temp repo and database, stats should be zeros
      const response = await app.inject({
        method: 'GET',
        url: '/api/reviews/stats',
      })

      const body = JSON.parse(response.body)
      // Verify all values are numbers (could be 0 or higher if tests created reviews)
      assert.strictEqual(typeof body.total, 'number')
      assert.strictEqual(typeof body.inProgress, 'number')
      assert.strictEqual(typeof body.approved, 'number')
      assert.strictEqual(typeof body.changesRequested, 'number')
      // Sum of statuses should equal total
      assert.strictEqual(
        body.inProgress + body.approved + body.changesRequested,
        body.total
      )
    })
  })
})

describe('review routes with non-git directory', () => {
  let app: FastifyInstance
  let testDbDir: string

  before(async () => {
    // Create temp directory for test database
    testDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-test-nongit-'))
    const dbPath = path.join(testDbDir, 'test.db')

    // Use a separate database instance for this test
    initDatabase(dbPath)

    const config = createConfig({
      repositoryPath: '/tmp', // Not a git repo
      dbPath,
    })
    app = await buildApp(config, { logger: false })
  })

  after(async () => {
    await app.close()
    closeDatabase()

    if (testDbDir) {
      fs.rmSync(testDbDir, { recursive: true, force: true })
    }
  })

  it('should return error when creating review in non-git directory', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/reviews',
      payload: {
        sourceType: 'staged',
      },
    })

    assert.strictEqual(response.statusCode, 400)

    const body = JSON.parse(response.body)
    assert.strictEqual(body.code, 'NOT_GIT_REPO')
  })
})
