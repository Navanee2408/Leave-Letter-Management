import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { LeaveApplication } from '../src/models/LeaveApplication.js'
import { LeaveApplicationHistory } from '../src/models/LeaveApplicationHistory.js'
import { Notification } from '../src/models/Notification.js'
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

test('HOD approves an own-department pending application with a comment', async () => {
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

    const approved = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/approve`,
      {
        method: 'POST',
        token: hodToken,
        body: { comment: 'Approved after verification' },
      },
    )

    assert.equal(approved.response.status, 200)
    assert.equal(approved.body.success, true)
    assert.equal(
      approved.body.message,
      'Leave application approved successfully',
    )

    const result = approved.body.data.application
    assert.equal(result.status, 'APPROVED')
    assert.equal(result.decisionComment, 'Approved after verification')
    assert.equal(result.rejectionReason, null)
    assert.equal(result.decidedBy.id, hod.id)
    assert.ok(result.decidedAt)

    const history = await LeaveApplicationHistory.find({
      application: application.id,
    }).sort({ createdAt: 1 })

    assert.equal(history.length, 2)
    assert.equal(history[0].action, 'SUBMITTED')
    assert.equal(history[1].action, 'APPROVED')
    assert.equal(String(history[1].actor), hod.id)
    assert.equal(history[1].actorRole, 'HOD')
    assert.equal(history[1].actorName, hod.fullName)
    assert.equal(history[1].previousStatus, 'PENDING')
    assert.equal(history[1].newStatus, 'APPROVED')
    assert.equal(history[1].reason, 'Approved after verification')
  })
})

test('HOD rejects an own-department application with a mandatory reason', async () => {
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

    const rejected = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reject`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Supporting document does not match the dates' },
      },
    )

    assert.equal(rejected.response.status, 200)
    assert.equal(
      rejected.body.message,
      'Leave application rejected successfully',
    )
    assert.equal(rejected.body.data.application.status, 'REJECTED')
    assert.equal(
      rejected.body.data.application.rejectionReason,
      'Supporting document does not match the dates',
    )
    assert.equal(rejected.body.data.application.decisionComment, null)
    assert.equal(rejected.body.data.application.decidedBy.id, hod.id)

    const history = await LeaveApplicationHistory.findOne({
      application: application.id,
      action: 'REJECTED',
    })
    assert.equal(history.previousStatus, 'PENDING')
    assert.equal(history.newStatus, 'REJECTED')
    assert.equal(
      history.reason,
      'Supporting document does not match the dates',
    )

    const notifications = await Notification.find({
      application: application.id,
    })
    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].recipientRole, 'PARENT')
  })
})

test('rejection without a reason or with a whitespace-only reason fails', async () => {
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

    const missing = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reject`,
      { method: 'POST', token: hodToken, body: {} },
    )
    assert.equal(missing.response.status, 400)
    assert.equal(missing.body.success, false)

    const blank = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reject`,
      { method: 'POST', token: hodToken, body: { reason: '    ' } },
    )
    assert.equal(blank.response.status, 400)

    const stored = await LeaveApplication.findById(application.id)
    assert.equal(stored.status, 'PENDING')
    assert.equal(
      await LeaveApplicationHistory.countDocuments({
        application: application.id,
      }),
      1,
    )
  })
})

test('HOD cannot decide applications from another department', async () => {
  await withServer(async ({ baseUrl }) => {
    const ownFamily = await createFamily()
    const otherFamily = await createFamily()
    const ownHod = await createTestHod(ownFamily.department)
    const otherHod = await createTestHod(otherFamily.department)
    const ownParentToken = await loginToken(baseUrl, ownFamily.parent)
    const otherParentToken = await loginToken(baseUrl, otherFamily.parent)
    const otherHodToken = await loginToken(baseUrl, otherHod)
    const ownHodToken = await loginToken(baseUrl, ownHod)
    const otherApplication = await submitApplication(
      baseUrl,
      otherParentToken,
      otherFamily.student,
    )
    const ownApplication = await submitApplication(
      baseUrl,
      ownParentToken,
      ownFamily.student,
    )

    const approve = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${otherApplication.id}/approve`,
      { method: 'POST', token: ownHodToken },
    )
    assert.equal(approve.response.status, 403)

    const reject = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${otherApplication.id}/reject`,
      { method: 'POST', token: ownHodToken, body: { reason: 'No' } },
    )
    assert.equal(reject.response.status, 403)

    await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${otherApplication.id}/approve`,
      { method: 'POST', token: otherHodToken },
    )
    const reopen = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${otherApplication.id}/reopen`,
      { method: 'POST', token: ownHodToken, body: { reason: 'Recheck' } },
    )
    assert.equal(reopen.response.status, 403)

    // The unrelated own application remains untouched and pending.
    assert.equal(
      (await LeaveApplication.findById(ownApplication.id)).status,
      'PENDING',
    )
  })
})

