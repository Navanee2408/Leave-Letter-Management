import { ACCOUNT_STATUS, ROLES } from '../constants/index.js'
import { Class } from '../models/Class.js'
import { Department } from '../models/Department.js'
import { Student } from '../models/Student.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import {
  isDuplicateKeyError,
  toConflictError,
} from '../utils/databaseErrors.js'
import { escapeRegExp } from '../utils/escapeRegExp.js'

const TUTOR_SELECT_FIELDS =
  'fullName email phone employeeId designation role department assignedClasses mustChangePassword accountStatus lastLogin createdAt updatedAt'
const DEPARTMENT_POPULATE_FIELDS = 'name code description status'
const CLASS_POPULATE_FIELDS =
  'className year section department assignedTutor status createdAt updatedAt'

const DUPLICATE_MESSAGES = {
  email: 'An account with this email already exists',
  employeeId: 'This employee ID is already in use',
}

function tutorConflict(error) {
  return toConflictError(
    error,
    DUPLICATE_MESSAGES,
    'A tutor account with these details already exists',
  )
}

async function getActiveDepartmentOrThrow(departmentId) {
  const department = await Department.findById(departmentId)

  if (!department) {
    throw new AppError('Department not found', 404)
  }

  if (department.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Cannot use an inactive department', 400)
  }

  return department
}

async function assertEmailAvailable(email, excludeUserId) {
  const filter = { email }

  if (excludeUserId) filter._id = { $ne: excludeUserId }

  if (await User.exists(filter)) {
    throw new AppError('An account with this email already exists', 409)
  }
}

async function assertEmployeeIdAvailable(employeeId, excludeUserId) {
  if (!employeeId) return

  const filter = { employeeId }

  if (excludeUserId) filter._id = { $ne: excludeUserId }

  if (await User.exists(filter)) {
    throw new AppError('This employee ID is already in use', 409)
  }
}

async function findTutorOrThrow(id) {
  const tutor = await User.findOne({ _id: id, role: ROLES.TUTOR })

  if (!tutor) {
    throw new AppError('Tutor not found', 404)
  }

  return tutor
}

async function validateClassAssignments(
  classIds,
  departmentId,
  tutorId = null,
) {
  const uniqueIds = [...new Set(classIds.map(String))]

  if (uniqueIds.length === 0) return []

  if (uniqueIds.length !== classIds.length) {
    throw new AppError('Duplicate class assignments are not allowed', 400)
  }

  const classes = await Class.find({ _id: { $in: uniqueIds } })

  if (classes.length !== uniqueIds.length) {
    throw new AppError('One or more classes were not found', 404)
  }

  for (const classDocument of classes) {
    if (String(classDocument.department) !== String(departmentId)) {
      throw new AppError(
        'Tutors can only be assigned to classes in their own department',
        400,
      )
    }

    if (classDocument.status !== ACCOUNT_STATUS.ACTIVE) {
      throw new AppError(
        'Tutors can only be assigned to active classes',
        400,
      )
    }

    if (
      classDocument.assignedTutor &&
      (!tutorId ||
        String(classDocument.assignedTutor) !== String(tutorId))
    ) {
      throw new AppError(
        'This class already has an assigned tutor',
        409,
      )
    }
  }

  return classes
}

async function populateTutor(tutor) {
  await tutor.populate([
    { path: 'department', select: DEPARTMENT_POPULATE_FIELDS },
    {
      path: 'assignedClasses',
      select: CLASS_POPULATE_FIELDS,
      populate: { path: 'department', select: DEPARTMENT_POPULATE_FIELDS },
    },
  ])

  return tutor
}

export async function createTutor(data) {
  const department = await getActiveDepartmentOrThrow(data.department)
  await assertEmailAvailable(data.email)
  await assertEmployeeIdAvailable(data.employeeId)

  const classIds = data.assignedClasses ?? []
  await validateClassAssignments(classIds, department._id)

  const payload = {
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    role: ROLES.TUTOR,
    department: department._id,
    assignedClasses: classIds,
    accountStatus: data.accountStatus ?? ACCOUNT_STATUS.ACTIVE,
    mustChangePassword: true,
  }

  if (data.phone) payload.phone = data.phone
  if (data.employeeId) payload.employeeId = data.employeeId
  if (data.designation) payload.designation = data.designation

  let tutor

  try {
    tutor = await User.create(payload)
  } catch (error) {
    if (isDuplicateKeyError(error)) throw tutorConflict(error)
    throw error
  }

  if (classIds.length > 0) {
    await Class.updateMany(
      { _id: { $in: classIds } },
      { $set: { assignedTutor: tutor._id } },
    )
  }

  await tutor.populate('department', DEPARTMENT_POPULATE_FIELDS)
  await tutor.populate('assignedClasses', CLASS_POPULATE_FIELDS)

  return tutor
}

