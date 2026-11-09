import morgan from 'morgan'
import { env } from '../config/env.js'

const format = env.isProduction ? 'combined' : 'dev'

/**
 * HTTP request logging. Test runs stay quiet so the test report is readable.
 */
export const requestLogger = morgan(format, {
  skip: () => env.isTest,
})
