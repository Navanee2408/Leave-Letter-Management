import mongoose from 'mongoose'
import { ACCOUNT_STATUS } from '../constants/index.js'
import { User } from '../models/User.js'
import { verifyAccessToken } from '../services/token.service.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Verify the Bearer access token, then reload the account from MongoDB. Roles,
 * departments, and account status are never trusted from token or client data.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  const match = typeof header === 'string' ? /^Bearer\s+(.+)$/i.exec(header) : null

  if (!match) {
    throw new AppError('Authentication required', 401)
  }

  const token = match[1].trim()

  if (!token) {
    throw new AppError('Authentication required', 401)
  }

  let payload

  try {
    payload = verifyAccessToken(token)
  } catch {
    throw new AppError('Invalid or expired access token', 401)
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw new AppError('Invalid or expired access token', 401)
  }

  const user = await User.findById(payload.sub)

  if (!user) {
    throw new AppError('Invalid or expired access token', 401)
  }

  if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Account is inactive', 403)
  }

  req.user = user
  req.auth = { tokenId: payload.jti ?? null }
  next()
})
