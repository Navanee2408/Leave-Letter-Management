import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { Class } from '../src/models/Class.js'
import { User } from '../src/models/User.js'
import {
  TEST_PASSWORD,
  createTestUser,
  loginRequest,
} from './support/authTestUtils.js'
import {
  apiRequest,
  createTestAdmin,
  createTestClass,
  createTestDepartment,
  createTestHod,
  createTestStudent,
  createTestTutor,
  loginToken,
  uniqueSuffix,
} from './support/managementTestUtils.js'
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './support/testDatabase.js'
import { withServer } from './support/testServer.js'

before(connectTestDatabase)
after(disconnectTestDatabase)
beforeEach(clearTestDatabase)

const TUTOR_PASSWORD = 'TutorPass!123'

async function adminToken(baseUrl) {
  const admin = await createTestAdmin()
  return loginToken(baseUrl, admin)
}

function tutorPayload(department, overrides = {}) {
  const suffix = uniqueSuffix()

  return {
    fullName: 'Prof. Test Tutor',
    email: `tutor-${suffix.toLowerCase()}@example.test`,
    password: TUTOR_PASSWORD,
    phone: '+1 555 0100',
    employeeId: `TUT-${suffix}`,
    department: department.id,
    ...overrides,
  }
}

test('ADMIN can create a tutor with hashed password and class assignments', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const firstClass = await createTestClass(department, {
      className: 'Tutor Class A',
    })
    const secondClass = await createTestClass(department, {
      className: 'Tutor Class B',
    })
    const payload = tutorPayload(department, {
      assignedClasses: [firstClass.id, secondClass.id],
    })

    const { response, body } = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token,
      body: payload,
    })

    assert.equal(response.status, 201)
    assert.equal(body.success, true)
    assert.equal(body.tutor.role, ROLES.TUTOR)
    assert.equal(body.tutor.department.id, department.id)
    assert.equal(body.tutor.accountStatus, ACCOUNT_STATUS.ACTIVE)
    assert.equal(body.tutor.assignedClasses.length, 2)
    assert.equal('password' in body.tutor, false)
    assert.equal(JSON.stringify(body).includes('$2'), false)

    const stored = await User.findById(body.tutor.id).select('+password')
    assert.match(stored.password, /^\$2[aby]\$/)
    assert.notEqual(stored.password, TUTOR_PASSWORD)
    assert.equal(await stored.comparePassword(TUTOR_PASSWORD), true)
    assert.equal(stored.assignedClasses.length, 2)

    const storedFirstClass = await Class.findById(firstClass.id)
    const storedSecondClass = await Class.findById(secondClass.id)
    assert.equal(String(storedFirstClass.assignedTutor), body.tutor.id)
    assert.equal(String(storedSecondClass.assignedTutor), body.tutor.id)

    const duplicateEmail = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token,
      body: tutorPayload(department, {
        email: payload.email,
        employeeId: `TUT-${uniqueSuffix()}`,
      }),
    })
    assert.equal(duplicateEmail.response.status, 409)
    assert.equal(
      duplicateEmail.body.message,
      'An account with this email already exists',
    )

    const duplicateEmployeeId = await apiRequest(
      baseUrl,
      '/api/v1/tutors',
      {
        method: 'POST',
        token,
        body: tutorPayload(department, {
          employeeId: payload.employeeId.toLowerCase(),
        }),
      },
    )
    assert.equal(duplicateEmployeeId.response.status, 409)
    assert.equal(
      duplicateEmployeeId.body.message,
      'This employee ID is already in use',
    )
  })
})

