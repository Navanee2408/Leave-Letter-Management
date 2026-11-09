import { io } from 'socket.io-client'
import { getAccessToken } from './client.js'

let socket = null
const listeners = {
  newNotification: new Set(),
  unreadCount: new Set(),
  notificationRead: new Set(),
}

export function getSocket() {
  return socket
}

export function connectSocket(overrideToken = null) {
  const token = overrideToken || getAccessToken()
  if (!token) return null

  if (socket) {
    if (socket.connected) return socket
    socket.auth = { token }
    socket.connect()
    return socket
  }

  const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin

  socket = io(socketUrl, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  socket.on('notification:new', (payload) => {
    listeners.newNotification.forEach((fn) => {
      try {
        fn(payload)
      } catch {
        // Listener safety
      }
    })
  })

  socket.on('notification:unread-count', (payload) => {
    listeners.unreadCount.forEach((fn) => {
      try {
        fn(payload)
      } catch {
        // Listener safety
      }
    })
  })

  socket.on('notification:read', (payload) => {
    listeners.notificationRead.forEach((fn) => {
      try {
        fn(payload)
      } catch {
        // Listener safety
      }
    })
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function onNewNotification(handler) {
  listeners.newNotification.add(handler)
  return () => listeners.newNotification.delete(handler)
}

export function onUnreadCount(handler) {
  listeners.unreadCount.add(handler)
  return () => listeners.unreadCount.delete(handler)
}

export function onNotificationRead(handler) {
  listeners.notificationRead.add(handler)
  return () => listeners.notificationRead.delete(handler)
}
