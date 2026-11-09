import test from 'node:test'
import assert from 'node:assert/strict'
import { ROLES } from '../src/constants/index.js'
import { authorizeRoles } from '../src/middleware/authorizeRoles.js'

function runMiddleware(middleware, req) {
  let result = 'next-called-without-error'
  middleware(req, {}, (error) => {
    result = error
  })
  return result
}

test('authorizeRoles allows every configured role', () => {
  const middleware = authorizeRoles(ROLES.ADMIN, ROLES.HOD)

  assert.equal(runMiddleware(middleware, { user: { role: ROLES.ADMIN } }), undefined)
  assert.equal(runMiddleware(middleware, { user: { role: ROLES.HOD } }), undefined)
})

test('authorizeRoles rejects an authenticated user with another role', () => {
  const error = runMiddleware(authorizeRoles(ROLES.ADMIN), {
    user: { role: ROLES.PARENT },
  })

  assert.equal(error.statusCode, 403)
  assert.equal(error.message, 'You do not have permission to perform this action')
})

test('authorizeRoles rejects a request without an authenticated user', () => {
  const error = runMiddleware(authorizeRoles(ROLES.ADMIN), {})

  assert.equal(error.statusCode, 401)
  assert.equal(error.message, 'Authentication required')
})

test('authorizeRoles rejects invalid role configuration', () => {
  assert.throws(
    () => authorizeRoles('SUPER_ADMIN'),
    /invalid role\(s\): SUPER_ADMIN/,
  )
})
