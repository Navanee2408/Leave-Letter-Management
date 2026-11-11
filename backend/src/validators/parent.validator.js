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

function emptyToUndefined(value) {
  if (value === null) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

export const createParentSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
    address: z
      .string()
      .trim()
      .max(300, 'Address must be 300 characters or fewer')
      .optional(),
    accountStatus: accountStatusSchema.optional(),
    studentId: z.preprocess(emptyToUndefined, objectIdSchema.optional()),
    registerNumber: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .min(1, 'Student register number cannot be empty')
        .max(60, 'Register number must be 60 characters or fewer')
        .optional(),
    ),
    relationship: z.preprocess(
      emptyToUndefined,
      z.enum(RELATIONSHIP_TYPE_VALUES).optional(),
    ),
  })
  .strict()

export const updateParentSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    address: z
      .string()
      .trim()
      .max(300, 'Address must be 300 characters or fewer')
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const updateParentStatusSchema = z
  .object({
    status: accountStatusSchema,
  })
  .strict()

export const listParentsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: accountStatusSchema.optional(),
    ...paginationFields,
  })
  .strict()

export const parentIdParamsSchema = z
  .object({
    parentId: objectIdSchema,
  })
  .strict()

export const parentChildParamsSchema = z
  .object({
    parentId: objectIdSchema,
    studentId: objectIdSchema,
  })
  .strict()

export const addChildSchema = z
  .object({
    studentId: objectIdSchema,
    relationship: z.enum(RELATIONSHIP_TYPE_VALUES),
  })
  .strict()

export const listChildrenQuerySchema = z
  .object({
    ...paginationFields,
  })
  .strict()
