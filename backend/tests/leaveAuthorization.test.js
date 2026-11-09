import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestAdmin,
  createTestClass,
  createTestDepartment,
  createTestHod,
  createTestParentStudent,
  createTestStudent,
  createTestTutor,
  futureDate,
  leaveApplicationPayload,
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

async function createFamily(className = 'Leave Class') {
  const department = await createTestDepartment()
  const classDocument = await createTestClass(department, { className })
  const parent = await createTestUser({ role: 'PARENT' })
  const student = await createTestStudent(department, classDocument, {
    fullName: `Student ${className}`,
  })
  await createTestParentStudent(parent, student)

  return { department, classDocument, parent, student }
}

async function submitApplication(baseUrl, token, student, overrides = {}) {
  const { response, body } = await apiRequest(
    baseUrl,
    '/api/v1/leave-applications',
    {
      method: 'POST',
      token,
      body: leaveApplicationPayload(student.id, overrides),
    },
  )

  assert.equal(response.status, 201)
  return body.data.application
}

test('parent can submit for multiple linked children and filter their own list', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)
    const parent = await createTestUser({ role: 'PARENT' })
    const firstStudent = await createTestStudent(department, classDocument, {
      fullName: 'First Child',
    })
    const secondStudent = await createTestStudent(department, classDocument, {
      fullName: 'Second Child',
    })
    await createTestParentStudent(parent, firstStudent)
    await createTestParentStudent(parent, secondStudent)

    const token = await loginToken(baseUrl, parent)
    const firstApplication = await submitApplication(
      baseUrl,
      token,
      firstStudent,
    )
    const secondApplication = await submitApplication(
      baseUrl,
      token,
      secondStudent,
    )

    const all = await apiRequest(baseUrl, '/api/v1/leave-applications/my', {
      token,
    })
    assert.equal(all.response.status, 200)
    assert.equal(all.body.data.pagination.total, 2)
    assert.deepEqual(
      all.body.data.applications
        .map((application) => application.id)
        .sort(),
      [firstApplication.id, secondApplication.id].sort(),
    )

    const byChild = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/my?studentId=${firstStudent.id}`,
      { token },
    )
    assert.equal(byChild.body.data.pagination.total, 1)
    assert.equal(byChild.body.data.applications[0].student.id, firstStudent.id)

    const byStatus = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications/my?status=PENDING',
      { token },
    )
    assert.equal(byStatus.body.data.pagination.total, 2)

    const byDate = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/my?fromDate=${futureDate(2)}&toDate=${futureDate(2)}`,
      { token },
    )
    assert.equal(byDate.body.data.pagination.total, 2)
  })
})

test('unlinked children and other parents applications are inaccessible', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)
    const firstParent = await createTestUser({ role: 'PARENT' })
    const secondParent = await createTestUser({ role: 'PARENT' })
    const firstStudent = await createTestStudent(department, classDocument, {
      fullName: 'First Child',
    })
    const secondStudent = await createTestStudent(department, classDocument, {
      fullName: 'Second Child',
    })
    await createTestParentStudent(firstParent, firstStudent)
    await createTestParentStudent(secondParent, secondStudent)

    const firstToken = await loginToken(baseUrl, firstParent)
    const secondToken = await loginToken(baseUrl, secondParent)

    const ownApplication = await submitApplication(
      baseUrl,
      firstToken,
      firstStudent,
    )

    const unlinked = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token: firstToken,
        body: leaveApplicationPayload(secondStudent.id),
      },
    )
    assert.equal(unlinked.response.status, 403)
    assert.equal(
      unlinked.body.message,
      'You can only submit leave applications for your linked children',
    )

    for (const path of [
      `/api/v1/leave-applications/${ownApplication.id}`,
      `/api/v1/leave-applications/${ownApplication.id}/history`,
      `/api/v1/leave-applications/${ownApplication.id}/document`,
    ]) {
      const denied = await apiRequest(baseUrl, path, { token: secondToken })
      assert.equal(denied.response.status, 403)
    }

    const otherList = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications/my',
      { token: secondToken },
    )
    assert.equal(otherList.body.data.pagination.total, 0)

    const ownList = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications/my',
      { token: firstToken },
    )
    assert.equal(ownList.body.data.pagination.total, 1)
  })
})

