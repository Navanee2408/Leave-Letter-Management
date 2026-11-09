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
