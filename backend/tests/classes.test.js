import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { Class } from '../src/models/Class.js'
import { User } from '../src/models/User.js'
import {
  apiRequest,
  createTestAdmin,
  createTestClass,
  createTestDepartment,
  createTestTutor,
  loginToken,
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

async function adminToken(baseUrl) {
  const admin = await createTestAdmin()
  return loginToken(baseUrl, admin)
}

test('ADMIN can create a class with an assigned tutor', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const tutor = await createTestTutor(department)

    const { response, body } = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: '  Computer   Science Alpha ',
        year: 3,
        section: 'A',
        department: department.id,
        assignedTutor: tutor.id,
      },
    })

    assert.equal(response.status, 201)
    assert.equal(body.success, true)
    assert.equal(body.class.className, 'Computer Science Alpha')
    assert.equal(body.class.year, '3')
    assert.equal(body.class.section, 'A')
    assert.equal(body.class.status, ACCOUNT_STATUS.ACTIVE)
    assert.equal(body.class.department.id, department.id)
    assert.equal(body.class.assignedTutor.id, tutor.id)
    assert.equal('classNameKey' in body.class, false)

    const storedTutor = await User.findById(tutor.id)
    assert.equal(storedTutor.assignedClasses.length, 1)
    assert.equal(String(storedTutor.assignedClasses[0]), body.class.id)
  })
})

test('class names are unique per department but may repeat elsewhere', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const firstDepartment = await createTestDepartment()
    const secondDepartment = await createTestDepartment()

    const first = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: 'CSE Alpha',
        year: '3',
        section: 'A',
        department: firstDepartment.id,
      },
    })
    assert.equal(first.response.status, 201)

    const duplicate = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: '  cse   alpha ',
        year: '4',
        section: 'B',
        department: firstDepartment.id,
      },
    })
    assert.equal(duplicate.response.status, 409)
    assert.equal(
      duplicate.body.message,
      'A class with this name already exists in this department',
    )

    const otherDepartment = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: 'CSE Alpha',
        year: '3',
        section: 'A',
        department: secondDepartment.id,
      },
    })
    assert.equal(otherDepartment.response.status, 201)

    assert.equal(await Class.countDocuments(), 2)
  })
})

test('class creation enforces active departments and department-consistent tutors', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const activeDepartment = await createTestDepartment()
    const inactiveDepartment = await createTestDepartment({
      status: ACCOUNT_STATUS.INACTIVE,
    })
    const otherDepartment = await createTestDepartment()
    const otherTutor = await createTestTutor(otherDepartment)
    const inactiveTutor = await createTestTutor(activeDepartment, {
      accountStatus: ACCOUNT_STATUS.INACTIVE,
    })

    const inactive = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: 'Inactive Class',
        year: '3',
        section: 'A',
        department: inactiveDepartment.id,
      },
    })
    assert.equal(inactive.response.status, 400)
    assert.equal(inactive.body.message, 'Cannot use an inactive department')

    const crossDepartmentTutor = await apiRequest(
      baseUrl,
      '/api/v1/classes',
      {
        method: 'POST',
        token,
        body: {
          className: 'Cross Tutor Class',
          year: '3',
          section: 'A',
          department: activeDepartment.id,
          assignedTutor: otherTutor.id,
        },
      },
    )
    assert.equal(crossDepartmentTutor.response.status, 400)
    assert.equal(
      crossDepartmentTutor.body.message,
      'Assigned tutor must belong to the same department as the class',
    )

    const inactiveTutorResponse = await apiRequest(
      baseUrl,
      '/api/v1/classes',
      {
        method: 'POST',
        token,
        body: {
          className: 'Inactive Tutor Class',
          year: '3',
          section: 'A',
          department: activeDepartment.id,
          assignedTutor: inactiveTutor.id,
        },
      },
    )
    assert.equal(inactiveTutorResponse.response.status, 400)
    assert.equal(
      inactiveTutorResponse.body.message,
      'Assigned tutor must be an active account',
    )

    const missingTutor = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: 'Missing Tutor Class',
        year: '3',
        section: 'A',
        department: activeDepartment.id,
        assignedTutor: '507f1f77bcf86cd799439011',
      },
    })
    assert.equal(missingTutor.response.status, 404)
    assert.equal(missingTutor.body.message, 'Assigned tutor not found')
  })
})

test('class updates reassign tutors and keep departments consistent', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const firstDepartment = await createTestDepartment()
    const secondDepartment = await createTestDepartment()
    const firstTutor = await createTestTutor(firstDepartment)
    const secondTutor = await createTestTutor(secondDepartment)
    const classDocument = await createTestClass(firstDepartment, {
      assignedTutor: firstTutor._id,
    })
    await User.updateOne(
      { _id: firstTutor._id },
      { $addToSet: { assignedClasses: classDocument._id } },
    )

    const crossDepartment = await apiRequest(
      baseUrl,
      `/api/v1/classes/${classDocument.id}`,
      {
        method: 'PATCH',
        token,
        body: { department: secondDepartment.id },
      },
    )
    assert.equal(crossDepartment.response.status, 400)

    const moved = await apiRequest(
      baseUrl,
      `/api/v1/classes/${classDocument.id}`,
      {
        method: 'PATCH',
        token,
        body: {
          department: secondDepartment.id,
          assignedTutor: secondTutor.id,
          className: 'Moved Class',
          section: 'B',
        },
      },
    )
    assert.equal(moved.response.status, 200)
    assert.equal(moved.body.class.className, 'Moved Class')
    assert.equal(moved.body.class.department.id, secondDepartment.id)
    assert.equal(moved.body.class.assignedTutor.id, secondTutor.id)

    const oldTutor = await User.findById(firstTutor.id)
    const newTutor = await User.findById(secondTutor.id)
    assert.equal(oldTutor.assignedClasses.length, 0)
    assert.equal(newTutor.assignedClasses.length, 1)

    const cleared = await apiRequest(
      baseUrl,
      `/api/v1/classes/${classDocument.id}`,
      {
        method: 'PATCH',
        token,
        body: { assignedTutor: null },
      },
    )
    assert.equal(cleared.response.status, 200)
    assert.equal(cleared.body.class.assignedTutor, null)
  })
})

test('class status changes and deletion is not exposed', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/classes/${classDocument.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivated.response.status, 200)
    assert.equal(deactivated.body.class.status, ACCOUNT_STATUS.INACTIVE)

    const activated = await apiRequest(
      baseUrl,
      `/api/v1/classes/${classDocument.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.ACTIVE },
      },
    )
    assert.equal(activated.response.status, 200)
    assert.equal(activated.body.class.status, ACCOUNT_STATUS.ACTIVE)

    const removed = await apiRequest(
      baseUrl,
      `/api/v1/classes/${classDocument.id}`,
      { method: 'DELETE', token },
    )
    assert.equal(removed.response.status, 404)
    assert.match(removed.body.message, /Route not found: DELETE/)

    const invalid = await apiRequest(
      baseUrl,
      '/api/v1/classes/not-an-object-id',
      { token },
    )
    assert.equal(invalid.response.status, 400)

    const protectedField = await apiRequest(
      baseUrl,
      '/api/v1/classes',
      {
        method: 'POST',
        token,
        body: {
          className: 'Protected Class',
          year: '3',
          section: 'A',
          department: department.id,
          status: ACCOUNT_STATUS.INACTIVE,
        },
      },
    )
    assert.equal(protectedField.response.status, 400)
  })
})
