import { z } from 'zod'
import {
  accountStatusSchema,
  objectIdSchema,
  paginationFields,
} from './common.validator.js'

const textField = (label, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => value.replace(/\s+/g, ' '))

const shortField = (label) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .max(20, `${label} must be 20 characters or fewer`),
    )

const tutorIdSchema = objectIdSchema.nullable().optional()

export const createClassSchema = z
  .object({
    className: textField('Class name'),
    year: shortField('Year'),
    section: shortField('Section'),
    department: objectIdSchema,
    assignedTutor: tutorIdSchema,
  })
  .strict()

export const updateClassSchema = z
  .object({
    className: textField('Class name').optional(),
    year: shortField('Year').optional(),
    section: shortField('Section').optional(),
    department: objectIdSchema.optional(),
    assignedTutor: tutorIdSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const updateClassStatusSchema = z
  .object({
    status: accountStatusSchema,
  })
  .strict()

export const listClassesQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: accountStatusSchema.optional(),
    department: objectIdSchema.optional(),
    ...paginationFields,
  })
  .strict()
