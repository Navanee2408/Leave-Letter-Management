import { env } from '../config/env.js'

const FALLBACK_MESSAGE = 'Internal server error'

/**
 * Centralized error handler. It is the only place that formats error
 * responses, so controllers can simply call next(error).
 */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  let statusCode = Number(error.statusCode || error.status) || 500
  let message = error.message || FALLBACK_MESSAGE
  let details = error.details

  if (error.type === 'entity.parse.failed') {
    statusCode = 400
    message = 'Invalid JSON payload'
    details = undefined
  } else if (error.type === 'entity.too.large') {
    statusCode = 413
    message = 'Request payload too large'
    details = undefined
  } else if (error.name === 'ValidationError' && error.errors) {
    // Model validation is a client-input problem, not a server failure.
    statusCode = 400
    message = 'Validation failed'
    details = Object.values(error.errors).map((issue) => ({
      field: issue.path,
      message: issue.message,
    }))
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Validation failed'
    details = undefined
  } else if (error.code === 11000) {
    // Safety net for unique indexes; services normally provide a clearer 409.
    statusCode = 409
    message = 'A record with these details already exists'
    details = undefined
  } else if (statusCode >= 500 && env.isProduction) {
    message = FALLBACK_MESSAGE
  }

  if (statusCode >= 500) {
    console.error(
      `[error] ${req.method} ${req.originalUrl} - ${error.stack || error.message}`,
    )
  }

  const payload = { success: false, message }

  if (details !== undefined) {
    payload.details = details
  }

  return res.status(statusCode).json(payload)
}
