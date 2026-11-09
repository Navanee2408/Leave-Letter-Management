import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAccessToken,
  setAccessToken,
  getErrorMessage,
  onAuthFailure,
} from './client.js'

test('API Client token management and error formatting', () => {
  setAccessToken('initial-token-123')
  assert.equal(getAccessToken(), 'initial-token-123')

  setAccessToken(null)
  assert.equal(getAccessToken(), null)

  const msg1 = getErrorMessage({ response: { data: { message: 'Custom server error' } } })
  assert.equal(msg1, 'Custom server error')

  const msg2 = getErrorMessage({ response: { data: { error: 'Fallback error key' } } })
  assert.equal(msg2, 'Fallback error key')

  const msg3 = getErrorMessage(new Error('Network error'))
  assert.equal(msg3, 'Network error')

  const msg4 = getErrorMessage({}, 'Default fallback')
  assert.equal(msg4, 'Default fallback')

  const unsubscribe = onAuthFailure(() => {})
  assert.equal(typeof unsubscribe, 'function')
  unsubscribe()
})
