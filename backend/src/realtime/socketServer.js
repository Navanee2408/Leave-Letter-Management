import mongoose from 'mongoose'
import { Server } from 'socket.io'
import { allowedOrigins } from '../config/env.js'
import { ACCOUNT_STATUS } from '../constants/index.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { verifyAccessToken } from '../services/token.service.js'

// One Socket.IO server per backend process. Tests create and close it around
// each ephemeral HTTP server.
let ioInstance = null

function userRoom(userId) {
  return `user:${String(userId)}`
}

async function unreadCountFor(userId) {
  return Notification.countDocuments({ recipient: userId, isRead: false })
}

/**
 * Authenticate a socket handshake using the same access-token verification as
 * the HTTP API. The token is read only from `handshake.auth.token`; URL query
 * parameters are never used. Roles and account status come from MongoDB.
 */
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token

    if (typeof token !== 'string' || !token.trim()) {
      return next(new Error('Authentication required'))
    }

    let payload

    try {
      payload = verifyAccessToken(token.trim())
    } catch {
      return next(new Error('Invalid or expired access token'))
    }

    if (!mongoose.isValidObjectId(payload.sub)) {
      return next(new Error('Invalid or expired access token'))
    }

    const user = await User.findById(payload.sub)

    if (!user) {
      return next(new Error('Invalid or expired access token'))
    }

    if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      return next(new Error('Account is inactive'))
    }

    socket.data.user = {
      id: user.id,
      role: user.role,
      department: user.department ? String(user.department) : null,
    }

    return next()
  } catch {
    // Never surface database or token internals to the client.
    return next(new Error('Authentication failed'))
  }
}

export function initializeRealtime(httpServer) {
  if (ioInstance) return ioInstance

  const io = new Server(httpServer, {
    serveClient: false,
    cors: {
      origin: [...allowedOrigins],
      credentials: true,
    },
  })

  io.use(authenticateSocket)

  io.on('connection', (socket) => {
    const userId = socket.data.user.id

    // The only room a connection may join is its own user room. There is
    // intentionally no client-controlled join or room event.
    socket.join(userRoom(userId))

    // Send the current unread count after the connection is established.
    unreadCountFor(userId)
      .then((unreadCount) => {
        if (socket.connected) {
          socket.emit('notification:unread-count', { unreadCount })
        }
      })
      .catch(() => {
        // A failed initial count must never terminate the socket.
      })
  })

  ioInstance = io
  return io
}

export function getRealtimeServer() {
  return ioInstance
}

/**
 * Emit a private event to exactly one authenticated user room. Safe to call
 * when Socket.IO is not running (for example during unit tests or before the
 * server starts).
 */
export function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return
  ioInstance.to(userRoom(userId)).emit(event, payload)
}

export async function closeRealtime() {
  if (!ioInstance) return

  const io = ioInstance
  ioInstance = null

  await new Promise((resolve) => {
    io.close(resolve)
  })
}