test('parent, tutor, and admin cannot invoke HOD decision endpoints', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const tutor = await createTestTutor(family.department)
    const admin = await createTestAdmin()
    const parentToken = await loginToken(baseUrl, family.parent)
    const tutorToken = await loginToken(baseUrl, tutor)
    const adminToken = await loginToken(baseUrl, admin)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    const attempts = [
      {
        actor: 'parent',
        token: parentToken,
        path: 'approve',
        body: {},
      },
      {
        actor: 'tutor',
        token: tutorToken,
        path: 'reject',
        body: { reason: 'Not allowed' },
      },
      {
        actor: 'admin',
        token: adminToken,
        path: 'reopen',
        body: { reason: 'Not allowed' },
      },
    ]

    for (const attempt of attempts) {
      const response = await apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/${attempt.path}`,
        {
          method: 'POST',
          token: attempt.token,
          body: attempt.body,
        },
      )
      assert.equal(response.response.status, 403, attempt.actor)
    }

    assert.equal(
      (await LeaveApplication.findById(application.id)).status,
      'PENDING',
    )
    assert.equal(
      await LeaveApplicationHistory.countDocuments({
        application: application.id,
      }),
      1,
    )
  })
})

test('client-supplied actor, status, and decision fields are rejected', async () => {
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

    const manipulatedApprove = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/approve`,
      {
        method: 'POST',
        token: hodToken,
        body: {
          comment: 'Valid comment',
          status: 'APPROVED',
          decidedBy: hod.id,
          decidedAt: new Date().toISOString(),
          department: family.department.id,
        },
      },
    )
    assert.equal(manipulatedApprove.response.status, 400)

    const manipulatedReject = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reject`,
      {
        method: 'POST',
        token: hodToken,
        body: {
          reason: 'Valid rejection reason',
          status: 'REJECTED',
          actor: hod.id,
        },
      },
    )
    assert.equal(manipulatedReject.response.status, 400)

    const approved = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/approve`,
      { method: 'POST', token: hodToken },
    )
    assert.equal(approved.response.status, 200)

    const manipulatedReopen = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      {
        method: 'POST',
        token: hodToken,
        body: {
          reason: 'Valid reopen reason',
          decidedBy: hod.id,
          status: 'PENDING',
        },
      },
    )
    assert.equal(manipulatedReopen.response.status, 400)

    assert.equal(
      (await LeaveApplication.findById(application.id)).status,
      'APPROVED',
    )
    assert.equal(
      await LeaveApplicationHistory.countDocuments({
        application: application.id,
      }),
      2,
    )
  })
})

test('repeated approvals and rejections return conflict', async () => {
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

    const first = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/approve`,
      { method: 'POST', token: hodToken },
    )
    assert.equal(first.response.status, 200)

    const second = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/approve`,
      { method: 'POST', token: hodToken },
    )
    assert.equal(second.response.status, 409)

    const rejectAfterApproval = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reject`,
      { method: 'POST', token: hodToken, body: { reason: 'Too late' } },
    )
    assert.equal(rejectAfterApproval.response.status, 409)

    assert.equal(
      await LeaveApplicationHistory.countDocuments({
        application: application.id,
      }),
      2,
    )
    assert.equal(
      await Notification.countDocuments({ application: application.id }),
      1,
    )
  })
})
