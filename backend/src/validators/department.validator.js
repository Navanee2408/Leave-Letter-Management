import { z } from 'zod'
import {
  accountStatusSchema,
  paginationFields,
} from './common.validator.js'

const departmentNameSchema = z
  .string()
  .trim()
  .min(1, 'Department name is required')
  .max(120, 'Department name must be 120 characters or fewer')
  .transform((value) => value.replace(/\s+/g, ' '))

const departmentCodeSchema = z
  .string()
  .trim()
  .min(2, 'Department code must be at least 2 characters')
  .max(20, 'Department code must be 20 characters or fewer')
  .regex(
    /^[A-Za-z0-9_-]+$/,
    'Department code may only contain letters, numbers, hyphens, and underscores',
  )
  .transform((value) => value.toUpperCase())

const descriptionSchema = z
  .string()
  .trim()
  .max(500, 'Description must be 500 characters or fewer')

export const createDepartmentSchema = z
  .object({
    name: departmentNameSchema,
    code: departmentCodeSchema,
    description: descriptionSchema.optional(),
    status: accountStatusSchema.optional(),
  })
  .strict()

export const updateDepartmentSchema = z
  .object({
    name: departmentNameSchema.optional(),
    code: departmentCodeSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const updateDepartmentStatusSchema = z
  .object({
    status: accountStatusSchema,
  })
  .strict()

export const listDepartmentsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: accountStatusSchema.optional(),
    ...paginationFields,
  })
  .strict()
