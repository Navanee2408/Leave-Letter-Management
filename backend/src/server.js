import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/db.js'
import { env } from './config/env.js'
import { closeRealtime, initializeRealtime } from './realtime/socketServer.js'

async function startServer() {
  try {
    // Do not listen for traffic until MongoDB is reachable.
    await connectDatabase(env.mongoUri)
  } catch (error) {
    console.error(`[startup] ${error.message}`)
    process.exit(1)
  }

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(
      `[server] Listening on http://localhost:${env.port} (${env.nodeEnv}).`,
    )
  })

  // Socket.IO shares the existing HTTP server and CORS origins.
  initializeRealtime(server)

  server.on('error', (error) => {
    console.error(`[server] Failed to start: ${error.message}`)
    process.exit(1)
  })

  let shuttingDown = false

  async function shutdown(signal) {
    if (shuttingDown) return

    shuttingDown = true
    console.log(`[server] ${signal} received. Shutting down gracefully...`)

    // Close Socket.IO clients before the HTTP server.
    try {
      await closeRealtime()
    } catch (error) {
      console.error(`[server] Socket.IO shutdown failed: ${error.message}`)
    }

    server.close(async () => {
      try {
        await disconnectDatabase()
      } catch (error) {
        console.error(`[server] Database disconnect failed: ${error.message}`)
      } finally {
        process.exit(0)
      }
    })

    // Do not let a stuck connection keep the process alive indefinitely.
    setTimeout(() => {
      console.error('[server] Graceful shutdown timed out. Forcing exit.')
      process.exit(1)
    }, 10_000).unref()
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason)
  console.error(`[process] Unhandled rejection: ${message}`)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error(`[process] Uncaught exception: ${error.message}`)
  process.exit(1)
})

startServer()
