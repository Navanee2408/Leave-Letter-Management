import crypto from 'node:crypto'
import { ROLES } from '../../src/constants/index.js'
import { Class } from '../../src/models/Class.js'
import { Department } from '../../src/models/Department.js'
import { ParentStudent } from '../../src/models/ParentStudent.js'
import { Student } from '../../src/models/Student.js'
import {
  TEST_PASSWORD,
  createTestUser,
  loginRequest,
} from './authTestUtils.js'

export function uniqueSuffix() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export function createTestDepartment(overrides = {}) {
  const suffix = uniqueSuffix()

  return Department.create({
    name: `Test Department ${suffix}`,
    code: `D${suffix}`,
    ...overrides,
  })
}

export function createTestAdmin(overrides = {}) {
  return createTestUser({
    fullName: 'Test Administrator',
    role: ROLES.ADMIN,
    ...overrides,
  })
}

export function createTestHod(department, overrides = {}) {
  return createTestUser({
    fullName: 'Test HOD',
    role: ROLES.HOD,
    department: department._id,
    ...overrides,
  })
}

export function createTestClass(department, overrides = {}) {
  const suffix = uniqueSuffix()

  return Class.create({
    className: `Class ${suffix}`,
    year: '3',
    section: 'A',
    department: department._id,
    ...overrides,
  })
}

export function createTestTutor(department, overrides = {}) {
  return createTestUser({
    fullName: 'Test Tutor',
    role: ROLES.TUTOR,
    department: department._id,
    ...overrides,
  })
}

export function createTestStudent(department, classDocument, overrides = {}) {
  const suffix = uniqueSuffix()

  return Student.create({
    fullName: 'Test Student',
    registerNumber: `REG-${suffix}`,
    email: `student-${suffix.toLowerCase()}@example.test`,
    department: department._id,
    class: classDocument._id,
    ...overrides,
  })
}

export function createTestParentStudent(parent, student, overrides = {}) {
  return ParentStudent.create({
    parent: parent._id,
    student: student._id,
    relationship: 'Father',
    ...overrides,
  })
}

export function futureDate(offsetDays = 1) {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export function leaveApplicationPayload(studentId, overrides = {}) {
  return {
    studentId,
    leaveType: 'SICK_LEAVE',
    fromDate: futureDate(1),
    toDate: futureDate(3),
    reason: 'Medical appointment and recovery',
    ...overrides,
  }
}

export async function loginToken(baseUrl, user, password = TEST_PASSWORD) {
  const { response, body } = await loginRequest(baseUrl, user.email, password)

  if (response.status !== 200) {
    throw new Error(
      `Test login failed for ${user.email}: ${body?.message ?? response.status}`,
    )
  }

  return body.accessToken
}

export async function apiRequest(
  baseUrl,
  path,
  { method = 'GET', token, body } = {},
) {
  const headers = {}

  if (token) {
    headers.authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    headers['content-type'] = 'application/json'
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let parsedBody = null

  try {
    parsedBody = await response.json()
  } catch {
    parsedBody = null
  }

  return { response, body: parsedBody }
}
