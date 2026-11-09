import crypto from 'node:crypto'
import { ACCOUNT_STATUS, ROLES } from '../../src/constants/index.js'
import { User } from '../../src/models/User.js'
import { REFRESH_COOKIE_NAME } from '../../src/utils/cookies.js'

export const TEST_PASSWORD = 'ValidTestPass!123'

export function createTestUser(overrides = {}) {
  const unique = crypto.randomUUID()

  return User.create({
    fullName: 'Test Parent',
    email: `parent-${unique}@example.com`,
    password: TEST_PASSWORD,
    role: ROLES.PARENT,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    ...overrides,
  })
}

export function readRefreshSetCookie(response) {
  const setCookies = response.headers.getSetCookie?.() ?? []

  return (
    setCookies.find((cookie) =>
      cookie.startsWith(`${REFRESH_COOKIE_NAME}=`),
    ) ?? null
  )
}

export function refreshCookieFromResponse(response) {
  const setCookie = readRefreshSetCookie(response)
  return setCookie ? setCookie.split(';')[0] : null
}

export async function loginRequest(
  baseUrl,
  email,
  password = TEST_PASSWORD,
) {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = await response.json()

  return {
    response,
    body,
    cookie: refreshCookieFromResponse(response),
    setCookie: readRefreshSetCookie(response),
  }
}

export function authHeader(accessToken) {
  return { authorization: `Bearer ${accessToken}` }
}