test('HOD sees only own-department applications and cannot use another department id', async () => {
  await withServer(async ({ baseUrl }) => {
    const firstFamily = await createFamily('First Department Class')
    const secondFamily = await createFamily('Second Department Class')
    const firstHod = await createTestHod(firstFamily.department)
    const admin = await createTestAdmin()

    const firstParentToken = await loginToken(
      baseUrl,
      firstFamily.parent,
    )
    const secondParentToken = await loginToken(
      baseUrl,
      secondFamily.parent,
    )
    const firstApplication = await submitApplication(
      baseUrl,
      firstParentToken,
      firstFamily.student,
    )
    const secondApplication = await submitApplication(
      baseUrl,
      secondParentToken,
      secondFamily.student,
    )

    const hodToken = await loginToken(baseUrl, firstHod)
    const list = await apiRequest(baseUrl, '/api/v1/leave-applications', {
      token: hodToken,
    })
    assert.equal(list.response.status, 200)
    assert.equal(list.body.data.pagination.total, 1)
    assert.equal(list.body.data.applications[0].id, firstApplication.id)
    assert.equal(
      list.body.data.applications[0].department.id,
      firstFamily.department.id,
    )

    const pending = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications?status=PENDING',
      { token: hodToken },
    )
    assert.equal(pending.body.data.pagination.total, 1)

    const byClass = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications?classId=${firstFamily.classDocument.id}`,
      { token: hodToken },
    )
    assert.equal(byClass.body.data.pagination.total, 1)

    const byStudent = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications?studentId=${firstFamily.student.id}`,
      { token: hodToken },
    )
    assert.equal(byStudent.body.data.pagination.total, 1)

    const ownDetail = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${firstApplication.id}`,
      { token: hodToken },
    )
    assert.equal(ownDetail.response.status, 200)

    const ownHistory = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${firstApplication.id}/history`,
      { token: hodToken },
    )
    assert.equal(ownHistory.response.status, 200)
    assert.equal(ownHistory.body.data.history.length, 1)

    for (const path of [
      `/api/v1/leave-applications/${secondApplication.id}`,
      `/api/v1/leave-applications/${secondApplication.id}/history`,
    ]) {
      const denied = await apiRequest(baseUrl, path, { token: hodToken })
      assert.equal(denied.response.status, 403)
    }

    const foreignDepartmentFilter = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications?department=${secondFamily.department.id}`,
      { token: hodToken },
    )
    assert.equal(foreignDepartmentFilter.response.status, 403)

    const adminToken = await loginToken(baseUrl, admin)
    const adminList = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      { token: adminToken },
    )
    assert.equal(adminList.response.status, 200)
    assert.equal(adminList.body.data.pagination.total, 2)
  })
})

test('role restrictions and authentication are enforced', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const parentToken = await loginToken(baseUrl, family.parent)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )
    const tutor = await createTestTutor(family.department)
    const hod = await createTestHod(family.department)
    const tutorToken = await loginToken(baseUrl, tutor)
    const hodToken = await loginToken(baseUrl, hod)

    assert.equal(
      (
        await apiRequest(baseUrl, '/api/v1/leave-applications', {
          token: tutorToken,
        })
      ).response.status,
      403,
    )
    assert.equal(
      (
        await apiRequest(
          baseUrl,
          `/api/v1/leave-applications/${application.id}`,
          { token: tutorToken },
        )
      ).response.status,
      403,
    )
    assert.equal(
      (
        await apiRequest(baseUrl, '/api/v1/leave-applications/my', {
          token: tutorToken,
        })
      ).response.status,
      403,
    )

    const hodSubmit = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token: hodToken,
        body: leaveApplicationPayload(family.student.id),
      },
    )
    assert.equal(hodSubmit.response.status, 403)

    assert.equal(
      (await apiRequest(baseUrl, '/api/v1/leave-applications')).response
        .status,
      401,
    )
    assert.equal(
      (
        await apiRequest(baseUrl, '/api/v1/leave-applications/my')
      ).response.status,
      401,
    )
    assert.equal(
      (
        await apiRequest(
          baseUrl,
          `/api/v1/leave-applications/${application.id}/history`,
        )
      ).response.status,
      401,
    )
  })
})
