import { Router } from 'express'
import authRouter from './auth.routes.js'
import classRouter from './class.routes.js'
import departmentRouter from './department.routes.js'
import healthRouter from './health.routes.js'
import hodRouter from './hod.routes.js'
import leaveApplicationRouter from './leaveApplication.routes.js'
import notificationRouter from './notification.routes.js'
import parentRouter from './parent.routes.js'
import studentRouter from './student.routes.js'
import tutorRouter from './tutor.routes.js'

const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/departments', departmentRouter)
apiRouter.use('/hods', hodRouter)
apiRouter.use('/classes', classRouter)
apiRouter.use('/tutors', tutorRouter)
apiRouter.use('/students', studentRouter)
apiRouter.use('/parents', parentRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/leave-applications', leaveApplicationRouter)

export default apiRouter
