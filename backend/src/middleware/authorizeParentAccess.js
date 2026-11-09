import { ROLES } from '../constants/index.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * A parent may read a child list only for their own account. ADMIN may read any
 * parent's list. The parent id always comes from the validated route params and
 * is compared with the authenticated database user, never with client claims.
 */
export const authorizeParentAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401)
  }

  if (req.user.role === ROLES.ADMIN) {
    next()
    return
  }

  const requestedParentId = String(req.validatedParams?.parentId ?? '')
  const ownParentId = String(req.user._id ?? req.user.id ?? '')

  if (req.user.role === ROLES.PARENT && requestedParentId === ownParentId) {
    next()
    return
  }

  throw new AppError(
    'You do not have permission to access this parent',
    403,
  )
})
