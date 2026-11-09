import { z } from 'zod'
import {
  LEAVE_STATUS_VALUES,
  LEAVE_TYPE_VALUES,
} from '../constants/index.js'
import {
  objectIdSchema,
  paginationFields,
} from './common.validator.js'

const dateSchema = z.coerce.date()

export const createLeaveApplicationSchema = z
  .object({
    studentId: objectIdSchema,
    leaveType: z.enum(LEAVE_TYPE_VALUES),
    fromDate: dateSchema,
    toDate: dateSchema,
    reason: z
      .string()
      .trim()
      .min(5, 'Reason must be at least 5 characters')
      .max(1000, 'Reason must be 1000 characters or fewer'),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.toDate < data.fromDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['toDate'],
        message: 'To date must be on or after from date',
      })
    }
  })

export const listLeaveApplicationsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: z.enum(LEAVE_STATUS_VALUES).optional(),
    studentId: objectIdSchema.optional(),
    classId: objectIdSchema.optional(),
    department: objectIdSchema.optional(),
    fromDate: dateSchema.optional(),
    toDate: dateSchema.optional(),
    ...paginationFields,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.fromDate && data.toDate && data.toDate < data.fromDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['toDate'],
        message: 'To date must be on or after from date',
      })
    }
  })

export const approveLeaveApplicationSchema = z
  .object({
    comment: z
      .string()
      .trim()
      .max(1000, 'Comment must be 1000 characters or fewer')
      .optional(),
  })
  .strict()
  .default({})

export const rejectLeaveApplicationSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, 'Rejection reason is required')
      .max(1000, 'Rejection reason must be 1000 characters or fewer'),
  })
  .strict()

export const reopenLeaveApplicationSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, 'Reopening reason is required')
      .max(1000, 'Reopening reason must be 1000 characters or fewer'),
  })
  .strict()

export const tutorApprovedLeavesQuerySchema = z
  .object({
    ...paginationFields,
  })
  .strict()
