import { pathToFileURL } from 'node:url'
import { connectDatabase, disconnectDatabase } from '../src/config/db.js'
import { ACCOUNT_STATUS, RELATIONSHIP_TYPES, ROLES } from '../src/constants/index.js'
import { Class } from '../src/models/Class.js'
import { Department } from '../src/models/Department.js'
import { ParentStudent } from '../src/models/ParentStudent.js'
import { Student } from '../src/models/Student.js'
import { User } from '../src/models/User.js'
import { isDuplicateKeyError } from '../src/utils/databaseErrors.js'
import { INITIAL_DEPARTMENTS, seedInitialDepartments } from './seedDepartments.js'

export const DEV_TUTOR_PASSWORD = 'Tutor@12345'
export const DEV_PARENT_PASSWORD = 'Parent@12345'

const TUTOR_NAMES = {
  CSE: ['Dr. Aarthi Raman', 'Prof. Vikram Nair'],
  IT: ['Dr. Meera Iyer', 'Prof. Sanjay Verma'],
  ECE: ['Dr. Kavita Menon', 'Prof. Arjun Rao'],
  MECH: ['Dr. Ramesh Pillai', 'Prof. Neha Kulkarni'],
  MCA: ['Dr. Priya Deshmukh', 'Prof. Karthik Reddy'],
}

const STUDENT_NAMES = {
  CSE: ['Ananya Sharma', 'Rohan Gupta', 'Sneha Patel', 'Aditya Singh'],
  IT: ['Isha Nair', 'Rahul Joshi', 'Pooja Mehta', 'Nikhil Rao'],
  ECE: ['Divya Krishnan', 'Aman Verma', 'Riya Sen', 'Harsh Vardhan'],
  MECH: ['Suresh Kumar', 'Anjali Das', 'Manish Yadav', 'Keerthi Balan'],
  MCA: ['Swati Mishra', 'Varun Kapoor', 'Nandini Pillai', 'Yash Thakur'],
}

const PARENT_NAMES = {
  CSE: ['Rajesh Sharma', 'Sunita Sharma', 'Vikas Gupta', 'Anita Patel'],
  IT: ['Mohan Nair', 'Latha Nair', 'Deepak Joshi', 'Kavya Mehta'],
  ECE: ['Ravi Krishnan', 'Shobha Krishnan', 'Ajay Verma', 'Rekha Sen'],
  MECH: ['Prakash Kumar', 'Lakshmi Das', 'Ramesh Yadav', 'Geetha Balan'],
  MCA: ['Ashok Mishra', 'Vandana Mishra', 'Suresh Kapoor', 'Bhavani Pillai'],
}

function classDefinitions(code) {
  return [
    { className: `${code}-A`, year: '3', section: 'A' },
    { className: `${code}-B`, year: '3', section: 'B' },
  ]
}

async function ensureClass(department, definition, logger) {
  const existing = await Class.findOne({
    department: department._id,
    classNameKey: definition.className.toLowerCase(),
  })

  if (existing) {
    logger.log(`[seed] Class ${definition.className} already exists. Skipped.`)
    return { classDocument: existing, created: false }
  }

  try {
    const classDocument = await Class.create({
      ...definition,
      department: department._id,
      status: ACCOUNT_STATUS.ACTIVE,
    })

    logger.log(`[seed] Class ${definition.className} created.`)
    return { classDocument, created: true }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const classDocument = await Class.findOne({
        department: department._id,
        classNameKey: definition.className.toLowerCase(),
      })

      if (classDocument) {
        logger.log(
          `[seed] Class ${definition.className} already exists. Skipped.`,
        )
        return { classDocument, created: false }
      }
    }

    throw error
  }
}

async function ensureTutor(department, code, index, logger) {
  const email = `tutor.${code.toLowerCase()}.${index + 1}@example.test`
  const existing = await User.findOne({ email })

  if (existing) {
    logger.log(`[seed] Tutor ${email} already exists. Skipped.`)
    return { tutor: existing, created: false }
  }

  try {
    const tutor = await User.create({
      fullName: TUTOR_NAMES[code][index],
      email,
      password: DEV_TUTOR_PASSWORD,
      role: ROLES.TUTOR,
      employeeId: `TUT-${code}-${String(index + 1).padStart(2, '0')}`,
      department: department._id,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    })

    logger.log(`[seed] Tutor ${email} created.`)
    return { tutor, created: true }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const tutor = await User.findOne({ email })

      if (tutor) {
        logger.log(`[seed] Tutor ${email} already exists. Skipped.`)
        return { tutor, created: false }
      }
    }

    throw error
  }
}

async function assignTutorIfEmpty(classDocument, tutor, logger) {
  if (!classDocument || !tutor) return

  const result = await Class.updateOne(
    { _id: classDocument._id, assignedTutor: null },
    { $set: { assignedTutor: tutor._id } },
  )

  if (result.modifiedCount === 0) {
    logger.log(
      `[seed] Class ${classDocument.className} already has an assigned tutor. Skipped.`,
    )
    return
  }

  await User.updateOne(
    { _id: tutor._id },
    { $addToSet: { assignedClasses: classDocument._id } },
  )
  logger.log(
    `[seed] Tutor ${tutor.email} assigned to class ${classDocument.className}.`,
  )
}

