import { z } from 'zod'
import { ACCOUNT_STATUS_VALUES } from '../constants/index.js'

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'A valid id is required')

export const idParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict()

export const accountStatusSchema = z.enum(ACCOUNT_STATUS_VALUES)

export const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}
