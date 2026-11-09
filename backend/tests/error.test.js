import test from 'node:test'
import assert from 'node:assert/strict'
import { errorHandler } from '../src/middleware/errorHandler.js'
import { AppError } from '../src/utils/AppError.js'
import { withServer } from './support/testServer.js'

function createMockResponse() {
  return {
    headersSent: false,
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.payload = body
      return this
    },
  }
}

test('unknown routes return a JSON 404 response', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/v1/does-not-exist`)

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), {
      success: false,
      message: 'Route not found: GET /api/v1/does-not-exist',
    })
  })
})

test('malformed JSON is handled by the centralized error handler', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"broken":',
    })

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
      success: false,
      message: 'Invalid JSON payload',
    })
  })
})

test('error handler returns operational errors with their status', () => {
  const req = { method: 'GET', originalUrl: '/api/v1/example' }
  const res = createMockResponse()

  errorHandler(new AppError('Invalid request', 422), req, res, () => {})

  assert.equal(res.statusCode, 422)
  assert.deepEqual(res.payload, {
    success: false,
    message: 'Invalid request',
  })
})

test('error handler converts unexpected errors to a clean 500 response', (t) => {
  t.mock.method(console, 'error', () => {})

  const req = { method: 'GET', originalUrl: '/api/v1/example' }
  const res = createMockResponse()

  errorHandler(new Error('Sensitive internal detail'), req, res, () => {})

  assert.equal(res.statusCode, 500)
  assert.equal(res.payload.success, false)
  assert.equal(res.payload.message, 'Sensitive internal detail')
  assert.equal('stack' in res.payload, false)
})

test('error handler ignores a second response after headers are sent', () => {
  const req = { method: 'GET', originalUrl: '/api/v1/example' }
  const res = createMockResponse()
  res.headersSent = true
  let forwarded

  errorHandler(new Error('late error'), req, res, (error) => {
    forwarded = error
  })

  assert.equal(res.statusCode, undefined)
  assert.equal(res.payload, undefined)
  assert.equal(forwarded.message, 'late error')
})
