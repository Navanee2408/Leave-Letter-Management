import { z } from 'zod'

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'Email must be 254 characters or fewer')
      .email('A valid email address is required'),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128, 'Password must be 128 characters or fewer'),
  })
  .strict()

export const strongPasswordSchema = z
  .string({ required_error: 'New password is required' })
  .min(8, 'New password must be at least 8 characters long')
  .max(128, 'New password must be 128 characters or fewer')
  .regex(/[A-Z]/, 'New password must include at least one uppercase letter')
  .regex(/[a-z]/, 'New password must include at least one lowercase letter')
  .regex(/[0-9]/, 'New password must include at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'New password must include at least one special character',
  )

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required')
      .max(128, 'Current password must be 128 characters or fewer'),
    newPassword: strongPasswordSchema,
    confirmPassword: z
      .string({ required_error: 'Please confirm your new password' })
      .min(1, 'Please confirm your new password')
      .max(128, 'Confirm password must be 128 characters or fewer'),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Confirm password must match the new password',
      })
    }

    if (data.currentPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'New password must be different from your current password',
      })
    }
  })
