import { z } from 'zod'
import { todayISO } from '../lib/date.js'

function isISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export const leaveApplicationSchema = z
  .object({
    studentId: z.string().min(1, 'Select the child this application is for.'),
    leaveType: z.string().min(1, 'Select a leave type.'),
    fromDate: z.string().min(1, 'Select the first day of leave.'),
    toDate: z.string().min(1, 'Select the last day of leave.'),
    reason: z
      .string()
      .trim()
      .min(20, 'Please provide at least 20 characters so the HOD can review the request.')
      .max(500, 'Reason must be 500 characters or fewer.'),
  })
  .superRefine((values, context) => {
    const validFrom = isISODate(values.fromDate)
    const validTo = isISODate(values.toDate)
    if (validFrom && validTo && values.toDate < values.fromDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toDate'],
        message: 'To date must be on or after From date.',
      })
    }
    if (values.fromDate && !validFrom) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fromDate'],
        message: 'Select a valid From date.',
      })
    }
    if (values.toDate && !validTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toDate'],
        message: 'Select a valid To date.',
      })
    }
    if (validFrom && values.fromDate < todayISO()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fromDate'],
        message: 'From date cannot be in the past.',
      })
    }
    if (validTo && values.toDate < todayISO()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toDate'],
        message: 'To date cannot be in the past.',
      })
    }
  })