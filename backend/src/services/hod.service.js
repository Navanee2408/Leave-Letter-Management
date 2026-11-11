import mongoose from 'mongoose'
import { ACCOUNT_STATUS, ROLES } from '../constants/index.js'
import { Department } from '../models/Department.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import {
  isDuplicateKeyError,
  toConflictError,
} from '../utils/databaseErrors.js'
import { escapeRegExp } from '../utils/escapeRegExp.js'

const HOD_SELECT_FIELDS =
  'fullName email phone employeeId designation role department mustChangePassword accountStatus lastLogin createdAt updatedAt'
const DEPARTMENT_POPULATE_FIELDS = 'name code description status createdAt updatedAt'

const DUPLICATE_MESSAGES = {
  email: 'An account with this email already exists',
  employeeId: 'This employee ID is already in use',
  department: 'This department already has an active HOD',
}

function hodConflict(error) {
  return toConflictError(
    error,
    DUPLICATE_MESSAGES,
    'An HOD account with these details already exists',
  )
}

let transactionSupportPromise

/**
 * Transactions require a replica set or a sharded cluster. Standalone MongoDB
 * servers (common for local development) do not support them, so the service
 * falls back to compensating atomic operations.
 */
export async function deploymentSupportsTransactions() {
  transactionSupportPromise ??= (async () => {
    try {
      const db = mongoose.connection.db
      if (!db) return false

      const info = await db.admin().command({ hello: 1 })
      return Boolean(info.setName) || info.msg === 'isdbgrid'
    } catch {
      return false
    }
  })()

  return transactionSupportPromise
}

async function findHodOrThrow(id) {
  const hod = await User.findOne({ _id: id, role: ROLES.HOD })

  if (!hod) {
    throw new AppError('HOD not found', 404)
  }

  return hod
}

async function getActiveDepartmentOrThrow(departmentId) {
  const department = await Department.findById(departmentId)

  if (!department) {
    throw new AppError('Department not found', 404)
  }

  if (department.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError('Cannot assign an HOD to an inactive department', 400)
  }

  return department
}

async function assertEmailAvailable(email, excludeUserId) {
  const filter = { email }

  if (excludeUserId) {
    filter._id = { $ne: excludeUserId }
  }

  if (await User.exists(filter)) {
    throw new AppError('An account with this email already exists', 409)
  }
}

async function assertEmployeeIdAvailable(employeeId, excludeUserId) {
  if (!employeeId) return

  const filter = { employeeId }

  if (excludeUserId) {
    filter._id = { $ne: excludeUserId }
  }

  if (await User.exists(filter)) {
    throw new AppError('This employee ID is already in use', 409)
  }
}

async function createUserDocument(data, session) {
  if (!session) {
    return User.create(data)
  }

  const [created] = await User.create([data], { session })
  return created
}

/**
 * Deactivate any other ACTIVE HOD in a department and run `action` in the same
 * logical unit of work. When transactions are available the whole replacement
 * is atomic. Otherwise the previous HODs are restored if `action` fails.
 */
async function performActiveHodReplacement({
  departmentId,
  excludeUserId,
  action,
}) {
  const filter = {
    department: departmentId,
    role: ROLES.HOD,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  }

  if (excludeUserId) {
    filter._id = { $ne: excludeUserId }
  }

  if (await deploymentSupportsTransactions()) {
    const session = await mongoose.startSession()

    try {
      let result

      await session.withTransaction(async () => {
        await User.updateMany(
          filter,
          { $set: { accountStatus: ACCOUNT_STATUS.INACTIVE } },
          { session },
        )
        result = await action(session)
      })

      return result
    } finally {
      await session.endSession()
    }
  }

  const replaced = await User.find(filter).select('_id')
  const replacedIds = replaced.map((document) => document._id)

  if (replacedIds.length > 0) {
    await User.updateMany(
      { _id: { $in: replacedIds } },
      { $set: { accountStatus: ACCOUNT_STATUS.INACTIVE } },
    )
  }

  try {
    return await action(null)
  } catch (error) {
    if (replacedIds.length > 0) {
      // Best-effort rollback so a failed replacement does not silently leave
      // the department without an active HOD.
      await User.updateMany(
        {
          _id: { $in: replacedIds },
          role: ROLES.HOD,
          accountStatus: ACCOUNT_STATUS.INACTIVE,
        },
        { $set: { accountStatus: ACCOUNT_STATUS.ACTIVE } },
      ).catch(() => {})
    }

    throw error
  }
}

