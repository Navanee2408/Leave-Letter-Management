import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  approveLeaveApplication,
  createLeaveApplication,
  downloadLeaveApplicationDocument,
  getLeaveApplication,
  getLeaveApplicationHistory,
  listLeaveApplications,
  listMyLeaveApplications,
  rejectLeaveApplication,
  reopenLeaveApplication,
} from '../controllers/leaveApplication.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRoles } from '../middleware/authorizeRoles.js'
import { uploadSupportingDocument } from '../middleware/uploadSupportingDocument.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.js'
import { idParamsSchema } from '../validators/common.validator.js'
import {
  approveLeaveApplicationSchema,
  createLeaveApplicationSchema,
  listLeaveApplicationsQuerySchema,
  rejectLeaveApplicationSchema,
  reopenLeaveApplicationSchema,
} from '../validators/leaveApplication.validator.js'

const leaveApplicationRouter = Router()

leaveApplicationRouter.use(authenticate)

leaveApplicationRouter.post(
  '/',
  authorizeRoles(ROLES.PARENT),
  uploadSupportingDocument,
  validateBody(createLeaveApplicationSchema),
  createLeaveApplication,
)

// Self-service and nested routes must be declared before the generic /:id.
leaveApplicationRouter.get(
  '/my',
  authorizeRoles(ROLES.PARENT),
  validateQuery(listLeaveApplicationsQuerySchema),
  listMyLeaveApplications,
)

leaveApplicationRouter.get(
  '/:id/history',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.PARENT),
  validateParams(idParamsSchema),
  getLeaveApplicationHistory,
)

leaveApplicationRouter.get(
  '/:id/document',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.PARENT),
  validateParams(idParamsSchema),
  downloadLeaveApplicationDocument,
)

leaveApplicationRouter.get(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.PARENT),
  validateQuery(listLeaveApplicationsQuerySchema),
  listLeaveApplications,
)

// HOD-only workflow decisions. These never accept actor, status, or department
// from the client; all of that comes from the authenticated database account.
leaveApplicationRouter.post(
  '/:id/approve',
  authorizeRoles(ROLES.HOD),
  validateParams(idParamsSchema),
  validateBody(approveLeaveApplicationSchema),
  approveLeaveApplication,
)

leaveApplicationRouter.post(
  '/:id/reject',
  authorizeRoles(ROLES.HOD),
  validateParams(idParamsSchema),
  validateBody(rejectLeaveApplicationSchema),
  rejectLeaveApplication,
)

leaveApplicationRouter.post(
  '/:id/reopen',
  authorizeRoles(ROLES.HOD),
  validateParams(idParamsSchema),
  validateBody(reopenLeaveApplicationSchema),
  reopenLeaveApplication,
)

leaveApplicationRouter.get(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.HOD, ROLES.PARENT),
  validateParams(idParamsSchema),
  getLeaveApplication,
)

// There is intentionally no generic PATCH or DELETE route. Parents cannot
// modify a submitted application, and only the HOD decision routes above may
// change status.

export default leaveApplicationRouter
