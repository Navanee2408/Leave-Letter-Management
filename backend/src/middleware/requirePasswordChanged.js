import { AppError } from '../utils/AppError.js'

export function requirePasswordChanged(req, res, next) {
  if (req.user?.mustChangePassword) {
    throw new AppError(
      'Password change is required before accessing this resource',
      403,
    )
  }

  next()
}
