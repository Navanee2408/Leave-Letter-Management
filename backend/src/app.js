import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { allowedOrigins, env } from './config/env.js'
import { requestLogger } from './middleware/requestLogger.js'
import { apiRateLimiter } from './middleware/rateLimiter.js'
import { notFoundHandler } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import apiRouter from './routes/index.js'

/**
 * Build the Express application. Keeping this in a factory makes the app
 * testable without opening a database connection or a fixed port.
 */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  if (env.isProduction) {
    // Trust the first reverse proxy so secure cookies and rate-limit client
    // addresses work correctly behind a deployment proxy.
    app.set('trust proxy', 1)
  }

  app.use(requestLogger)
  app.use(helmet())

  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header (health probes, curl, server-to-
        // server calls) are allowed. Browser origins must match CLIENT_URL.
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true)
        }

        return callback(null, false)
      },
      credentials: true,
    }),
  )

  app.use(apiRateLimiter)
  app.use(express.json({ limit: '10kb' }))
  app.use(express.urlencoded({ extended: true, limit: '10kb' }))
  app.use(cookieParser())

  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'College Leave Management API',
      health: '/api/v1/health',
    })
  })

  app.use('/api/v1', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export default createApp
