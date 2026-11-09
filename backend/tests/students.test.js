import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { Student } from '../src/models/Student.js'
import {
  apiRequest,
  createTestAdmin,
  createTestClass,
  createTestDepartment,
  createTestHod,
  createTestParentStudent,
  createTestStudent,
  createTestTutor,
  loginToken,
  uniqueSuffix,
} from './support/managementTestUtils.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './support/testDatabase.js'
import { withServer } from './support/testServer.js'

before(connectTestDatabase)
after(disconnectTestDatabase)
beforeEach(clearTestDatabase)

async function adminToken(baseUrl) {
  const admin = await createTestAdmin()
  return loginToken(baseUrl, admin)
}

test('ADMIN can create students with normalized values and unique identifiers', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const otherDepartment = await createTestDepartment()
    const classDocument = await createTestClass(department, {
      className: 'Student Class',
    })
    const otherClass = await createTestClass(otherDepartment, {
      className: 'Other Department Class',
    })

    const { response, body } = await apiRequest(baseUrl, '/api/v1/students', {
      method: 'POST',
      token,
      body: {
        fullName: '  Ananya   Sharma ',
        registerNumber: ' cse24001 ',
        email: 'Student@Example.Test',
        phone: '+1 555 0100',
        department: department.id,
        class: classDocument.id,
      },
    })

    assert.equal(response.status, 201)
    assert.equal(body.student.fullName, 'Ananya Sharma')
    assert.equal(body.student.registerNumber, 'CSE24001')
    assert.equal(body.student.email, 'student@example.test')
    assert.equal(body.student.department.id, department.id)
    assert.equal(body.student.class.id, classDocument.id)
    assert.equal(body.student.accountStatus, ACCOUNT_STATUS.ACTIVE)

    const duplicateRegister = await apiRequest(
      baseUrl,
      '/api/v1/students',
      {
        method: 'POST',
        token,
        body: {
          fullName: 'Duplicate Register',
          registerNumber: 'cse24001',
          department: department.id,
          class: classDocument.id,
        },
      },
    )
    assert.equal(duplicateRegister.response.status, 409)
    assert.equal(
      duplicateRegister.body.message,
      'A student with this register number already exists',
    )

    const duplicateEmail = await apiRequest(baseUrl, '/api/v1/students', {
      method: 'POST',
      token,
      body: {
        fullName: 'Duplicate Email',
        registerNumber: `CSE-${uniqueSuffix()}`,
        email: 'STUDENT@example.test',
        department: department.id,
        class: classDocument.id,
      },
    })
    assert.equal(duplicateEmail.response.status, 409)
    assert.equal(
      duplicateEmail.body.message,
      'A student with this email already exists',
    )

    const mismatch = await apiRequest(baseUrl, '/api/v1/students', {
      method: 'POST',
      token,
      body: {
        fullName: 'Mismatch Student',
        registerNumber: `MIS-${uniqueSuffix()}`,
        department: department.id,
        class: otherClass.id,
      },
    })
    assert.equal(mismatch.response.status, 400)
    assert.equal(
      mismatch.body.message,
      "Student's department must match the class department",
    )

    const inactiveClass = await createTestClass(department, {
      status: ACCOUNT_STATUS.INACTIVE,
    })
    const inactiveClassResponse = await apiRequest(
      baseUrl,
      '/api/v1/students',
      {
        method: 'POST',
        token,
        body: {
          fullName: 'Inactive Class Student',
          registerNumber: `INA-${uniqueSuffix()}`,
          department: department.id,
          class: inactiveClass.id,
        },
      },
    )
    assert.equal(inactiveClassResponse.response.status, 400)
    assert.equal(
      inactiveClassResponse.body.message,
      'Cannot assign a student to an inactive class',
    )

    const inactiveDepartment = await createTestDepartment({
      status: ACCOUNT_STATUS.INACTIVE,
    })
    const classInInactiveDepartment = await createTestClass(
      inactiveDepartment,
    )
    const inactiveDepartmentResponse = await apiRequest(
      baseUrl,
      '/api/v1/students',
      {
        method: 'POST',
        token,
        body: {
          fullName: 'Inactive Department Student',
          registerNumber: `IND-${uniqueSuffix()}`,
          department: inactiveDepartment.id,
          class: classInInactiveDepartment.id,
        },
      },
    )
    assert.equal(inactiveDepartmentResponse.response.status, 400)
    assert.equal(
      inactiveDepartmentResponse.body.message,
      'Cannot assign a student to an inactive department',
    )

    const missingClass = await apiRequest(baseUrl, '/api/v1/students', {
      method: 'POST',
      token,
      body: {
        fullName: 'Missing Class Student',
        registerNumber: `MIS-${uniqueSuffix()}`,
        department: department.id,
        class: '507f1f77bcf86cd799439011',
      },
    })
    assert.equal(missingClass.response.status, 404)
    assert.equal(missingClass.body.message, 'Class not found')
  })
})

