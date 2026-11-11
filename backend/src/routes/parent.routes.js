import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  addChild,
  createParent,
  getParent,
  listChildren,
  listMyChildren,
  listParents,
  removeChild,
  setParentStatus,
  updateParent,
} from '../controllers/parent.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeParentAccess } from '../middleware/authorizeParentAccess.js'
import { authorizeRoles } from '../middleware/authorizeRoles.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.js'
import { idParamsSchema } from '../validators/common.validator.js'
import {
  addChildSchema,
  createParentSchema,
  listChildrenQuerySchema,
  listParentsQuerySchema,
  parentChildParamsSchema,
  parentIdParamsSchema,
  updateParentSchema,
  updateParentStatusSchema,
} from '../validators/parent.validator.js'

const parentRouter = Router()

parentRouter.use(authenticate, requirePasswordChanged)

// Parent self-service route must be declared before the generic /:id route.
parentRouter.get(
  '/me/children',
  authorizeRoles(ROLES.PARENT),
  validateQuery(listChildrenQuerySchema),
  listMyChildren,
)

// A parent may read only their own children; ADMIN may read any parent's list.
parentRouter.get(
  '/:parentId/children',
  authorizeRoles(ROLES.ADMIN, ROLES.PARENT),
  validateParams(parentIdParamsSchema),
  authorizeParentAccess,
  validateQuery(listChildrenQuerySchema),
  listChildren,
)

parentRouter.post(
  '/:parentId/children',
  authorizeRoles(ROLES.ADMIN),
  validateParams(parentIdParamsSchema),
  validateBody(addChildSchema),
  addChild,
)

parentRouter.delete(
  '/:parentId/children/:studentId',
  authorizeRoles(ROLES.ADMIN),
  validateParams(parentChildParamsSchema),
  removeChild,
)

parentRouter.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validateBody(createParentSchema),
  createParent,
)

parentRouter.get(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validateQuery(listParentsQuerySchema),
  listParents,
)

parentRouter.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateParentStatusSchema),
  setParentStatus,
)

parentRouter.get(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  getParent,
)

parentRouter.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validateParams(idParamsSchema),
  validateBody(updateParentSchema),
  updateParent,
)

export default parentRouter
