import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  createStudent,
  getStudent,
  listStudents,
  setStudentStatus,
  updateStudent,
} from '../controllers/student.controller.js'
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
  createStudentSchema,
  listStudentsQuerySchema,
  updateStudentSchema,
  updateStudentStatusSchema,
} from '../validators/student.validator.js'

const studentRouter = Router()

studentRouter.use(authenticate, requirePasswordChanged)

studentRouter.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validateBody(createStudentSchema),
  createStudent,
)

studentRouter.get(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.TUTOR, ROLES.PARENT),
  validateQuery(listStudentsQuerySchema),
  listStudents,
)

studentRouter.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateStudentStatusSchema),
  setStudentStatus,
)

studentRouter.get(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.TUTOR, ROLES.PARENT),
  validateParams(idParamsSchema),
  getStudent,
)

studentRouter.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateStudentSchema),
  updateStudent,
)

export default studentRouter
