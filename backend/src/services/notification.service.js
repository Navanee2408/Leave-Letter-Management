import {
  ACCOUNT_STATUS,
  NOTIFICATION_TYPES,
  ROLES,
} from '../constants/index.js'
import { Class } from '../models/Class.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { emitToUser } from '../realtime/socketServer.js'
import { AppError } from '../utils/AppError.js'

function entityId(value) {
  return String(value?._id ?? value)
}

function userId(user) {
  return String(user?._id ?? user?.id)
}

export async function getUnreadNotificationCount(user) {
  return Notification.countDocuments({
    recipient: userId(user),
    isRead: false,
  })
}

/**
 * Publish a persisted notification to the recipient's private room. Called only
 * after the database write has committed, so rolled-back operations never emit
 * events.
 */
export async function publishNotificationCreated(notification) {
  const unreadCount = await getUnreadNotificationCount({
    id: notification.recipient,
  })

  emitToUser(notification.recipient, 'notification:new', {
    notification,
    unreadCount,
  })
  emitToUser(notification.recipient, 'notification:unread-count', {
    unreadCount,
  })

  return unreadCount
}

/**
 * Generic notification writer. Phase 7 reuses this function for both REST and
 * Socket.IO delivery without changing how notifications are persisted.
 *
 * Pass `{ emit: false }` to persist a notification without publishing it yet;
 * callers can publish after a multi-step operation succeeds.
 */
export async function createNotification(data, options = {}) {
  const notification = await Notification.create({
    recipient: data.recipient,
    recipientRole: data.recipientRole,
    department: data.department,
    application: data.application,
    title: data.title,
    message: data.message,
    type: data.type,
    isRead: data.isRead ?? false,
  })

  if (options.emit !== false) {
    await publishNotificationCreated(notification)
  }

  return notification
}

function parentNotification(application) {
  return {
    recipient: entityId(application.parent),
    recipientRole: ROLES.PARENT,
    department: entityId(application.department),
    application: entityId(application),
  }
}

export async function notifyParentOfApproval(application, options = {}) {
  const comment = application.decisionComment
    ? ` Comment: ${application.decisionComment}`
    : ''

  return createNotification(
    {
      ...parentNotification(application),
      title: 'Leave application approved',
      message: `Your leave application ${application.applicationNumber} has been approved.${comment}`,
      type: NOTIFICATION_TYPES.LEAVE_APPROVED,
    },
    options,
  )
}

export async function notifyParentOfRejection(application, options = {}) {
  return createNotification(
    {
      ...parentNotification(application),
      title: 'Leave application rejected',
      message: `Your leave application ${application.applicationNumber} has been rejected. Reason: ${application.rejectionReason}`,
      type: NOTIFICATION_TYPES.LEAVE_REJECTED,
    },
    options,
  )
}

export async function notifyParentOfReopen(application, options = {}) {
  return createNotification(
    {
      ...parentNotification(application),
      title: 'Leave application reopened',
      message: `Your leave application ${application.applicationNumber} has been reopened for review. Reason: ${application.reopenReason}`,
      type: NOTIFICATION_TYPES.LEAVE_REOPENED,
    },
    options,
  )
}

/**
 * Notify only the tutor assigned to the application's class. The class record
 * is authoritative; no tutor list, class id, or department id from a client is
 * ever used here. Returns null when the class has no eligible assigned tutor.
 */
export async function notifyTutorOfApproval(application, options = {}) {
  const classDocument = await Class.findById(entityId(application.class)).select(
    'assignedTutor department',
  )

  if (!classDocument?.assignedTutor) return null

  const tutor = await User.findOne({
    _id: classDocument.assignedTutor,
    role: ROLES.TUTOR,
    department: classDocument.department,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  }).select('_id')

  if (!tutor) return null

  return createNotification(
    {
      recipient: tutor._id,
      recipientRole: ROLES.TUTOR,
      department: classDocument.department,
      application: entityId(application),
      title: 'Student leave approved',
      message: `A leave application (${application.applicationNumber}) for a student in your class has been approved.`,
      type: NOTIFICATION_TYPES.LEAVE_APPROVED,
    },
    options,
  )
}

/**
 * Inbox reads always filter by the authenticated database user. A recipient id
 * supplied by the client is never used.
 */
export async function listMyNotifications(query, user) {
  const recipient = userId(user)
  const filter = { recipient }

  if (typeof query.isRead === 'boolean') filter.isRead = query.isRead
  if (query.type) filter.type = query.type

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Notification.countDocuments(filter),
    getUnreadNotificationCount(user),
  ])

  return {
    notifications,
    unreadCount,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export async function markNotificationRead(id, user) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId(user) },
    { $set: { isRead: true } },
    { returnDocument: 'after' },
  )

  if (!notification) {
    // A notification belonging to another user is treated as not found so the
    // API never confirms that it exists.
    throw new AppError('Notification not found', 404)
  }

  const unreadCount = await getUnreadNotificationCount(user)

  emitToUser(notification.recipient, 'notification:read', {
    notificationId: notification.id,
    isRead: true,
    unreadCount,
  })
  emitToUser(notification.recipient, 'notification:unread-count', {
    unreadCount,
  })

  return { notification, unreadCount }
}

export async function markAllNotificationsRead(user) {
  const result = await Notification.updateMany(
    { recipient: userId(user), isRead: false },
    { $set: { isRead: true } },
  )

  emitToUser(userId(user), 'notification:read', {
    notificationId: null,
    all: true,
    isRead: true,
    unreadCount: 0,
  })
  emitToUser(userId(user), 'notification:unread-count', { unreadCount: 0 })

  return {
    modifiedCount: result.modifiedCount,
    unreadCount: 0,
  }
}
