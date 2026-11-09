import crypto from 'node:crypto'
import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { env } from '../src/config/env.js'
import {
  ACCOUNT_STATUS,
  ROLES,
} from '../src/constants/index.js'
import { RefreshSession } from '../src/models/RefreshSession.js'
import { User } from '../src/models/User.js'
import {
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
  hashToken,
} from '../src/services/token.service.js'
import { REFRESH_COOKIE_NAME } from '../src/utils/cookies.js'
import {
  TEST_PASSWORD,
  authHeader,
  createTestUser,
  loginRequest,
  readRefreshSetCookie,
} from './support/authTestUtils.js'
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './support/testDatabase.js'
import { withServer } from './support/testServer.js'

before(connectTestDatabase)
after(disconnectTestDatabase)
beforeEach(clearTestDatabase)

test('valid login returns an access token, safe user data, and refresh cookie', async () => {
  const user = await createTestUser({ email: 'valid.login@example.com' })

  await withServer(async ({ baseUrl }) => {
    const login = await loginRequest(baseUrl, 'Valid.Login@Example.COM')

    assert.equal(login.response.status, 200)
    assert.equal(login.response.headers.get('cache-control'), 'no-store')
    assert.equal(login.body.success, true)
    assert.equal(login.body.message, 'Login successful')
    assert.equal(typeof login.body.accessToken, 'string')
    assert.equal(login.body.user.id, user.id)
    assert.equal(login.body.user.email, 'valid.login@example.com')
    assert.equal(login.body.user.role, ROLES.PARENT)
    assert.equal('password' in login.body.user, false)
    assert.equal('refreshToken' in login.body, false)
    assert.equal(JSON.stringify(login.body).includes(user.password), false)

    assert.ok(login.cookie)
    assert.match(login.setCookie, /HttpOnly/i)
    assert.match(login.setCookie, /SameSite=Lax/i)
    assert.match(login.setCookie, /Path=\/api\/v1\/auth/i)

    const rawToken = login.cookie.slice(REFRESH_COOKIE_NAME.length + 1)
    const session = await RefreshSession.findOne({
      user: user._id,
    }).select('+tokenHash')

    assert.ok(session)
    assert.equal(session.tokenHash, hashToken(rawToken))
    assert.notEqual(session.tokenHash, rawToken)

    const updated = await User.findById(user._id)
    assert.ok(updated.lastLogin instanceof Date)
  })
})

test('invalid password and unknown email return the same safe 401 response', async () => {
  const user = await createTestUser()

  await withServer(async ({ baseUrl }) => {
    const wrongPassword = await loginRequest(
      baseUrl,
      user.email,
      'WrongPassword!123',
    )
    const unknownEmail = await loginRequest(
      baseUrl,
      'unknown.account@example.com',
      'WrongPassword!123',
    )

    assert.equal(wrongPassword.response.status, 401)
    assert.equal(unknownEmail.response.status, 401)
    assert.equal(wrongPassword.body.message, 'Invalid email or password')
    assert.deepEqual(wrongPassword.body, unknownEmail.body)
    assert.equal(wrongPassword.cookie, null)
    assert.equal(unknownEmail.cookie, null)
  })
})

test('inactive accounts cannot log in, even with the correct password', async () => {
  const user = await createTestUser({
    accountStatus: ACCOUNT_STATUS.INACTIVE,
  })

  await withServer(async ({ baseUrl }) => {
    const correctPassword = await loginRequest(baseUrl, user.email)

    assert.equal(correctPassword.response.status, 403)
    assert.equal(correctPassword.body.message, 'Account is inactive')
    assert.equal(correctPassword.body.accessToken, undefined)
    assert.equal(correctPassword.cookie, null)

    const wrongPassword = await loginRequest(
      baseUrl,
      user.email,
      'WrongPassword!123',
    )

    assert.equal(wrongPassword.response.status, 401)
    assert.equal(wrongPassword.body.message, 'Invalid email or password')
  })
})

test('missing credentials and protected fields are rejected with 400', async () => {
  const user = await createTestUser()

  const invalidBodies = [
    {},
    { email: user.email },
    { password: TEST_PASSWORD },
    {
      email: user.email,
      password: TEST_PASSWORD,
      role: ROLES.ADMIN,
    },
  ]

  await withServer(async ({ baseUrl }) => {
    for (const payload of invalidBodies) {
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json()

      assert.equal(response.status, 400)
      assert.equal(body.success, false)
      assert.equal(body.message, 'Validation failed')
      assert.ok(Array.isArray(body.details))
    }
  })
})

test('GET /api/v1/auth/me requires a valid access token', async () => {
  const user = await createTestUser()

  await withServer(async ({ baseUrl }) => {
    const missing = await fetch(`${baseUrl}/api/v1/auth/me`)

    assert.equal(missing.status, 401)
    assert.equal((await missing.json()).message, 'Authentication required')

    const malformed = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { authorization: 'Bearer not-a-valid-token' },
    })

    assert.equal(malformed.status, 401)
    assert.equal(
      (await malformed.json()).message,
      'Invalid or expired access token',
    )

    const login = await loginRequest(baseUrl, user.email)
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: authHeader(login.body.accessToken),
    })
    const body = await me.json()

    assert.equal(me.status, 200)
    assert.equal(me.headers.get('cache-control'), 'no-store')
    assert.equal(body.success, true)
    assert.equal(body.user.id, user.id)
    assert.equal(body.user.role, ROLES.PARENT)
    assert.equal('password' in body.user, false)
  })
})

