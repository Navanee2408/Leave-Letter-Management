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

async function createFamily() {
  const department = await createTestDepartment()
  const classDocument = await createTestClass(department)
  const parent = await createTestUser({ role: 'PARENT' })
  const student = await createTestStudent(department, classDocument)
  await createTestParentStudent(parent, student)
  return { department, classDocument, parent, student }
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

test('reopening an approved application preserves the previous decision and adds history', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
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
      {
        method: 'POST',
        token: hodToken,
        body: { comment: 'Originally approved' },
      },
    )

    const reopened = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Dates need correction' },
      },
    )

    assert.equal(reopened.response.status, 200)
    assert.equal(
      reopened.body.message,
      'Leave application reopened successfully',
    )

    const result = reopened.body.data.application
    assert.equal(result.status, 'PENDING')
    // Previous approval details remain visible until a new decision is made.
    assert.equal(result.decisionComment, 'Originally approved')
    assert.equal(result.decidedBy.id, hod.id)
    assert.equal(result.reopenReason, 'Dates need correction')
    assert.equal(result.reopenedBy.id, hod.id)
    assert.ok(result.reopenedAt)

    const history = await LeaveApplicationHistory.find({
      application: application.id,
    }).sort({ createdAt: 1 })

    assert.deepEqual(
      history.map((entry) => entry.action),
      ['SUBMITTED', 'APPROVED', 'REOPENED'],
    )
    assert.equal(history[1].reason, 'Originally approved')
    assert.equal(history[2].previousStatus, 'APPROVED')
    assert.equal(history[2].newStatus, 'PENDING')
    assert.equal(history[2].reason, 'Dates need correction')
    assert.equal(String(history[2].actor), hod.id)
  })
})

test('reopening a rejected application preserves the rejection reason', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
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
      `/api/v1/leave-applications/${application.id}/reject`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Insufficient evidence' },
      },
    )

    const reopened = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Parent submitted the missing evidence' },
      },
    )

    assert.equal(reopened.response.status, 200)
    const result = reopened.body.data.application
    assert.equal(result.status, 'PENDING')
    assert.equal(result.rejectionReason, 'Insufficient evidence')
    assert.equal(result.reopenReason, 'Parent submitted the missing evidence')

    const history = await LeaveApplicationHistory.find({
      application: application.id,
      action: 'REOPENED',
    })
    assert.equal(history.length, 1)
    assert.equal(history[0].previousStatus, 'REJECTED')
    assert.equal(history[0].newStatus, 'PENDING')
  })
})

test('reopening without a reason or with a whitespace-only reason fails', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
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

    const missing = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      { method: 'POST', token: hodToken, body: {} },
    )
    assert.equal(missing.response.status, 400)

    const blank = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      { method: 'POST', token: hodToken, body: { reason: '   ' } },
    )
    assert.equal(blank.response.status, 400)

    assert.equal(
      (await LeaveApplication.findById(application.id)).status,
      'APPROVED',
    )
    assert.equal(
      await LeaveApplicationHistory.countDocuments({
        application: application.id,
        action: 'REOPENED',
      }),
      0,
    )
  })
})

test('reopen transitions are validated and a new decision adds history without overwriting old decisions', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const hod = await createTestHod(family.department)
    const parentToken = await loginToken(baseUrl, family.parent)
    const hodToken = await loginToken(baseUrl, hod)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    const pendingReopen = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      { method: 'POST', token: hodToken, body: { reason: 'Not decided yet' } },
    )
    assert.equal(pendingReopen.response.status, 409)

    await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/approve`,
      {
        method: 'POST',
        token: hodToken,
        body: { comment: 'First approval' },
      },
    )
    await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Review again' },
      },
    )
    const rejected = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reject`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Still not sufficient' },
      },
    )
    assert.equal(rejected.response.status, 200)

    const history = await LeaveApplicationHistory.find({
      application: application.id,
    }).sort({ createdAt: 1 })

    assert.deepEqual(
      history.map((entry) => entry.action),
      ['SUBMITTED', 'APPROVED', 'REOPENED', 'REJECTED'],
    )
    assert.equal(history[1].reason, 'First approval')
    assert.equal(history[2].reason, 'Review again')
    assert.equal(history[3].reason, 'Still not sufficient')

    const stored = await LeaveApplication.findById(application.id)
    assert.equal(stored.status, 'REJECTED')
    assert.equal(stored.rejectionReason, 'Still not sufficient')

    const notifications = await Notification.find({
      application: application.id,
    })
    const types = notifications.map((item) => item.type).sort()
    assert.deepEqual(types, [
      'LEAVE_APPROVED',
      'LEAVE_REJECTED',
      'LEAVE_REOPENED',
    ])
    assert.equal(
      notifications.every((item) => item.recipientRole === 'PARENT'),
      true,
    )
  })
})
