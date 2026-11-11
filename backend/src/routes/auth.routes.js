import { Router } from 'express'
import {
  changePassword,
  getMe,
  login,
  logout,
  refresh,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { loginRateLimiter } from '../middleware/rateLimiter.js'
import { validateBody } from '../middleware/validate.js'
import {
  changePasswordSchema,
  loginSchema,
} from '../validators/auth.validator.js'

const authRouter = Router()

// Auth responses contain tokens or account data and must never be cached.
authRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// Public routes. There is intentionally no registration endpoint.
authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), login)
authRouter.post('/logout', logout)
authRouter.post('/refresh', refresh)

// Protected routes.
authRouter.get('/me', authenticate, getMe)
authRouter.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  changePassword,
)

export default authRouter
