import test from 'node:test'
import assert from 'node:assert/strict'
import { connectDatabase, getDatabaseStatus } from '../src/config/db.js'

test('database status starts as disconnected', () => {
  assert.equal(getDatabaseStatus(), 'disconnected')
})

test('connectDatabase refuses to run without MONGODB_URI', async () => {
  await assert.rejects(
    connectDatabase(''),
    /MONGODB_URI is not defined\. Copy \.env\.example to \.env/,
  )
})
