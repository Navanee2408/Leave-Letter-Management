/**
 * Wrap async route handlers so rejected promises reach the centralized error
 * handler without a try/catch in every controller.
 */
export function asyncHandler(handler) {
  return function asyncHandlerWrapper(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
