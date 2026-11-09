import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { LeaveApplication } from '../src/models/LeaveApplication.js'
import { LeaveApplicationHistory } from '../src/models/LeaveApplicationHistory.js'
import { Notification } from '../src/models/Notification.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestClass,
  createTestDepartment,
  createTestHod,
  createTestParentStudent,
  createTestStudent,
  createTestTutor,
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

async function setup() {
  const department = await createTestDepartment()
  const tutor = await createTestTutor(department)
  const classDocument = await createTestClass(department, {
    assignedTutor: tutor._id,
  })
  const parent = await createTestUser({ role: 'PARENT' })
  const student = await createTestStudent(department, classDocument)
  await createTestParentStudent(parent, student)

  return { department, classDocument, parent, student, tutor }
}

async function submitApplication(baseUrl, token, student) {
  const { response, body } = await apiRequest(
    baseUrl,
    '/api/v1/leave-applications',
    {
      method: 'POST',
      token,
      body: leaveApplicationPayload(student.id),
    },
  )
  assert.equal(response.status, 201)
  return body.data.application
}

test('concurrent approvals create exactly one decision and one history record', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await setup()
    const hod = await createTestHod(family.department)
    const parentToken = await loginToken(baseUrl, family.parent)
    const hodToken = await loginToken(baseUrl, hod)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    const results = await Promise.all([
      apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/approve`,
        { method: 'POST', token: hodToken },
      ),
      apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/approve`,
        { method: 'POST', token: hodToken },
      ),
    ])

    const statuses = results.map((result) => result.response.status).sort()
    assert.deepEqual(statuses, [200, 409])

    const stored = await LeaveApplication.findById(application.id)
    assert.equal(stored.status, 'APPROVED')

    const history = await LeaveApplicationHistory.find({
      application: application.id,
    })
    assert.equal(history.length, 2)
    assert.equal(
      history.filter((entry) => entry.action === 'APPROVED').length,
      1,
    )

    const notifications = await Notification.find({
      application: application.id,
    })
    assert.equal(notifications.length, 2)
    assert.equal(
      notifications.filter((item) => item.recipientRole === 'PARENT').length,
      1,
    )
    assert.equal(
      notifications.filter((item) => item.recipientRole === 'TUTOR').length,
      1,
    )
  })
})

test('concurrent approve and reject cannot both succeed', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await setup()
    const hod = await createTestHod(family.department)
    const parentToken = await loginToken(baseUrl, family.parent)
    const hodToken = await loginToken(baseUrl, hod)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    const results = await Promise.all([
      apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/approve`,
        { method: 'POST', token: hodToken },
      ),
      apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/reject`,
        {
          method: 'POST',
          token: hodToken,
          body: { reason: 'Concurrent rejection attempt' },
        },
      ),
    ])

    const statuses = results.map((result) => result.response.status).sort()
    assert.deepEqual(statuses, [200, 409])

    const stored = await LeaveApplication.findById(application.id)
    assert.ok(['APPROVED', 'REJECTED'].includes(stored.status))

    const history = await LeaveApplicationHistory.find({
      application: application.id,
    })
    assert.equal(history.length, 2)
    assert.equal(
      history.filter((entry) =>
        ['APPROVED', 'REJECTED'].includes(entry.action),
      ).length,
      1,
    )

    const notifications = await Notification.find({
      application: application.id,
    })
    assert.equal(
      notifications.length,
      stored.status === 'APPROVED' ? 2 : 1,
    )
  })
})

test('concurrent reopens create exactly one reopen history record', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await setup()
    const hod = await createTestHod(family.department)
    const parentToken = await loginToken(baseUrl, family.parent)
    const hodToken = await loginToken(baseUrl, hod)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/approve`,
      { method: 'POST', token: hodToken },
    )

    const results = await Promise.all([
      apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/reopen`,
        {
          method: 'POST',
          token: hodToken,
          body: { reason: 'First correction request' },
        },
      ),
      apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/reopen`,
        {
          method: 'POST',
          token: hodToken,
          body: { reason: 'Second correction request' },
        },
      ),
    ])

    const statuses = results.map((result) => result.response.status).sort()
    assert.deepEqual(statuses, [200, 409])

    const stored = await LeaveApplication.findById(application.id)
    assert.equal(stored.status, 'PENDING')

    const history = await LeaveApplicationHistory.find({
      application: application.id,
    }).sort({ createdAt: 1 })
    assert.deepEqual(
      history.map((entry) => entry.action),
      ['SUBMITTED', 'APPROVED', 'REOPENED'],
    )
    assert.equal(
      history.filter((entry) => entry.action === 'REOPENED').length,
      1,
    )

    const reopenNotifications = await Notification.find({
      application: application.id,
      type: 'LEAVE_REOPENED',
    })
    assert.equal(reopenNotifications.length, 1)
    assert.equal(reopenNotifications[0].recipientRole, 'PARENT')
  })
})
