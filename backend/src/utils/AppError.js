/**
 * Operational error with an HTTP status code. Passing errors through this
 * class keeps controller code explicit and gives the central error handler a
 * safe, intentional message to return to clients.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message)

    this.name = 'AppError'
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    if (details !== undefined) {
      this.details = details
    }

    Error.captureStackTrace?.(this, this.constructor)
  }
}
