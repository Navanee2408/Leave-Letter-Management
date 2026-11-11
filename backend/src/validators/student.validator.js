import { z } from 'zod'
import { RELATIONSHIP_TYPE_VALUES } from '../constants/index.js'
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

const registerNumberSchema = z
  .string()
  .trim()
  .min(1, 'Register number is required')
  .max(50, 'Register number must be 50 characters or fewer')
  .transform((value) => value.toUpperCase())

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email must be 254 characters or fewer')
  .email('A valid email address is required')

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number must not be empty')
  .max(30, 'Phone number must be 30 characters or fewer')

function emptyToUndefined(value) {
  if (value === null) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

function emptyToNull(value) {
  if (typeof value === 'string' && value.trim() === '') return null
  return value
}

export const createStudentSchema = z
  .object({
    fullName: fullNameSchema,
    registerNumber: registerNumberSchema,
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    department: objectIdSchema,
    class: objectIdSchema,
    parentId: z.preprocess(emptyToUndefined, objectIdSchema.optional()),
    relationship: z.preprocess(
      emptyToUndefined,
      z.enum(RELATIONSHIP_TYPE_VALUES).optional(),
    ),
  })
  .strict()

export const updateStudentSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    registerNumber: registerNumberSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    department: objectIdSchema.optional(),
    class: objectIdSchema.optional(),
    parentId: z.preprocess(emptyToNull, objectIdSchema.nullable().optional()),
    relationship: z.preprocess(
      emptyToUndefined,
      z.enum(RELATIONSHIP_TYPE_VALUES).optional(),
    ),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const updateStudentStatusSchema = z
  .object({
    status: accountStatusSchema,
  })
  .strict()

export const listStudentsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: accountStatusSchema.optional(),
    department: objectIdSchema.optional(),
    class: objectIdSchema.optional(),
    ...paginationFields,
  })
  .strict()
