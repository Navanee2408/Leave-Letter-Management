import test from 'node:test'
import assert from 'node:assert/strict'
import { allowedOrigins } from '../src/config/env.js'
import { getHealthStatus } from '../src/services/health.service.js'
import { withServer } from './support/testServer.js'

test('GET /api/v1/health returns the backend and database status', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/v1/health`)

    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /application\/json/)

    const body = await response.json()

    assert.deepEqual(Object.keys(body).sort(), [
      'database',
      'message',
      'success',
    ])
    assert.equal(body.success, true)
    assert.equal(body.message, 'Backend is running')
    assert.ok(
      ['connected', 'connecting', 'disconnected', 'disconnecting', 'unknown'].includes(
        body.database,
      ),
    )
  })
})

test('health endpoint reports the live Mongoose connection state', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/v1/health`)
    const body = await response.json()

    // No database is connected during tests, so the endpoint must say so
    // rather than hard-coding "connected".
    assert.equal(body.database, 'disconnected')
  })
})

test('health service maps a connected database correctly', () => {
  assert.deepEqual(getHealthStatus('connected'), {
    success: true,
    message: 'Backend is running',
    database: 'connected',
  })
})

test('security headers and CORS are applied to API responses', async () => {
  const origin = allowedOrigins[0]

  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: origin },
    })

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(response.headers.get('x-powered-by'), null)
    assert.equal(response.headers.get('access-control-allow-origin'), origin)
  })
})