export async function createHod(data) {
  const department = await getActiveDepartmentOrThrow(data.department)

  await assertEmailAvailable(data.email)
  await assertEmployeeIdAvailable(data.employeeId)

  const accountStatus = data.accountStatus ?? ACCOUNT_STATUS.ACTIVE

  const payload = {
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    role: ROLES.HOD,
    department: department._id,
    accountStatus,
    mustChangePassword: true,
  }

  if (data.phone) payload.phone = data.phone
  if (data.employeeId) payload.employeeId = data.employeeId
  if (data.designation) payload.designation = data.designation

  try {
    const hod =
      accountStatus === ACCOUNT_STATUS.ACTIVE
        ? await performActiveHodReplacement({
            departmentId: department._id,
            action: (session) => createUserDocument(payload, session),
          })
        : await createUserDocument(payload)

    await hod.populate('department', DEPARTMENT_POPULATE_FIELDS)

    return hod
  } catch (error) {
    if (isDuplicateKeyError(error)) throw hodConflict(error)
    throw error
  }
}

export async function listHods({ search, status, department, page, limit }) {
  const filter = { role: ROLES.HOD }

  if (status) {
    filter.accountStatus = status
  }

  if (department) {
    filter.department = department
  }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i')
    filter.$or = [
      { fullName: pattern },
      { email: pattern },
      { employeeId: pattern },
    ]
  }

  const [hods, total] = await Promise.all([
    User.find(filter)
      .select(HOD_SELECT_FIELDS)
      .populate('department', DEPARTMENT_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ])

  return {
    hods,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getHodById(id) {
  const hod = await User.findOne({ _id: id, role: ROLES.HOD }).populate(
    'department',
    DEPARTMENT_POPULATE_FIELDS,
  )

  if (!hod) {
    throw new AppError('HOD not found', 404)
  }

  return hod
}

export async function updateHod(id, updates) {
  const hod = await findHodOrThrow(id)

  if (updates.email !== undefined) {
    await assertEmailAvailable(updates.email, hod._id)
  }

  if (updates.employeeId !== undefined) {
    await assertEmployeeIdAvailable(updates.employeeId, hod._id)
  }

  let targetDepartmentId = hod.department
  let departmentChanged = false

  if (updates.department !== undefined) {
    const targetDepartment = await getActiveDepartmentOrThrow(
      updates.department,
    )

    targetDepartmentId = targetDepartment._id
    departmentChanged =
      !hod.department ||
      String(hod.department) !== String(targetDepartment._id)
  }

  const applyUpdates = async (session) => {
    if (updates.fullName !== undefined) hod.fullName = updates.fullName
    if (updates.email !== undefined) hod.email = updates.email
    if (updates.phone !== undefined) hod.phone = updates.phone
    if (updates.employeeId !== undefined) hod.employeeId = updates.employeeId
    if (updates.designation !== undefined) hod.designation = updates.designation
    if (updates.department !== undefined) hod.department = targetDepartmentId

    await (session ? hod.save({ session }) : hod.save())

    return hod
  }

  try {
    if (departmentChanged) {
      await performActiveHodReplacement({
        departmentId: targetDepartmentId,
        excludeUserId: hod._id,
        action: applyUpdates,
      })
    } else {
      await applyUpdates(null)
    }

    await hod.populate('department', DEPARTMENT_POPULATE_FIELDS)

    return hod
  } catch (error) {
    if (isDuplicateKeyError(error)) throw hodConflict(error)
    throw error
  }
}

export async function setHodStatus(id, status) {
  const hod = await findHodOrThrow(id)

  if (hod.accountStatus === status) {
    await hod.populate('department', DEPARTMENT_POPULATE_FIELDS)
    return hod
  }

  if (status === ACCOUNT_STATUS.ACTIVE) {
    await getActiveDepartmentOrThrow(hod.department)

    const otherActiveHod = await User.exists({
      _id: { $ne: hod._id },
      department: hod.department,
      role: ROLES.HOD,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    })

    if (otherActiveHod) {
      throw new AppError('This department already has an active HOD', 409)
    }
  }

  hod.accountStatus = status

  try {
    await hod.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError('This department already has an active HOD', 409)
    }
    throw error
  }

  await hod.populate('department', DEPARTMENT_POPULATE_FIELDS)

  return hod
}

export async function getActiveHodForDepartment(departmentId) {
  const department = await Department.findById(departmentId)

  if (!department) {
    throw new AppError('Department not found', 404)
  }

  return User.findOne({
    department: department._id,
    role: ROLES.HOD,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
  }).populate('department', DEPARTMENT_POPULATE_FIELDS)
}
