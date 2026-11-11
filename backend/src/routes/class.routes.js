import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  createClass,
  getClass,
  listClasses,
  setClassStatus,
  updateClass,
} from '../controllers/class.controller.js'
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
  createClassSchema,
  listClassesQuerySchema,
  updateClassSchema,
  updateClassStatusSchema,
} from '../validators/class.validator.js'

const classRouter = Router()

classRouter.use(authenticate, requirePasswordChanged)

classRouter.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validateBody(createClassSchema),
  createClass,
)

classRouter.get(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.TUTOR),
  validateQuery(listClassesQuerySchema),
  listClasses,
)

classRouter.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateClassStatusSchema),
  setClassStatus,
)

classRouter.get(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.TUTOR),
  validateParams(idParamsSchema),
  getClass,
)

classRouter.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateClassSchema),
  updateClass,
)

// There is intentionally no DELETE route. Classes are deactivated instead, so
// linked students and historical records are never orphaned.

export default classRouter
