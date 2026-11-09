import { pathToFileURL } from 'node:url'
import { connectDatabase, disconnectDatabase } from '../src/config/db.js'
import { ACCOUNT_STATUS } from '../src/constants/index.js'
import { Department } from '../src/models/Department.js'
import { isDuplicateKeyError } from '../src/utils/databaseErrors.js'

export const INITIAL_DEPARTMENTS = Object.freeze([
  {
    name: 'Computer Science and Engineering',
    code: 'CSE',
    description: 'Computer Science and Engineering',
  },
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'Information Technology',
  },
  {
    name: 'Electronics and Communication Engineering',
    code: 'ECE',
    description: 'Electronics and Communication Engineering',
  },
  {
    name: 'Mechanical Engineering',
    code: 'MECH',
    description: 'Mechanical Engineering',
  },
  {
    name: 'Master of Computer Applications',
    code: 'MCA',
    description: 'Master of Computer Applications',
  },
])

/**
 * Create the five initial departments only when they are missing. Existing
 * records are never overwritten, so running the script repeatedly is safe and
 * administrator edits are preserved.
 */
export async function seedInitialDepartments({ logger = console } = {}) {
  let created = 0
  let skipped = 0

  for (const department of INITIAL_DEPARTMENTS) {
    const existing = await Department.findOne({
      $or: [
        { code: department.code },
        { nameKey: department.name.toLowerCase() },
      ],
    })

    if (existing) {
      skipped += 1
      logger.log(`[seed] Department ${department.code} already exists. Skipped.`)
      continue
    }

    try {
      await Department.create({
        ...department,
        status: ACCOUNT_STATUS.ACTIVE,
      })
      created += 1
      logger.log(`[seed] Department ${department.code} created.`)
    } catch (error) {
      // A concurrent run may have inserted the department after the check.
      if (isDuplicateKeyError(error)) {
        skipped += 1
        logger.log(
          `[seed] Department ${department.code} already exists. Skipped.`,
        )
        continue
      }

      throw error
    }
  }

  return { created, skipped }
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error(
      '[seed] MONGODB_URI is required to seed departments. Set it in .env or the environment.',
    )
    process.exitCode = 1
    return
  }

  await connectDatabase(process.env.MONGODB_URI)

  try {
    const { created, skipped } = await seedInitialDepartments()
    console.log(
      `[seed] Department seed complete. Created: ${created}, skipped: ${skipped}.`,
    )
  } finally {
    await disconnectDatabase()
  }
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  main().catch((error) => {
    console.error(`[seed] Failed: ${error.message}`)
    process.exitCode = 1
  })
}
