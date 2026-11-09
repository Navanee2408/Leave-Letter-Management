import { z } from 'zod'
import { connectDatabase, disconnectDatabase } from '../src/config/db.js'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { User } from '../src/models/User.js'

const seedEnvSchema = z.object({
  ADMIN_NAME: z
    .string()
    .trim()
    .min(1, 'ADMIN_NAME must not be empty')
    .default('Initial Administrator'),
  ADMIN_EMAIL: z.string().trim().toLowerCase().email('ADMIN_EMAIL must be valid'),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters')
    .max(128, 'ADMIN_PASSWORD must be 128 characters or fewer'),
  MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
})

/**
 * Development-only bootstrap for the first administrator. It never runs during
 * normal server startup and never creates HOD, tutor, or parent accounts.
 */
async function seedAdmin() {
  const parsed = seedEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('[seed] Invalid admin seed configuration:')

    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }

    process.exitCode = 1
    return
  }

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = parsed.data

  if (ADMIN_PASSWORD.startsWith('replace_with_')) {
    console.error(
      '[seed] ADMIN_PASSWORD is still the example placeholder. Set a strong password in .env.',
    )
    process.exitCode = 1
    return
  }

  await connectDatabase(MONGODB_URI)

  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL })

    if (existing) {
      console.log(
        `[seed] An account with ${ADMIN_EMAIL} already exists. No changes made.`,
      )
      return
    }

    await User.create({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: ROLES.ADMIN,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    })

    console.log(`[seed] Admin account created for ${ADMIN_EMAIL}.`)
  } finally {
    await disconnectDatabase()
  }
}

seedAdmin().catch((error) => {
  console.error(`[seed] Failed: ${error.message}`)
  process.exitCode = 1
})
