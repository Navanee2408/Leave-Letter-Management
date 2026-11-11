import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  createTutor,
  getMyApprovedLeaves,
  getMyClasses,
  getMyStudents,
  getTutor,
  listTutors,
  setTutorStatus,
  updateTutor,
} from '../controllers/tutor.controller.js'
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
  createTutorSchema,
  listTutorsQuerySchema,
  updateTutorSchema,
  updateTutorStatusSchema,
} from '../validators/tutor.validator.js'
import { tutorApprovedLeavesQuerySchema } from '../validators/leaveApplication.validator.js'

const tutorRouter = Router()

tutorRouter.use(authenticate, requirePasswordChanged)

// Tutor self-service routes must be declared before the generic /:id route.
tutorRouter.get(
  '/me/classes',
  authorizeRoles(ROLES.TUTOR),
  getMyClasses,
)

tutorRouter.get(
  '/me/students',
  authorizeRoles(ROLES.TUTOR),
  getMyStudents,
)

tutorRouter.get(
  '/me/approved-leaves',
  authorizeRoles(ROLES.TUTOR),
  validateQuery(tutorApprovedLeavesQuerySchema),
  getMyApprovedLeaves,
)

tutorRouter.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validateBody(createTutorSchema),
  createTutor,
)

tutorRouter.get(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD),
  validateQuery(listTutorsQuerySchema),
  listTutors,
)

tutorRouter.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateTutorStatusSchema),
  setTutorStatus,
)

tutorRouter.get(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD),
  validateParams(idParamsSchema),
  getTutor,
)

tutorRouter.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateTutorSchema),
  updateTutor,
)

export default tutorRouter