async function ensureStudent(department, classDocument, code, index, logger) {
  const registerNumber = `${code}2400${index + 1}`
  const existing = await Student.findOne({ registerNumber })

  if (existing) {
    logger.log(
      `[seed] Student ${registerNumber} already exists. Skipped.`,
    )
    return { student: existing, created: false }
  }

  try {
    const student = await Student.create({
      fullName: STUDENT_NAMES[code][index],
      registerNumber,
      email: `student.${code.toLowerCase()}.${index + 1}@example.test`,
      phone: `+1 555 02${String(index + 10).padStart(2, '0')}`,
      department: department._id,
      class: classDocument._id,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    })

    logger.log(`[seed] Student ${registerNumber} created.`)
    return { student, created: true }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const student = await Student.findOne({ registerNumber })

      if (student) {
        logger.log(
          `[seed] Student ${registerNumber} already exists. Skipped.`,
        )
        return { student, created: false }
      }
    }

    throw error
  }
}

async function ensureParent(student, code, index, logger) {
  const email = `parent.${code.toLowerCase()}.${index + 1}@example.test`
  let parent = await User.findOne({ email })
  let created = false

  if (parent) {
    logger.log(`[seed] Parent ${email} already exists. Skipped.`)
  } else {
    try {
      parent = await User.create({
        fullName: PARENT_NAMES[code][index],
        email,
        password: DEV_PARENT_PASSWORD,
        role: ROLES.PARENT,
        phone: `+1 555 03${String(index + 10).padStart(2, '0')}`,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      })
      created = true
      logger.log(`[seed] Parent ${email} created.`)
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        parent = await User.findOne({ email })

        if (parent) {
          logger.log(`[seed] Parent ${email} already exists. Skipped.`)
        } else {
          throw error
        }
      } else {
        throw error
      }
    }
  }

  const relationship =
    index % 2 === 0 ? RELATIONSHIP_TYPES.FATHER : RELATIONSHIP_TYPES.MOTHER

  const linked = await ParentStudent.exists({
    parent: parent._id,
    student: student._id,
  })
  let linkedCreated = false

  if (!linked) {
    try {
      await ParentStudent.create({
        parent: parent._id,
        student: student._id,
        relationship,
      })
      linkedCreated = true
      logger.log(
        `[seed] Parent ${email} linked to student ${student.registerNumber}.`,
      )
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error
    }
  } else {
    logger.log(
      `[seed] Parent ${email} is already linked to student ${student.registerNumber}. Skipped.`,
    )
  }

  return { parent, created, linkedCreated }
}

/**
 * Development-only demo data. Every record is created only when missing and
 * existing records are never overwritten, so running this more than once is
 * safe. It is never imported by the server startup path.
 */
export async function seedAcademicData({ logger = console } = {}) {
  const summary = {
    departments: { created: 0, skipped: 0 },
    classes: { created: 0, skipped: 0 },
    tutors: { created: 0, skipped: 0 },
    students: { created: 0, skipped: 0 },
    parents: { created: 0, skipped: 0 },
    links: { created: 0, skipped: 0 },
  }

  summary.departments = await seedInitialDepartments({ logger })

  const departments = await Department.find({
    code: { $in: INITIAL_DEPARTMENTS.map((department) => department.code) },
  })

  const departmentByCode = new Map(
    departments.map((department) => [department.code, department]),
  )

  for (const { code } of INITIAL_DEPARTMENTS) {
    const department = departmentByCode.get(code)

    if (!department) {
      logger.log(`[seed] Department ${code} is missing. Skipped its demo data.`)
      continue
    }

    const classes = []

    for (const definition of classDefinitions(code)) {
      const result = await ensureClass(department, definition, logger)
      classes.push(result.classDocument)
      summary.classes[result.created ? 'created' : 'skipped'] += 1
    }

    const tutors = []

    for (let index = 0; index < 2; index += 1) {
      const result = await ensureTutor(department, code, index, logger)
      tutors.push(result.tutor)
      summary.tutors[result.created ? 'created' : 'skipped'] += 1
    }

    for (let index = 0; index < classes.length; index += 1) {
      await assignTutorIfEmpty(classes[index], tutors[index], logger)
    }

    for (let index = 0; index < STUDENT_NAMES[code].length; index += 1) {
      const classDocument = classes[index < 2 ? 0 : 1]
      const studentResult = await ensureStudent(
        department,
        classDocument,
        code,
        index,
        logger,
      )
      summary.students[
        studentResult.created ? 'created' : 'skipped'
      ] += 1

      const parentResult = await ensureParent(
        studentResult.student,
        code,
        index,
        logger,
      )
      summary.parents[parentResult.created ? 'created' : 'skipped'] += 1
      summary.links[
        parentResult.linkedCreated ? 'created' : 'skipped'
      ] += 1
    }
  }

  return summary
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error(
      '[seed] MONGODB_URI is required to seed demo academic data. Set it in .env or the environment.',
    )
    process.exitCode = 1
    return
  }

  await connectDatabase(process.env.MONGODB_URI)

  try {
    const summary = await seedAcademicData()
    console.log('[seed] Phase 4 demo data seed complete.')
    console.log(
      `[seed] Departments created: ${summary.departments.created}, skipped: ${summary.departments.skipped}.`,
    )
    console.log(
      `[seed] Classes created: ${summary.classes.created}, skipped: ${summary.classes.skipped}.`,
    )
    console.log(
      `[seed] Tutors created: ${summary.tutors.created}, skipped: ${summary.tutors.skipped}.`,
    )
    console.log(
      `[seed] Students created: ${summary.students.created}, skipped: ${summary.students.skipped}.`,
    )
    console.log(
      `[seed] Parents created: ${summary.parents.created}, skipped: ${summary.parents.skipped}.`,
    )
    console.log(
      `[seed] Parent-student links created: ${summary.links.created}, skipped: ${summary.links.skipped}.`,
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
