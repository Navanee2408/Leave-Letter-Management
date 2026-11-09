import { z } from 'zod'
import {
  accountStatusSchema,
  objectIdSchema,
  paginationFields,
} from './common.validator.js'

const fullNameSchema = z
  .string()
  .trim()
  .min(1, 'Full name is required')
  .max(120, 'Full name must be 120 characters or fewer')
  .transform((value) => value.replace(/\s+/g, ' '))

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email must be 254 characters or fewer')
  .email('A valid email address is required')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or fewer')

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number must not be empty')
  .max(30, 'Phone number must be 30 characters or fewer')

const employeeIdSchema = z
  .string()
  .trim()
  .min(1, 'Employee ID must not be empty')
  .max(50, 'Employee ID must be 50 characters or fewer')
  .transform((value) => value.toUpperCase())

const departmentIdSchema = objectIdSchema

export const createHodSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
    employeeId: employeeIdSchema.optional(),
    department: departmentIdSchema,
  })
  .strict()

export const updateHodSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    employeeId: employeeIdSchema.optional(),
    department: departmentIdSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const updateHodStatusSchema = z
  .object({
    status: accountStatusSchema,
  })
  .strict()

export const listHodsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: accountStatusSchema.optional(),
    department: objectIdSchema.optional(),
    ...paginationFields,
  })
  .strict()
