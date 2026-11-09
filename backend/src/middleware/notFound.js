import { AppError } from '../utils/AppError.js'

/**
 * Catch every request that did not match a route and forward a 404 to the
 * centralized error handler.
 */
export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}
