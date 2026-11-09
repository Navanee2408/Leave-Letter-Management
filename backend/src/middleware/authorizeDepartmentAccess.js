import { AppError } from '../utils/AppError.js'
import { ROLES } from '../constants/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * AUTHORIZATION: department access is derived from the authenticated database
 * user, never from a client-supplied role or department. ADMIN may access every
 * department; an HOD may access only the department stored on their account.
 */
export const authorizeDepartmentAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401)
  }

  if (req.user.role === ROLES.ADMIN) {
    next()
    return
  }

  const requestedId = String(req.validatedParams?.id ?? '')
  const ownDepartmentId = req.user.department
    ? String(req.user.department)
    : null

  if (
    req.user.role === ROLES.HOD &&
    ownDepartmentId &&
    ownDepartmentId === requestedId
  ) {
    next()
    return
  }

  throw new AppError(
    'You do not have permission to access this department',
    403,
  )
})
