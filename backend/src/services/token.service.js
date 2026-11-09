import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const TOKEN_ISSUER = 'college-leave-management-api'
export const TOKEN_AUDIENCE = 'college-leave-management-client'

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60
export const ACCESS_TOKEN_TTL_MS = ACCESS_TOKEN_TTL_SECONDS * 1000
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000

const ALGORITHM = 'HS256'

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: 'access',
    },
    env.jwtAccessSecret,
    {
      algorithm: ALGORITHM,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    },
  )
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtAccessSecret, {
    algorithms: [ALGORITHM],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  })

  if (
    typeof payload !== 'object' ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid access token payload')
  }

  return payload
}

export function signRefreshToken(user, jti) {
  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    env.jwtRefreshSecret,
    {
      algorithm: ALGORITHM,
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      jwtid: jti,
    },
  )
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwtRefreshSecret, {
    algorithms: [ALGORITHM],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  })

  if (
    typeof payload !== 'object' ||
    payload.type !== 'refresh' ||
    typeof payload.sub !== 'string' ||
    typeof payload.jti !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid refresh token payload')
  }

  return payload
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function tokenHashesMatch(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false

  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')

  if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}
