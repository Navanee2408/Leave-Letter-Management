import 'dotenv/config'
import mongoose from 'mongoose'
import { setServers } from 'node:dns'

const READY_STATE_LABELS = Object.freeze({
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
})

/**
 * Return the real Mongoose connection state instead of a hard-coded value.
 */
export function getDatabaseStatus() {
  return READY_STATE_LABELS[mongoose.connection.readyState] ?? 'unknown'
}

/**
 * Remove anything that looks like a connection string before logging or
 * surfacing an error message. Credentials must never reach the logs.
 */
function redactSecrets(message = '', uri) {
  let safe = String(message)

  if (uri) {
    safe = safe.split(uri).join('[redacted]')
  }

  return safe.replace(/mongodb(\+srv)?:\/\/\S+/gi, '[redacted]')
}

/**
 * Connect to MongoDB Atlas using MONGODB_URI only. The server must not start
 * listening until this resolves.
 */
export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Copy .env.example to .env and set your MongoDB connection string.',
    )
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  mongoose.set('strictQuery', true)

  try {
    if (process.env.NODE_ENV !== 'production') {
    setServers(['8.8.8.8', '8.8.4.4'])
  }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
    })

    console.log('[database] MongoDB connected.')
    return mongoose.connection
  } catch (error) {
    const safeMessage = redactSecrets(error.message, uri)
    const connectionError = new Error(`MongoDB connection failed: ${safeMessage}`)
    connectionError.cause = error
    throw connectionError
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
}

mongoose.connection.on('error', (error) => {
  console.error(`[database] Connection error: ${redactSecrets(error.message)}`)
})

mongoose.connection.on('disconnected', () => {
  console.warn('[database] MongoDB disconnected.')
})