export async function listTutors({ search, status, department, page, limit }, user) {
  const filter = { role: ROLES.TUTOR }

  if (status) filter.accountStatus = status

  if (user.role === ROLES.ADMIN) {
    if (department) filter.department = department
  } else if (user.role === ROLES.HOD) {
    if (department && String(department) !== String(user.department)) {
      throw new AppError(
        'You do not have permission to access tutors from another department',
        403,
      )
    }
    filter.department = user.department
  } else {
    throw new AppError('You do not have permission to view tutors', 403)
  }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i')
    filter.$or = [
      { fullName: pattern },
      { email: pattern },
      { employeeId: pattern },
    ]
  }

  const [tutors, total] = await Promise.all([
    User.find(filter)
      .select(TUTOR_SELECT_FIELDS)
      .populate('department', DEPARTMENT_POPULATE_FIELDS)
      .sort({ fullName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ])

  return {
    tutors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getTutorById(id, user) {
  const tutor = await User.findOne({ _id: id, role: ROLES.TUTOR })
    .select(TUTOR_SELECT_FIELDS)
    .populate('department', DEPARTMENT_POPULATE_FIELDS)
    .populate('assignedClasses', CLASS_POPULATE_FIELDS)

  if (!tutor) {
    throw new AppError('Tutor not found', 404)
  }

  if (user.role === ROLES.ADMIN) {
    return tutor
  }

  if (
    user.role === ROLES.HOD &&
    user.department &&
    String(user.department) === String(tutor.department?._id)
  ) {
    return tutor
  }

  throw new AppError('You do not have permission to access this tutor', 403)
}

export async function updateTutor(id, updates) {
  const tutor = await findTutorOrThrow(id)

  if (updates.email !== undefined) {
    await assertEmailAvailable(updates.email, tutor._id)
  }

  if (updates.employeeId !== undefined) {
    await assertEmployeeIdAvailable(updates.employeeId, tutor._id)
  }

  const currentClasses = await Class.find({ assignedTutor: tutor._id })
  const finalDepartmentId = updates.department ?? tutor.department
  let finalClassIds = currentClasses.map((classDocument) => classDocument._id)

  if (updates.department !== undefined) {
    await getActiveDepartmentOrThrow(updates.department)
  }

  if (updates.assignedClasses !== undefined) {
    await validateClassAssignments(
      updates.assignedClasses,
      finalDepartmentId,
      tutor._id,
    )
    finalClassIds = updates.assignedClasses
  } else if (updates.department !== undefined) {
    const crossDepartmentClass = currentClasses.find(
      (classDocument) =>
        String(classDocument.department) !== String(finalDepartmentId),
    )

    if (crossDepartmentClass) {
      throw new AppError(
        "Reassign or clear the tutor's classes before moving them to another department",
        400,
      )
    }
  }

  if (updates.fullName !== undefined) tutor.fullName = updates.fullName
  if (updates.email !== undefined) tutor.email = updates.email
  if (updates.phone !== undefined) tutor.phone = updates.phone
  if (updates.employeeId !== undefined) tutor.employeeId = updates.employeeId
  if (updates.designation !== undefined) tutor.designation = updates.designation
  if (updates.department !== undefined) tutor.department = updates.department
  tutor.assignedClasses = finalClassIds

  try {
    await tutor.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) throw tutorConflict(error)
    throw error
  }

  if (updates.assignedClasses !== undefined) {
    await Class.updateMany(
      { assignedTutor: tutor._id, _id: { $nin: finalClassIds } },
      { $set: { assignedTutor: null } },
    )
    await Class.updateMany(
      { _id: { $in: finalClassIds } },
      { $set: { assignedTutor: tutor._id } },
    )
  }

  return populateTutor(tutor)
}

export async function setTutorStatus(id, status) {
  const tutor = await findTutorOrThrow(id)

  if (tutor.accountStatus !== status) {
    tutor.accountStatus = status
    await tutor.save()
  }

  return populateTutor(tutor)
}

export async function getTutorClasses(user) {
  return Class.find({
    assignedTutor: user._id ?? user.id,
    status: ACCOUNT_STATUS.ACTIVE,
  })
    .populate('department', DEPARTMENT_POPULATE_FIELDS)
    .sort({ className: 1, year: 1, section: 1 })
}

export async function getTutorStudents(user) {
  const classIds = await Class.find({
    assignedTutor: user._id ?? user.id,
    status: ACCOUNT_STATUS.ACTIVE,
  }).distinct('_id')

  return Student.find({
    class: { $in: classIds },
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  })
    .populate('department', DEPARTMENT_POPULATE_FIELDS)
    .populate('class', CLASS_POPULATE_FIELDS)
    .sort({ fullName: 1 })
}
