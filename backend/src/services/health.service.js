import { getDatabaseStatus } from '../config/db.js'

/**
 * Build the health payload. The database field defaults to the live Mongoose
 * connection state; a status can be injected for unit testing.
 */
export function getHealthStatus(databaseStatus = getDatabaseStatus()) {
  return {
    success: true,
    message: 'Backend is running',
    database: databaseStatus,
  }
}
