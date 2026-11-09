import { ACCOUNT_STATUS, ROLES } from '../constants/index.js'
import { Class } from '../models/Class.js'
import { Department } from '../models/Department.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import {
  isDuplicateKeyError,
  toConflictError,
} from '../utils/databaseErrors.js'
import { escapeRegExp } from '../utils/escapeRegExp.js'

const CLASS_SELECT_FIELDS =
  'className year section department assignedTutor status createdAt updatedAt'
const DEPARTMENT_POPULATE_FIELDS = 'name code description status'
const TUTOR_POPULATE_FIELDS =
  'fullName email employeeId department accountStatus'

const DUPLICATE_MESSAGES = {
  classNameKey: 'A class with this name already exists in this department',
  department: 'A class with this name already exists in this department',
}

function classConflict(error) {
  return toConflictError(
    error,
    DUPLICATE_MESSAGES,
    'A class with these details already exists',
  )
}

function userId(user) {
  return String(user._id ?? user.id)
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

async function assertAssignableTutor(tutorId, departmentId) {
  if (tutorId === undefined || tutorId === null) return null

  const tutor = await User.findOne({ _id: tutorId, role: ROLES.TUTOR })

  if (!tutor) {
    throw new AppError('Assigned tutor not found', 404)
  }

  if (tutor.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Assigned tutor must be an active account', 400)
  }

  if (!tutor.department || String(tutor.department) !== String(departmentId)) {
    throw new AppError(
      'Assigned tutor must belong to the same department as the class',
      400,
    )
  }

  return tutor
}

async function syncTutorAssignment(previousTutorId, nextTutorId, classId) {
  if (
    previousTutorId &&
    (!nextTutorId || String(previousTutorId) !== String(nextTutorId))
  ) {
    await User.updateOne(
      { _id: previousTutorId, role: ROLES.TUTOR },
      { $pull: { assignedClasses: classId } },
    )
  }

  if (nextTutorId && String(previousTutorId ?? '') !== String(nextTutorId)) {
    await User.updateOne(
      { _id: nextTutorId, role: ROLES.TUTOR },
      { $addToSet: { assignedClasses: classId } },
    )
  }
}

async function populateClass(classDocument) {
  await classDocument.populate([
    { path: 'department', select: DEPARTMENT_POPULATE_FIELDS },
    { path: 'assignedTutor', select: TUTOR_POPULATE_FIELDS },
  ])

  return classDocument
}

async function findClassOrThrow(id) {
  const classDocument = await Class.findById(id)

  if (!classDocument) {
    throw new AppError('Class not found', 404)
  }

  return classDocument
}

export async function createClass(data) {
  const department = await getActiveDepartmentOrThrow(data.department)
  const tutor = await assertAssignableTutor(
    data.assignedTutor,
    department._id,
  )

  let classDocument

  try {
    classDocument = await Class.create({
      className: data.className,
      year: data.year,
      section: data.section,
      department: department._id,
      assignedTutor: tutor ? tutor._id : null,
      status: ACCOUNT_STATUS.ACTIVE,
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) throw classConflict(error)
    throw error
  }

  if (tutor) {
    await syncTutorAssignment(null, tutor._id, classDocument._id)
  }

  return populateClass(classDocument)
}

export async function listClasses({ search, status, department, page, limit }, user) {
  const filter = {}

  if (status) filter.status = status

  if (user.role === ROLES.ADMIN) {
    if (department) filter.department = department
  } else if (user.role === ROLES.HOD) {
    if (department && String(department) !== String(user.department)) {
      throw new AppError(
        'You do not have permission to access classes from another department',
        403,
      )
    }
    filter.department = user.department
  } else if (user.role === ROLES.TUTOR) {
    filter.assignedTutor = userId(user)
    filter.department = user.department
  } else {
    throw new AppError('You do not have permission to view classes', 403)
  }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i')
    filter.$or = [
      { className: pattern },
      { year: pattern },
      { section: pattern },
    ]
  }

  const [classes, total] = await Promise.all([
    Class.find(filter)
      .populate('department', DEPARTMENT_POPULATE_FIELDS)
      .populate('assignedTutor', TUTOR_POPULATE_FIELDS)
      .sort({ className: 1, year: 1, section: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Class.countDocuments(filter),
  ])

  return {
    classes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getClassById(id, user) {
  const classDocument = await findClassOrThrow(id)
  await populateClass(classDocument)

  if (user.role === ROLES.ADMIN) {
    return classDocument
  }

  if (
    user.role === ROLES.HOD &&
    user.department &&
    String(user.department) === String(classDocument.department?._id)
  ) {
    return classDocument
  }

  if (
    user.role === ROLES.TUTOR &&
    classDocument.assignedTutor &&
    String(classDocument.assignedTutor._id) === userId(user)
  ) {
    return classDocument
  }

  throw new AppError(
    'You do not have permission to access this class',
    403,
  )
}

export async function updateClass(id, updates) {
  const classDocument = await findClassOrThrow(id)
  const previousTutorId = classDocument.assignedTutor
  const finalDepartmentId = updates.department ?? classDocument.department

  if (
    updates.department !== undefined &&
    String(updates.department) !== String(classDocument.department)
  ) {
    await getActiveDepartmentOrThrow(updates.department)
  }

  const finalTutorId =
    updates.assignedTutor !== undefined
      ? updates.assignedTutor
      : classDocument.assignedTutor

  await assertAssignableTutor(finalTutorId, finalDepartmentId)

  if (updates.className !== undefined) classDocument.className = updates.className
  if (updates.year !== undefined) classDocument.year = updates.year
  if (updates.section !== undefined) classDocument.section = updates.section
  if (updates.department !== undefined) {
    classDocument.department = updates.department
  }
  if (updates.assignedTutor !== undefined) {
    classDocument.assignedTutor = updates.assignedTutor
  }

  try {
    await classDocument.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) throw classConflict(error)
    throw error
  }

  await syncTutorAssignment(
    previousTutorId,
    classDocument.assignedTutor,
    classDocument._id,
  )

  return populateClass(classDocument)
}

export async function setClassStatus(id, status) {
  const classDocument = await findClassOrThrow(id)

  if (classDocument.status !== status) {
    classDocument.status = status
    await classDocument.save()
  }

  return populateClass(classDocument)
}
