import { ACCOUNT_STATUS, ROLES } from '../constants/index.js'
import { ParentStudent } from '../models/ParentStudent.js'
import { Student } from '../models/Student.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import {
  isDuplicateKeyError,
  toConflictError,
} from '../utils/databaseErrors.js'
import { escapeRegExp } from '../utils/escapeRegExp.js'

const PARENT_SELECT_FIELDS =
  'fullName email phone role accountStatus lastLogin createdAt updatedAt'
const STUDENT_POPULATE_FIELDS =
  'fullName registerNumber email phone department class accountStatus createdAt updatedAt'
const DEPARTMENT_POPULATE_FIELDS = 'name code description status'
const CLASS_POPULATE_FIELDS = 'className year section department status'

const DUPLICATE_MESSAGES = {
  email: 'An account with this email already exists',
}

function parentConflict(error) {
  return toConflictError(
    error,
    DUPLICATE_MESSAGES,
    'A parent account with these details already exists',
  )
}

function parentIdOf(user) {
  return String(user._id ?? user.id)
}

async function assertEmailAvailable(email, excludeUserId) {
  const filter = { email }

  if (excludeUserId) filter._id = { $ne: excludeUserId }

  if (await User.exists(filter)) {
    throw new AppError('An account with this email already exists', 409)
  }
}

async function findParentOrThrow(id) {
  const parent = await User.findOne({ _id: id, role: ROLES.PARENT })

  if (!parent) {
    throw new AppError('Parent not found', 404)
  }

  return parent
}

async function populateChildLinks(links) {
  await ParentStudent.populate(links, [
    {
      path: 'student',
      select: STUDENT_POPULATE_FIELDS,
      populate: [
        { path: 'department', select: DEPARTMENT_POPULATE_FIELDS },
        { path: 'class', select: CLASS_POPULATE_FIELDS },
      ],
    },
  ])

  return links
}

export async function createParent(data) {
  await assertEmailAvailable(data.email)

  const payload = {
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    role: ROLES.PARENT,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  }

  if (data.phone) payload.phone = data.phone

  try {
    return await User.create(payload)
  } catch (error) {
    if (isDuplicateKeyError(error)) throw parentConflict(error)
    throw error
  }
}

export async function listParents({ search, status, page, limit }) {
  const filter = { role: ROLES.PARENT }

  if (status) filter.accountStatus = status

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i')
    filter.$or = [{ fullName: pattern }, { email: pattern }]
  }

  const [parents, total] = await Promise.all([
    User.find(filter)
      .select(PARENT_SELECT_FIELDS)
      .sort({ fullName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ])

  return {
    parents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getParentById(id) {
  return findParentOrThrow(id)
}

export async function updateParent(id, updates) {
  const parent = await findParentOrThrow(id)

  if (updates.email !== undefined) {
    await assertEmailAvailable(updates.email, parent._id)
  }

  if (updates.fullName !== undefined) parent.fullName = updates.fullName
  if (updates.email !== undefined) parent.email = updates.email
  if (updates.phone !== undefined) parent.phone = updates.phone

  try {
    await parent.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) throw parentConflict(error)
    throw error
  }

  return parent
}

export async function setParentStatus(id, status) {
  const parent = await findParentOrThrow(id)

  if (parent.accountStatus !== status) {
    parent.accountStatus = status
    await parent.save()
  }

  return parent
}

export async function addChild(parentId, { studentId, relationship }) {
  await findParentOrThrow(parentId)

  const student = await Student.findById(studentId)

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  if (
    await ParentStudent.exists({ parent: parentId, student: studentId })
  ) {
    throw new AppError(
      'This student is already linked to this parent',
      409,
    )
  }

  let link

  try {
    link = await ParentStudent.create({
      parent: parentId,
      student: studentId,
      relationship,
    })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        'This student is already linked to this parent',
        409,
      )
    }
    throw error
  }

  await populateChildLinks([link])

  return link
}

export async function listChildren(parentId, { page, limit }) {
  await findParentOrThrow(parentId)

  const filter = { parent: parentId }

  const [links, total] = await Promise.all([
    ParentStudent.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ParentStudent.countDocuments(filter),
  ])

  await populateChildLinks(links)

  return {
    children: links,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function listMyChildren(user, query) {
  if (user.role !== ROLES.PARENT) {
    throw new AppError('Only parent accounts can access linked children', 403)
  }

  return listChildren(parentIdOf(user), query)
}

export async function removeChild(parentId, studentId) {
  await findParentOrThrow(parentId)

  const removed = await ParentStudent.findOneAndDelete({
    parent: parentId,
    student: studentId,
  })

  if (!removed) {
    throw new AppError('Parent-student link not found', 404)
  }

  return removed
}
