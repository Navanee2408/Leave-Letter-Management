import { ACCOUNT_STATUS, ROLES } from '../constants/index.js'
import { Class } from '../models/Class.js'
import { Department } from '../models/Department.js'
import { ParentStudent } from '../models/ParentStudent.js'
import { Student } from '../models/Student.js'
import { AppError } from '../utils/AppError.js'
import {
  isDuplicateKeyError,
  toConflictError,
} from '../utils/databaseErrors.js'
import { escapeRegExp } from '../utils/escapeRegExp.js'

const STUDENT_SELECT_FIELDS =
  'fullName registerNumber email phone department class accountStatus createdAt updatedAt'
const DEPARTMENT_POPULATE_FIELDS = 'name code description status'
const CLASS_POPULATE_FIELDS =
  'className year section department assignedTutor status createdAt updatedAt'

const DUPLICATE_MESSAGES = {
  registerNumber: 'A student with this register number already exists',
  email: 'A student with this email already exists',
}

function studentConflict(error) {
  return toConflictError(
    error,
    DUPLICATE_MESSAGES,
    'A student with these details already exists',
  )
}

function userId(user) {
  return String(user._id ?? user.id)
}

async function resolveClassAndDepartment(departmentId, classId) {
  const department = await Department.findById(departmentId)

  if (!department) {
    throw new AppError('Department not found', 404)
  }

  if (department.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Cannot assign a student to an inactive department', 400)
  }

  const classDocument = await Class.findById(classId)

  if (!classDocument) {
    throw new AppError('Class not found', 404)
  }

  if (classDocument.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Cannot assign a student to an inactive class', 400)
  }

  if (String(classDocument.department) !== String(department._id)) {
    throw new AppError(
      "Student's department must match the class department",
      400,
    )
  }

  return { department, classDocument }
}

async function assertRegisterNumberAvailable(registerNumber, excludeStudentId) {
  const filter = { registerNumber }

  if (excludeStudentId) filter._id = { $ne: excludeStudentId }

  if (await Student.exists(filter)) {
    throw new AppError('A student with this register number already exists', 409)
  }
}

async function assertStudentEmailAvailable(email, excludeStudentId) {
  if (!email) return

  const filter = { email }

  if (excludeStudentId) filter._id = { $ne: excludeStudentId }

  if (await Student.exists(filter)) {
    throw new AppError('A student with this email already exists', 409)
  }
}

async function findStudentOrThrow(id) {
  const student = await Student.findById(id)

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  return student
}

async function populateStudent(student) {
  await student.populate([
    { path: 'department', select: DEPARTMENT_POPULATE_FIELDS },
    { path: 'class', select: CLASS_POPULATE_FIELDS },
  ])

  return student
}

export async function createStudent(data) {
  await resolveClassAndDepartment(data.department, data.class)
  await assertRegisterNumberAvailable(data.registerNumber)
  await assertStudentEmailAvailable(data.email)

  const payload = {
    fullName: data.fullName,
    registerNumber: data.registerNumber,
    department: data.department,
    class: data.class,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  }

  if (data.email) payload.email = data.email
  if (data.phone) payload.phone = data.phone

  let student

  try {
    student = await Student.create(payload)
  } catch (error) {
    if (isDuplicateKeyError(error)) throw studentConflict(error)
    throw error
  }

  return populateStudent(student)
}

export async function listStudents(
  { search, status, department, class: classId, page, limit },
  user,
) {
  const filter = {}

  if (status) filter.accountStatus = status

  if (user.role === ROLES.ADMIN) {
    if (department) filter.department = department
    if (classId) filter.class = classId
  } else if (user.role === ROLES.HOD) {
    if (department && String(department) !== String(user.department)) {
      throw new AppError(
        'You do not have permission to access students from another department',
        403,
      )
    }
    filter.department = user.department
    if (classId) filter.class = classId
  } else if (user.role === ROLES.TUTOR) {
    const assignedClassIds = await Class.find({
      assignedTutor: userId(user),
      status: ACCOUNT_STATUS.ACTIVE,
    }).distinct('_id')

    filter.class = { $in: assignedClassIds }
    filter.department = user.department
    if (classId) {
      filter.class = assignedClassIds.some(
        (id) => String(id) === String(classId),
      )
        ? classId
        : { $in: [] }
    }
  } else if (user.role === ROLES.PARENT) {
    const studentIds = await ParentStudent.find({
      parent: userId(user),
    }).distinct('student')

    filter._id = { $in: studentIds }
    if (classId) filter.class = classId
  } else {
    throw new AppError('You do not have permission to view students', 403)
  }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i')
    filter.$or = [
      { fullName: pattern },
      { registerNumber: pattern },
      { email: pattern },
    ]
  }

  const [students, total] = await Promise.all([
    Student.find(filter)
      .select(STUDENT_SELECT_FIELDS)
      .populate('department', DEPARTMENT_POPULATE_FIELDS)
      .populate('class', CLASS_POPULATE_FIELDS)
      .sort({ fullName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Student.countDocuments(filter),
  ])

  return {
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getStudentById(id, user) {
  const student = await findStudentOrThrow(id)
  await populateStudent(student)

  if (user.role === ROLES.ADMIN) {
    return student
  }

  if (
    user.role === ROLES.HOD &&
    user.department &&
    String(user.department) === String(student.department?._id)
  ) {
    return student
  }

  if (
    user.role === ROLES.TUTOR &&
    student.class?.assignedTutor &&
    String(student.class.assignedTutor) === userId(user)
  ) {
    return student
  }

  if (user.role === ROLES.PARENT) {
    const linked = await ParentStudent.exists({
      parent: userId(user),
      student: student._id,
    })

    if (linked) return student
  }

  throw new AppError('You do not have permission to access this student', 403)
}

export async function updateStudent(id, updates) {
  const student = await findStudentOrThrow(id)

  if (updates.registerNumber !== undefined) {
    await assertRegisterNumberAvailable(updates.registerNumber, student._id)
  }

  if (updates.email !== undefined) {
    await assertStudentEmailAvailable(updates.email, student._id)
  }

  const finalDepartmentId = updates.department ?? student.department
  const finalClassId = updates.class ?? student.class

  await resolveClassAndDepartment(finalDepartmentId, finalClassId)

  if (updates.fullName !== undefined) student.fullName = updates.fullName
  if (updates.registerNumber !== undefined) {
    student.registerNumber = updates.registerNumber
  }
  if (updates.email !== undefined) student.email = updates.email
  if (updates.phone !== undefined) student.phone = updates.phone
  if (updates.department !== undefined) student.department = updates.department
  if (updates.class !== undefined) student.class = updates.class

  try {
    await student.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) throw studentConflict(error)
    throw error
  }

  return populateStudent(student)
}

export async function setStudentStatus(id, status) {
  const student = await findStudentOrThrow(id)

  if (student.accountStatus !== status) {
    student.accountStatus = status
    await student.save()
  }

  return populateStudent(student)
}
