import { Department } from '../models/Department.js'
import { AppError } from '../utils/AppError.js'
import {
  isDuplicateKeyError,
  toConflictError,
} from '../utils/databaseErrors.js'
import { escapeRegExp } from '../utils/escapeRegExp.js'

const DUPLICATE_MESSAGES = {
  nameKey: 'A department with this name already exists',
  code: 'A department with this code already exists',
}

function departmentConflict(error) {
  return toConflictError(
    error,
    DUPLICATE_MESSAGES,
    'A department with these details already exists',
  )
}

export async function createDepartment(data) {
  try {
    return await Department.create(data)
  } catch (error) {
    if (isDuplicateKeyError(error)) throw departmentConflict(error)
    throw error
  }
}

export async function listDepartments({ search, status, page, limit }) {
  const filter = {}

  if (status) {
    filter.status = status
  }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i')
    filter.$or = [{ name: pattern }, { code: pattern }]
  }

  const [departments, total] = await Promise.all([
    Department.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Department.countDocuments(filter),
  ])

  return {
    departments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getDepartmentById(id) {
  const department = await Department.findById(id)

  if (!department) {
    throw new AppError('Department not found', 404)
  }

  return department
}

export async function updateDepartment(id, updates) {
  const department = await getDepartmentById(id)

  Object.assign(department, updates)

  try {
    await department.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) throw departmentConflict(error)
    throw error
  }

  return department
}

export async function setDepartmentStatus(id, status) {
  const department = await getDepartmentById(id)

  if (department.status === status) {
    return department
  }

  department.status = status

  try {
    await department.save()
  } catch (error) {
    if (isDuplicateKeyError(error)) throw departmentConflict(error)
    throw error
  }

  return department
}
