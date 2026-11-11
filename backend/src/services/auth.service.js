import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { ACCOUNT_STATUS, BCRYPT_SALT_ROUNDS } from '../constants/index.js'
import { RefreshSession } from '../models/RefreshSession.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import {
  REFRESH_TOKEN_TTL_MS,
  hashToken,
  signAccessToken,
  signRefreshToken,
  tokenHashesMatch,
  verifyRefreshToken,
} from './token.service.js'

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password'
const INVALID_REFRESH_MESSAGE = 'Invalid or expired refresh token'

let dummyHashPromise

/**
 * Unknown emails still perform a bcrypt comparison so response timing does not
 * reveal whether an account exists.
 */
async function consumePasswordCheck(password) {
  dummyHashPromise ??= bcrypt.hash(
    'clms-invalid-login-placeholder',
    BCRYPT_SALT_ROUNDS,
  )
  const dummyHash = await dummyHashPromise
  await bcrypt.compare(password, dummyHash)
}

async function createRefreshSession(user) {
  const jti = crypto.randomUUID()
  const token = signRefreshToken(user, jti)

  await RefreshSession.create({
    user: user._id,
    jti,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  })

  return token
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail }).select('+password')

  if (!user) {
    await consumePasswordCheck(password)
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401)
  }

  const passwordMatches = await user.comparePassword(password)

  if (!passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401)
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Account is inactive', 403)
  }

  user.lastLogin = new Date()
  await User.updateOne(
    { _id: user._id },
    { $set: { lastLogin: user.lastLogin } },
  )

  const accessToken = signAccessToken(user)
  const refreshToken = await createRefreshSession(user)

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  }
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401)
  }

  let payload

  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401)
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401)
  }

  const session = await RefreshSession.findOne({
    jti: payload.jti,
    user: payload.sub,
  }).select('+tokenHash')

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401)
  }

  if (!tokenHashesMatch(session.tokenHash, hashToken(refreshToken))) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401)
  }

  const user = await User.findById(payload.sub)

  if (!user) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401)
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Account is inactive', 403)
  }

  // Atomically revoke the current session before issuing a rotated token.
  const revoked = await RefreshSession.findOneAndUpdate(
    { _id: session._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { returnDocument: 'after' },
  )

  if (!revoked) {
    throw new AppError(INVALID_REFRESH_MESSAGE, 401)
  }

  const accessToken = signAccessToken(user)
  const nextRefreshToken = await createRefreshSession(user)

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken: nextRefreshToken,
  }
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) return

  try {
    const payload = verifyRefreshToken(refreshToken)

    await RefreshSession.updateOne(
      {
        jti: payload.jti,
        user: payload.sub,
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } },
    )
  } catch {
    // An invalid or expired refresh token has no active session to revoke.
  }
}

export async function changeUserPassword(
  userId,
  { currentPassword, newPassword },
) {
  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new AppError('Invalid or expired access token', 401)
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Account is inactive', 403)
  }

  const matches = await user.comparePassword(currentPassword)

  if (!matches) {
    throw new AppError('Current password is incorrect', 400)
  }

  user.password = newPassword
  user.mustChangePassword = false
  await user.save()

  await RefreshSession.updateMany(
    { user: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )

  const accessToken = signAccessToken(user)
  const refreshToken = await createRefreshSession(user)

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  }
}