test('tutors require an active department and department-consistent classes', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const firstDepartment = await createTestDepartment()
    const secondDepartment = await createTestDepartment()
    const inactiveDepartment = await createTestDepartment({
      status: ACCOUNT_STATUS.INACTIVE,
    })
    const otherDepartmentClass = await createTestClass(secondDepartment)
    const inactiveClass = await createTestClass(firstDepartment, {
      status: ACCOUNT_STATUS.INACTIVE,
    })
    const alreadyAssignedClass = await createTestClass(firstDepartment)
    const existingTutor = await createTestTutor(firstDepartment)
    await Class.updateOne(
      { _id: alreadyAssignedClass._id },
      { $set: { assignedTutor: existingTutor._id } },
    )

    const crossDepartment = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token,
      body: tutorPayload(firstDepartment, {
        assignedClasses: [otherDepartmentClass.id],
      }),
    })
    assert.equal(crossDepartment.response.status, 400)
    assert.equal(
      crossDepartment.body.message,
      'Tutors can only be assigned to classes in their own department',
    )

    const inactive = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token,
      body: tutorPayload(inactiveDepartment),
    })
    assert.equal(inactive.response.status, 400)

    const inactiveClassResponse = await apiRequest(
      baseUrl,
      '/api/v1/tutors',
      {
        method: 'POST',
        token,
        body: tutorPayload(firstDepartment, {
          assignedClasses: [inactiveClass.id],
        }),
      },
    )
    assert.equal(inactiveClassResponse.response.status, 400)
    assert.equal(
      inactiveClassResponse.body.message,
      'Tutors can only be assigned to active classes',
    )

    const occupiedClass = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token,
      body: tutorPayload(firstDepartment, {
        assignedClasses: [alreadyAssignedClass.id],
      }),
    })
    assert.equal(occupiedClass.response.status, 409)
    assert.equal(
      occupiedClass.body.message,
      'This class already has an assigned tutor',
    )

    const missingClass = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token,
      body: tutorPayload(firstDepartment, {
        assignedClasses: ['507f1f77bcf86cd799439011'],
      }),
    })
    assert.equal(missingClass.response.status, 404)
  })
})

