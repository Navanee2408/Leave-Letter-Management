import { Router } from 'express'
import { ROLES } from '../constants/index.js'
import {
  createHod,
  getHod,
  listHods,
  setHodStatus,
  updateHod,
} from '../controllers/hod.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRoles } from '../middleware/authorizeRoles.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.js'
import { idParamsSchema } from '../validators/common.validator.js'
import {
  createHodSchema,
  listHodsQuerySchema,
  updateHodSchema,
  updateHodStatusSchema,
} from '../validators/hod.validator.js'

const hodRouter = Router()

// Every HOD management operation is ADMIN-only. HODs cannot modify their own
// role, department, or account status through these routes.
hodRouter.use(authenticate, authorizeRoles(ROLES.ADMIN))

hodRouter.post('/', validateBody(createHodSchema), createHod)

hodRouter.get('/', validateQuery(listHodsQuerySchema), listHods)

hodRouter.patch(
  '/:id/status',
  validateParams(idParamsSchema),
  validateBody(updateHodStatusSchema),
  setHodStatus,
)

hodRouter.get('/:id', validateParams(idParamsSchema), getHod)

hodRouter.patch(
  '/:id',
  validateParams(idParamsSchema),
  validateBody(updateHodSchema),
  updateHod,
)

export default hodRouter