test('expired and wrong-type access tokens are rejected with 401', async () => {
  const user = await createTestUser()
  const expiredToken = jwt.sign(
    { sub: user.id, role: user.role, type: 'access' },
    env.jwtAccessSecret,
    {
      algorithm: 'HS256',
      expiresIn: -1,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    },
  )

  await withServer(async ({ baseUrl }) => {
    const expired = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: authHeader(expiredToken),
    })

    assert.equal(expired.status, 401)
    assert.equal(
      (await expired.json()).message,
      'Invalid or expired access token',
    )

    const login = await loginRequest(baseUrl, user.email)
    const refreshToken = login.cookie.slice(REFRESH_COOKIE_NAME.length + 1)
    const wrongType = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: authHeader(refreshToken),
    })

    assert.equal(wrongType.status, 401)
  })
})

test('a role claim in the token cannot elevate the database role', async () => {
  const user = await createTestUser({ role: ROLES.PARENT })
  const forgedRoleToken = jwt.sign(
    { sub: user.id, role: ROLES.ADMIN, type: 'access' },
    env.jwtAccessSecret,
    {
      algorithm: 'HS256',
      expiresIn: '5m',
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    },
  )

  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: authHeader(forgedRoleToken),
    })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.user.role, ROLES.PARENT)
  })
})

test('deactivated accounts cannot keep using protected APIs', async () => {
  const user = await createTestUser()

  await withServer(async ({ baseUrl }) => {
    const login = await loginRequest(baseUrl, user.email)

    await User.updateOne(
      { _id: user._id },
      { $set: { accountStatus: ACCOUNT_STATUS.INACTIVE } },
    )

    const me = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: authHeader(login.body.accessToken),
    })

    assert.equal(me.status, 403)
    assert.equal((await me.json()).message, 'Account is inactive')
  })
})

test('refresh rotates the session and logout invalidates it', async () => {
  const user = await createTestUser()

  await withServer(async ({ baseUrl }) => {
    const login = await loginRequest(baseUrl, user.email)
    const firstCookie = login.cookie

    const refreshResponse = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { cookie: firstCookie },
    })
    const refreshBody = await refreshResponse.json()
    const rotatedSetCookie = readRefreshSetCookie(refreshResponse)
    const rotatedCookie = rotatedSetCookie.split(';')[0]

    assert.equal(refreshResponse.status, 200)
    assert.equal(refreshBody.success, true)
    assert.equal(typeof refreshBody.accessToken, 'string')
    assert.equal('refreshToken' in refreshBody, false)
    assert.match(rotatedSetCookie, /HttpOnly/i)
    assert.notEqual(rotatedCookie, firstCookie)

    const rotatedMe = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: authHeader(refreshBody.accessToken),
    })
    assert.equal(rotatedMe.status, 200)

    const reusedOldCookie = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { cookie: firstCookie },
    })
    assert.equal(reusedOldCookie.status, 401)

    const logout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie: rotatedCookie },
    })
    const logoutBody = await logout.json()
    const clearedCookie = readRefreshSetCookie(logout)

    assert.equal(logout.status, 200)
    assert.equal(logoutBody.success, true)
    assert.equal(logoutBody.message, 'Logged out successfully')
    assert.match(clearedCookie, /Expires=Thu, 01 Jan 1970/i)

    const refreshAfterLogout = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { cookie: rotatedCookie },
    })
    assert.equal(refreshAfterLogout.status, 401)

    const activeSessions = await RefreshSession.countDocuments({
      user: user._id,
      revokedAt: null,
    })
    assert.equal(activeSessions, 0)
  })
})

test('refresh rejects missing, invalid, expired, and wrong-type cookies', async () => {
  const user = await createTestUser()
  const expiredRefreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    env.jwtRefreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: -1,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      jwtid: crypto.randomUUID(),
    },
  )

  await withServer(async ({ baseUrl }) => {
    const missing = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
    })
    assert.equal(missing.status, 401)
    assert.equal(
      (await missing.json()).message,
      'Refresh token is required',
    )

    const invalid = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH_COOKIE_NAME}=invalid-token` },
    })
    assert.equal(invalid.status, 401)
    assert.match(readRefreshSetCookie(invalid), /Expires=Thu, 01 Jan 1970/i)

    const expired = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: `${REFRESH_COOKIE_NAME}=${expiredRefreshToken}`,
      },
    })
    assert.equal(expired.status, 401)
    assert.equal(
      (await expired.json()).message,
      'Invalid or expired refresh token',
    )

    const login = await loginRequest(baseUrl, user.email)
    const accessToken = login.body.accessToken
    const accessAsRefresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH_COOKIE_NAME}=${accessToken}` },
    })
    assert.equal(accessAsRefresh.status, 401)
  })
})

test('logout without a refresh cookie is idempotent', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
    })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.success, true)
    assert.match(readRefreshSetCookie(response), /Expires=Thu, 01 Jan 1970/i)
  })
})
