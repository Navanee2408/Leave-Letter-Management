import { z } from 'zod'
import { NOTIFICATION_TYPE_VALUES } from '../constants/index.js'
import { paginationFields } from './common.validator.js'

export const listMyNotificationsQuerySchema = z
  .object({
    ...paginationFields,
    isRead: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    type: z.enum(NOTIFICATION_TYPE_VALUES).optional(),
  })
  .strict()

export const emptyBodySchema = z.object({}).strict().default({})
export const emptyQuerySchema = z.object({}).strict()
