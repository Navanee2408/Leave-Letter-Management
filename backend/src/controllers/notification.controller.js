import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead as markAllNotificationsReadRecord,
  markNotificationRead as markNotificationReadRecord,
} from '../services/notification.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getMyNotifications = asyncHandler(async (req, res) => {
  const { notifications, pagination, unreadCount } = await listMyNotifications(
    req.validatedQuery,
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: { notifications, pagination, unreadCount },
  })
})

export const getMyUnreadNotificationCount = asyncHandler(async (req, res) => {
  const unreadCount = await getUnreadNotificationCount(req.user)

  res.status(200).json({
    success: true,
    message: 'Unread notification count retrieved successfully',
    data: { unreadCount },
  })
})

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { notification, unreadCount } = await markNotificationReadRecord(
    req.validatedParams.id,
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification, unreadCount },
  })
})

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const { modifiedCount, unreadCount } = await markAllNotificationsReadRecord(
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: { modifiedCount, unreadCount },
  })
})
