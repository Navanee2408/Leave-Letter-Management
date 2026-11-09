import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  createDepartment,
  getDepartment,
  getDepartmentHod,
  listDepartments,
  setDepartmentStatus,
  updateDepartment,
} from '../controllers/department.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeDepartmentAccess } from '../middleware/authorizeDepartmentAccess.js'
import { authorizeRoles } from '../middleware/authorizeRoles.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.js'
import {
  createDepartmentSchema,
  listDepartmentsQuerySchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
} from '../validators/department.validator.js'
import { idParamsSchema } from '../validators/common.validator.js'

const departmentRouter = Router()

departmentRouter.use(authenticate)

// Administration: ADMIN only.
departmentRouter.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validateBody(createDepartmentSchema),
  createDepartment,
)

departmentRouter.get(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validateQuery(listDepartmentsQuerySchema),
  listDepartments,
)

departmentRouter.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateDepartmentStatusSchema),
  setDepartmentStatus,
)

// Detail reads: ADMIN may read any department; an HOD may read only their own.
departmentRouter.get(
  '/:id/hod',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD),
  validateParams(idParamsSchema),
  authorizeDepartmentAccess,
  getDepartmentHod,
)

departmentRouter.get(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD),
  validateParams(idParamsSchema),
  authorizeDepartmentAccess,
  getDepartment,
)

departmentRouter.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateDepartmentSchema),
  updateDepartment,
)

// There is intentionally no DELETE route. Departments are deactivated through
// PATCH /:id/status so linked users and historical records are preserved.

export default departmentRouter
