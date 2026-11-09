import { env } from '../config/env.js'
import { REFRESH_TOKEN_TTL_MS } from '../services/token.service.js'

export const REFRESH_COOKIE_NAME = 'clms_refresh_token'
export const AUTH_COOKIE_PATH = '/api/v1/auth'

/**
 * The refresh token is only ever stored in an HttpOnly cookie. Development and
 * test runs use HTTP on localhost, so `secure` is enabled only in production,
 * where cross-site cookies also require SameSite=None.
 */
export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: AUTH_COOKIE_PATH,
  }
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...getRefreshCookieOptions(),
    maxAge: REFRESH_TOKEN_TTL_MS,
  })
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions())
}