test('student updates, status changes, search, and pagination work', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const otherDepartment = await createTestDepartment()
    const classDocument = await createTestClass(department, {
      className: 'Update Class',
    })
    const otherClass = await createTestClass(otherDepartment, {
      className: 'Other Department Class',
    })
    const first = await createTestStudent(department, classDocument, {
      fullName: 'Alpha Student',
      registerNumber: `ALPHA-${uniqueSuffix()}`,
    })
    const second = await createTestStudent(department, classDocument, {
      fullName: 'Beta Student',
      registerNumber: `BETA-${uniqueSuffix()}`,
    })
    const third = await createTestStudent(department, classDocument, {
      fullName: 'Gamma Student',
      registerNumber: `GAMMA-${uniqueSuffix()}`,
    })

    const updated = await apiRequest(
      baseUrl,
      `/api/v1/students/${first.id}`,
      {
        method: 'PATCH',
        token,
        body: {
          fullName: '  Alpha   Updated ',
          email: `updated-${uniqueSuffix().toLowerCase()}@example.test`,
          phone: '+1 555 0199',
        },
      },
    )
    assert.equal(updated.response.status, 200)
    assert.equal(updated.body.student.fullName, 'Alpha Updated')

    const mismatchUpdate = await apiRequest(
      baseUrl,
      `/api/v1/students/${first.id}`,
      {
        method: 'PATCH',
        token,
        body: { class: otherClass.id },
      },
    )
    assert.equal(mismatchUpdate.response.status, 400)
    assert.equal(
      mismatchUpdate.body.message,
      "Student's department must match the class department",
    )

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/students/${first.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivated.response.status, 200)
    assert.equal(deactivated.body.student.accountStatus, ACCOUNT_STATUS.INACTIVE)

    const inactiveList = await apiRequest(
      baseUrl,
      '/api/v1/students?status=INACTIVE',
      { token },
    )
    assert.equal(inactiveList.body.pagination.total, 1)
    assert.equal(inactiveList.body.students[0].id, first.id)

    const search = await apiRequest(
      baseUrl,
      `/api/v1/students?search=${encodeURIComponent(second.registerNumber)}`,
      { token },
    )
    assert.equal(search.body.pagination.total, 1)
    assert.equal(search.body.students[0].id, second.id)

    const page = await apiRequest(
      baseUrl,
      '/api/v1/students?page=2&limit=2',
      { token },
    )
    assert.equal(page.response.status, 200)
    assert.equal(page.body.pagination.page, 2)
    assert.equal(page.body.pagination.limit, 2)
    assert.equal(page.body.pagination.total, 3)
    assert.equal(page.body.pagination.totalPages, 2)
    assert.equal(page.body.students.length, 1)

    const protectedField = await apiRequest(
      baseUrl,
      `/api/v1/students/${second.id}`,
      { method: 'PATCH', token, body: { role: ROLES.ADMIN } },
    )
    assert.equal(protectedField.response.status, 400)

    const invalidId = await apiRequest(
      baseUrl,
      '/api/v1/students/not-an-object-id',
      { token },
    )
    assert.equal(invalidId.response.status, 400)

    const deactivatedAgain = await apiRequest(
      baseUrl,
      `/api/v1/students/${first.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.ACTIVE },
      },
    )
    assert.equal(deactivatedAgain.response.status, 200)

    assert.equal(await Student.countDocuments(), 3)
  })
})

test('HOD, TUTOR, and PARENT student access is scoped to their own data', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const otherDepartment = await createTestDepartment()
    const ownClass = await createTestClass(department, {
      className: 'Own Class',
    })
    const otherClassInDepartment = await createTestClass(department, {
      className: 'Other Class In Department',
    })
    const otherDepartmentClass = await createTestClass(otherDepartment, {
      className: 'Other Department Class',
    })
    const ownTutor = await createTestTutor(department)
    const otherTutor = await createTestTutor(otherDepartment)
    await ownClass.updateOne({ assignedTutor: ownTutor._id })
    await otherDepartmentClass.updateOne({
      assignedTutor: otherTutor._id,
    })

    const ownStudent = await createTestStudent(department, ownClass, {
      fullName: 'Own Tutor Student',
    })
    const unassignedStudent = await createTestStudent(
      department,
      otherClassInDepartment,
      { fullName: 'Unassigned Class Student' },
    )
    const otherDepartmentStudent = await createTestStudent(
      otherDepartment,
      otherDepartmentClass,
      { fullName: 'Other Department Student' },
    )
    const parent = await createTestUser({ role: ROLES.PARENT })
    await createTestParentStudent(parent, ownStudent)

    const admin = await createTestAdmin()
    const hod = await createTestHod(department)
    const adminTokenValue = await loginToken(baseUrl, admin)
    const hodToken = await loginToken(baseUrl, hod)
    const tutorToken = await loginToken(baseUrl, ownTutor)
    const parentToken = await loginToken(baseUrl, parent)

    const adminList = await apiRequest(baseUrl, '/api/v1/students', {
      token: adminTokenValue,
    })
    assert.equal(adminList.body.pagination.total, 3)

    const hodList = await apiRequest(baseUrl, '/api/v1/students', {
      token: hodToken,
    })
    assert.equal(hodList.body.pagination.total, 2)
    assert.deepEqual(
      hodList.body.students.map((student) => student.id).sort(),
      [ownStudent.id, unassignedStudent.id].sort(),
    )

    const hodOtherDetail = await apiRequest(
      baseUrl,
      `/api/v1/students/${otherDepartmentStudent.id}`,
      { token: hodToken },
    )
    assert.equal(hodOtherDetail.response.status, 403)

    const tutorList = await apiRequest(baseUrl, '/api/v1/students', {
      token: tutorToken,
    })
    assert.equal(tutorList.body.pagination.total, 1)
    assert.equal(tutorList.body.students[0].id, ownStudent.id)

    for (const studentId of [unassignedStudent.id, otherDepartmentStudent.id]) {
      const detail = await apiRequest(
        baseUrl,
        `/api/v1/students/${studentId}`,
        { token: tutorToken },
      )
      assert.equal(detail.response.status, 403)
    }

    const parentList = await apiRequest(baseUrl, '/api/v1/students', {
      token: parentToken,
    })
    assert.equal(parentList.body.pagination.total, 1)
    assert.equal(parentList.body.students[0].id, ownStudent.id)

    const parentOwnDetail = await apiRequest(
      baseUrl,
      `/api/v1/students/${ownStudent.id}`,
      { token: parentToken },
    )
    assert.equal(parentOwnDetail.response.status, 200)

    for (const studentId of [unassignedStudent.id, otherDepartmentStudent.id]) {
      const detail = await apiRequest(
        baseUrl,
        `/api/v1/students/${studentId}`,
        { token: parentToken },
      )
      assert.equal(detail.response.status, 403)
    }

    const hodCreate = await apiRequest(baseUrl, '/api/v1/students', {
      method: 'POST',
      token: hodToken,
      body: {
        fullName: 'Forbidden Student',
        registerNumber: `FOR-${uniqueSuffix()}`,
        department: department.id,
        class: ownClass.id,
      },
    })
    assert.equal(hodCreate.response.status, 403)

    const parentCreate = await apiRequest(baseUrl, '/api/v1/students', {
      method: 'POST',
      token: parentToken,
      body: {
        fullName: 'Forbidden Student',
        registerNumber: `FOR-${uniqueSuffix()}`,
        department: department.id,
        class: ownClass.id,
      },
    })
    assert.equal(parentCreate.response.status, 403)
  })
})
