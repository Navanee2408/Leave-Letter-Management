import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestAdmin,
  createTestClass,
  createTestDepartment,
  createTestHod,
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

test('HOD has read-only access to classes in their own department', async () => {
  await withServer(async ({ baseUrl }) => {
    const firstDepartment = await createTestDepartment()
    const secondDepartment = await createTestDepartment()
    const ownClass = await createTestClass(firstDepartment, {
      className: 'Own Department Class',
    })
    const otherClass = await createTestClass(secondDepartment, {
      className: 'Other Department Class',
    })
    const hod = await createTestHod(firstDepartment)
    const token = await loginToken(baseUrl, hod)

    const list = await apiRequest(baseUrl, '/api/v1/classes', { token })
    assert.equal(list.response.status, 200)
    assert.equal(list.body.pagination.total, 1)
    assert.equal(list.body.classes[0].id, ownClass.id)

    const ownDetail = await apiRequest(
      baseUrl,
      `/api/v1/classes/${ownClass.id}`,
      { token },
    )
    assert.equal(ownDetail.response.status, 200)
    assert.equal(ownDetail.body.class.id, ownClass.id)

    const otherDetail = await apiRequest(
      baseUrl,
      `/api/v1/classes/${otherClass.id}`,
      { token },
    )
    assert.equal(otherDetail.response.status, 403)

    const otherDepartmentFilter = await apiRequest(
      baseUrl,
      `/api/v1/classes?department=${secondDepartment.id}`,
      { token },
    )
    assert.equal(otherDepartmentFilter.response.status, 403)

    const create = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: 'HOD Class',
        year: '1',
        section: 'A',
        department: firstDepartment.id,
      },
    })
    assert.equal(create.response.status, 403)

    const update = await apiRequest(
      baseUrl,
      `/api/v1/classes/${ownClass.id}`,
      {
        method: 'PATCH',
        token,
        body: { section: 'B' },
      },
    )
    assert.equal(update.response.status, 403)

    const status = await apiRequest(
      baseUrl,
      `/api/v1/classes/${ownClass.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(status.response.status, 403)
  })
})

test('TUTOR can view only assigned classes and cannot manage classes', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const otherDepartment = await createTestDepartment()
    const tutor = await createTestTutor(department)
    const assignedClass = await createTestClass(department, {
      className: 'Assigned Class',
      assignedTutor: tutor._id,
    })
    const unassignedClass = await createTestClass(department, {
      className: 'Unassigned Class',
    })
    const otherDepartmentClass = await createTestClass(otherDepartment, {
      className: 'Other Department Class',
      assignedTutor: (
        await createTestTutor(otherDepartment)
      )._id,
    })
    const token = await loginToken(baseUrl, tutor)

    const list = await apiRequest(baseUrl, '/api/v1/classes', { token })
    assert.equal(list.response.status, 200)
    assert.equal(list.body.pagination.total, 1)
    assert.equal(list.body.classes[0].id, assignedClass.id)

    const assignedDetail = await apiRequest(
      baseUrl,
      `/api/v1/classes/${assignedClass.id}`,
      { token },
    )
    assert.equal(assignedDetail.response.status, 200)
    assert.equal(assignedDetail.body.class.assignedTutor.id, tutor.id)

    for (const classId of [unassignedClass.id, otherDepartmentClass.id]) {
      const detail = await apiRequest(
        baseUrl,
        `/api/v1/classes/${classId}`,
        { token },
      )
      assert.equal(detail.response.status, 403)
    }

    const create = await apiRequest(baseUrl, '/api/v1/classes', {
      method: 'POST',
      token,
      body: {
        className: 'Tutor Class',
        year: '1',
        section: 'A',
        department: department.id,
      },
    })
    assert.equal(create.response.status, 403)

    const update = await apiRequest(
      baseUrl,
      `/api/v1/classes/${assignedClass.id}`,
      { method: 'PATCH', token, body: { section: 'B' } },
    )
    assert.equal(update.response.status, 403)

    const status = await apiRequest(
      baseUrl,
      `/api/v1/classes/${assignedClass.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(status.response.status, 403)
  })
})

test('PARENT cannot access class administration and anonymous requests fail', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)
    const parent = await createTestUser({ role: ROLES.PARENT })
    const token = await loginToken(baseUrl, parent)

    const list = await apiRequest(baseUrl, '/api/v1/classes', { token })
    assert.equal(list.response.status, 403)

    const detail = await apiRequest(
      baseUrl,
      `/api/v1/classes/${classDocument.id}`,
      { token },
    )
    assert.equal(detail.response.status, 403)

    const anonymous = await apiRequest(baseUrl, '/api/v1/classes')
    assert.equal(anonymous.response.status, 401)
  })
})
