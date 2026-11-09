import { AppError } from '../utils/AppError.js'

/**
 * Validate req.body against a Zod schema. Strict schemas reject unknown fields,
 * which prevents clients from assigning protected fields such as role.
 */
function formatIssues(error, fallbackField) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || fallbackField,
    message: issue.message,
  }))
}

export function validateBody(schema) {
  return function validate(req, res, next) {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return next(new AppError('Validation failed', 400, formatIssues(result.error, 'body')))
    }

    req.body = result.data
    return next()
  }
}

export function validateParams(schema) {
  return function validate(req, res, next) {
    const result = schema.safeParse(req.params)

    if (!result.success) {
      return next(
        new AppError('Validation failed', 400, formatIssues(result.error, 'params')),
      )
    }

    // Express 5 exposes req.query and req.params as read-only getters, so the
    // parsed values are attached separately for controllers to consume.
    req.validatedParams = result.data
    return next()
  }
}

export function validateQuery(schema) {
  return function validate(req, res, next) {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      return next(
        new AppError('Validation failed', 400, formatIssues(result.error, 'query')),
      )
    }

    req.validatedQuery = result.data
    return next()
  }
}
