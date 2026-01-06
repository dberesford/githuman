import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { buildApp } from '../../../src/server/app.ts'
import { createConfig } from '../../../src/server/config.ts'
import { initDatabase, closeDatabase } from '../../../src/server/db/index.ts'
import type { FastifyInstance } from 'fastify'

describe('events routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    const config = createConfig({ dbPath: ':memory:' })
    initDatabase(config.dbPath)
    app = await buildApp(config, { logger: false, serveStatic: false })
  })

  afterEach(async () => {
    await app.close()
    closeDatabase()
  })

  describe('GET /api/events/clients', () => {
    it('should return count of connected clients', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/events/clients',
      })

      assert.strictEqual(response.statusCode, 200)
      const body = JSON.parse(response.body)
      assert.strictEqual(typeof body.count, 'number')
      assert.strictEqual(body.count, 0)
    })
  })

  describe('POST /api/events/notify', () => {
    it('should accept todos notification', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events/notify',
        payload: { type: 'todos', action: 'updated' },
      })

      assert.strictEqual(response.statusCode, 200)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.success, true)
    })

    it('should accept reviews notification', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events/notify',
        payload: { type: 'reviews', action: 'created' },
      })

      assert.strictEqual(response.statusCode, 200)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.success, true)
    })

    it('should accept comments notification', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events/notify',
        payload: { type: 'comments', action: 'deleted' },
      })

      assert.strictEqual(response.statusCode, 200)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.success, true)
    })

    it('should accept notification without action', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events/notify',
        payload: { type: 'todos' },
      })

      assert.strictEqual(response.statusCode, 200)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.success, true)
    })

    it('should reject invalid event type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events/notify',
        payload: { type: 'invalid' },
      })

      assert.strictEqual(response.statusCode, 400)
    })

    it('should reject missing type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events/notify',
        payload: {},
      })

      assert.strictEqual(response.statusCode, 400)
    })
  })

  // Note: GET /api/events (SSE endpoint) cannot be easily tested with Fastify's inject
  // because it hijacks the response for streaming. The endpoint is tested via
  // integration testing when needed.
})
