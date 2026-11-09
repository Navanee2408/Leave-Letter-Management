import { AppError } from './AppError.js'

/**
 * MongoDB reports unique-index violations with code 11000. Services convert
 * those into safe 409 responses instead of leaking database details.
 */
export function isDuplicateKeyError(error) {
  return Boolean(error) && error.code === 11000
}

export function duplicateKeyFields(error) {
  if (!error) return []

  if (error.keyPattern && typeof error.keyPattern === 'object') {
    return Object.keys(error.keyPattern)
  }

  if (error.keyValue && typeof error.keyValue === 'object') {
    return Object.keys(error.keyValue)
  }

  return []
}

export function toConflictError(
  error,
  fieldMessages,
  fallback = 'A record with these details already exists',
) {
  for (const field of duplicateKeyFields(error)) {
    if (fieldMessages[field]) {
      return new AppError(fieldMessages[field], 409)
    }
  }

  return new AppError(fallback, 409)
}
