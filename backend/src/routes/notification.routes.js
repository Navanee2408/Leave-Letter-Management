import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notification.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRoles } from '../middleware/authorizeRoles.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.js'
import { idParamsSchema } from '../validators/common.validator.js'
import {
  emptyBodySchema,
  emptyQuerySchema,
  listMyNotificationsQuerySchema,
} from '../validators/notification.validator.js'

const notificationRouter = Router()

notificationRouter.use(authenticate, requirePasswordChanged)
notificationRouter.use(
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.TUTOR, ROLES.PARENT),
)

notificationRouter.get(
  '/my',
  validateQuery(listMyNotificationsQuerySchema),
  getMyNotifications,
)

notificationRouter.get(
  '/unread-count',
  validateQuery(emptyQuerySchema),
  getMyUnreadNotificationCount,
)

notificationRouter.patch(
  '/read-all',
  validateQuery(emptyQuerySchema),
  validateBody(emptyBodySchema),
  markAllNotificationsRead,
)

notificationRouter.patch(
  '/:id/read',
  validateParams(idParamsSchema),
  validateQuery(emptyQuerySchema),
  validateBody(emptyBodySchema),
  markNotificationRead,
)

export default notificationRouter
