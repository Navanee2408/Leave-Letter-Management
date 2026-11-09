import { ROLE_VALUES } from '../constants/index.js'
import { AppError } from '../utils/AppError.js'

/**
 * Restrict a route to one or more roles. Must be used after `authenticate`,
 * which loads the current database role into req.user.
 */
export function authorizeRoles(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error('authorizeRoles requires at least one allowed role')
  }

  const invalidRoles = allowedRoles.filter((role) => !ROLE_VALUES.includes(role))

  if (invalidRoles.length > 0) {
    throw new Error(`authorizeRoles received invalid role(s): ${invalidRoles.join(', ')}`)
  }

  const allowed = new Set(allowedRoles)

  return function authorize(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!allowed.has(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      )
    }

    return next()
  }
}