test('tutor updates, status changes, and inactive login protection work', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const firstClass = await createTestClass(department, {
      className: 'First Assignment Class',
    })
    const secondClass = await createTestClass(department, {
      className: 'Second Assignment Class',
    })
    const payload = tutorPayload(department, {
      assignedClasses: [firstClass.id],
    })

    const created = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token,
      body: payload,
    })
    assert.equal(created.response.status, 201)

    const login = await loginRequest(
      baseUrl,
      payload.email,
      TUTOR_PASSWORD,
    )
    assert.equal(login.response.status, 200)
    assert.equal(login.body.user.role, ROLES.TUTOR)

    const updated = await apiRequest(
      baseUrl,
      `/api/v1/tutors/${created.body.tutor.id}`,
      {
        method: 'PATCH',
        token,
        body: {
          fullName: '  Prof. Updated   Tutor ',
          assignedClasses: [secondClass.id],
        },
      },
    )
    assert.equal(updated.response.status, 200)
    assert.equal(updated.body.tutor.fullName, 'Prof. Updated Tutor')
    assert.equal(updated.body.tutor.assignedClasses.length, 1)
    assert.equal(
      updated.body.tutor.assignedClasses[0].id,
      secondClass.id,
    )

    const oldClass = await Class.findById(firstClass.id)
    const newClass = await Class.findById(secondClass.id)
    assert.equal(oldClass.assignedTutor, null)
    assert.equal(String(newClass.assignedTutor), created.body.tutor.id)

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/tutors/${created.body.tutor.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivated.response.status, 200)

    const blockedLogin = await loginRequest(
      baseUrl,
      payload.email,
      TUTOR_PASSWORD,
    )
    assert.equal(blockedLogin.response.status, 403)
    assert.equal(blockedLogin.body.message, 'Account is inactive')

    const existingToken = await apiRequest(baseUrl, '/api/v1/auth/me', {
      token: login.body.accessToken,
    })
    assert.equal(existingToken.response.status, 403)

    const reactivated = await apiRequest(
      baseUrl,
      `/api/v1/tutors/${created.body.tutor.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.ACTIVE },
      },
    )
    assert.equal(reactivated.response.status, 200)

    for (const body of [
      { role: ROLES.ADMIN },
      { password: 'AnotherTutorPass!123' },
      { accountStatus: ACCOUNT_STATUS.INACTIVE },
    ]) {
      const rejected = await apiRequest(
        baseUrl,
        `/api/v1/tutors/${created.body.tutor.id}`,
        { method: 'PATCH', token, body },
      )
      assert.equal(rejected.response.status, 400)
    }
  })
})

test('tutor self-service endpoints expose only assigned classes and students', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const firstTutor = await createTestTutor(department, {
      fullName: 'First Tutor',
    })
    const secondTutor = await createTestTutor(department, {
      fullName: 'Second Tutor',
    })
    const firstClass = await createTestClass(department, {
      className: 'First Tutor Class',
      assignedTutor: firstTutor._id,
    })
    const secondClass = await createTestClass(department, {
      className: 'Second Tutor Class',
      assignedTutor: secondTutor._id,
    })
    const ownStudent = await createTestStudent(department, firstClass, {
      fullName: 'Own Student',
    })
    const otherStudent = await createTestStudent(department, secondClass, {
      fullName: 'Other Student',
    })
    const token = await loginToken(baseUrl, firstTutor, TEST_PASSWORD)

    const classes = await apiRequest(baseUrl, '/api/v1/tutors/me/classes', {
      token,
    })
    assert.equal(classes.response.status, 200)
    assert.equal(classes.body.classes.length, 1)
    assert.equal(classes.body.classes[0].id, firstClass.id)

    const students = await apiRequest(
      baseUrl,
      '/api/v1/tutors/me/students',
      { token },
    )
    assert.equal(students.response.status, 200)
    assert.equal(students.body.students.length, 1)
    assert.equal(students.body.students[0].id, ownStudent.id)
    assert.equal(
      students.body.students.some(
        (student) => student.id === otherStudent.id,
      ),
      false,
    )

    const parent = await createTestUser({ role: ROLES.PARENT })
    const parentToken = await loginToken(baseUrl, parent)
    const denied = await apiRequest(
      baseUrl,
      '/api/v1/tutors/me/classes',
      { token: parentToken },
    )
    assert.equal(denied.response.status, 403)
  })
})

test('HOD can read tutors only in their department and management is restricted', async () => {
  await withServer(async ({ baseUrl }) => {
    const firstDepartment = await createTestDepartment()
    const secondDepartment = await createTestDepartment()
    const ownTutor = await createTestTutor(firstDepartment, {
      fullName: 'Own Tutor',
    })
    const otherTutor = await createTestTutor(secondDepartment, {
      fullName: 'Other Tutor',
    })
    const hod = await createTestHod(firstDepartment)
    const hodToken = await loginToken(baseUrl, hod)

    const list = await apiRequest(baseUrl, '/api/v1/tutors', {
      token: hodToken,
    })
    assert.equal(list.response.status, 200)
    assert.equal(list.body.pagination.total, 1)
    assert.equal(list.body.tutors[0].id, ownTutor.id)
    assert.equal('password' in list.body.tutors[0], false)

    const ownDetail = await apiRequest(
      baseUrl,
      `/api/v1/tutors/${ownTutor.id}`,
      { token: hodToken },
    )
    assert.equal(ownDetail.response.status, 200)

    const otherDetail = await apiRequest(
      baseUrl,
      `/api/v1/tutors/${otherTutor.id}`,
      { token: hodToken },
    )
    assert.equal(otherDetail.response.status, 403)

    const create = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token: hodToken,
      body: tutorPayload(firstDepartment),
    })
    assert.equal(create.response.status, 403)

    const tutor = await createTestTutor(firstDepartment)
    const parent = await createTestUser({ role: ROLES.PARENT })
    for (const user of [tutor, parent]) {
      const token = await loginToken(baseUrl, user)
      const denied = await apiRequest(baseUrl, '/api/v1/tutors', { token })
      assert.equal(denied.response.status, 403)
    }

    const anonymous = await apiRequest(baseUrl, '/api/v1/tutors')
    assert.equal(anonymous.response.status, 401)
  })
})
