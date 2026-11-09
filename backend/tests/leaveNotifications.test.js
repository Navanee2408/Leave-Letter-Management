import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
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

async function createFamilyWithTutor() {
  const department = await createTestDepartment()
  const assignedTutor = await createTestTutor(department, {
    fullName: 'Assigned Class Tutor',
  })
  const otherTutor = await createTestTutor(department, {
    fullName: 'Other Department Tutor',
  })
  const classDocument = await createTestClass(department, {
    assignedTutor: assignedTutor._id,
  })
  const parent = await createTestUser({ role: 'PARENT' })
  const student = await createTestStudent(department, classDocument)
  await createTestParentStudent(parent, student)

  return {
    department,
    classDocument,
    parent,
    student,
    assignedTutor,
    otherTutor,
  }
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

test('approval notifies the parent and only the assigned class tutor', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamilyWithTutor()
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
        body: { comment: 'Approved for medical reasons' },
      },
    )
    assert.equal(approved.response.status, 200)

    const notifications = await Notification.find({
      application: application.id,
    }).sort({ recipientRole: 1 })

    assert.equal(notifications.length, 2)

    const parentNotification = notifications.find(
      (item) => item.recipientRole === 'PARENT',
    )
    const tutorNotification = notifications.find(
      (item) => item.recipientRole === 'TUTOR',
    )

    assert.ok(parentNotification)
    assert.ok(tutorNotification)
    assert.equal(
      String(parentNotification.recipient),
      String(family.parent._id),
    )
    assert.equal(
      String(tutorNotification.recipient),
      String(family.assignedTutor._id),
    )
    assert.notEqual(
      String(tutorNotification.recipient),
      String(family.otherTutor._id),
    )
    assert.equal(String(tutorNotification.department), family.department.id)
    assert.equal(parentNotification.type, 'LEAVE_APPROVED')
    assert.equal(tutorNotification.type, 'LEAVE_APPROVED')
    assert.equal(parentNotification.isRead, false)
    assert.match(parentNotification.message, /approved/i)
    assert.match(parentNotification.message, /medical reasons/i)
    assert.ok(parentNotification.createdAt)
  })
})

test('rejection notifies the parent but never the tutor', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamilyWithTutor()
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
        body: { reason: 'Document mismatch' },
      },
    )
    assert.equal(rejected.response.status, 200)

    const notifications = await Notification.find({
      application: application.id,
    })
    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].recipientRole, 'PARENT')
    assert.equal(notifications[0].type, 'LEAVE_REJECTED')
    assert.equal(
      String(notifications[0].recipient),
      String(family.parent._id),
    )
    assert.match(notifications[0].message, /Document mismatch/)
  })
})

test('reopening notifies the parent and does not create a new tutor notification', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamilyWithTutor()
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
    const reopened = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/reopen`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Correction required' },
      },
    )
    assert.equal(reopened.response.status, 200)

    const notifications = await Notification.find({
      application: application.id,
    })
    const tutorNotifications = notifications.filter(
      (item) => item.recipientRole === 'TUTOR',
    )
    const parentTypes = notifications
      .filter((item) => item.recipientRole === 'PARENT')
      .map((item) => item.type)
      .sort()

    assert.equal(tutorNotifications.length, 1)
    assert.equal(tutorNotifications[0].type, 'LEAVE_APPROVED')
    assert.deepEqual(parentTypes, ['LEAVE_APPROVED', 'LEAVE_REOPENED'])
    assert.equal(
      notifications.filter((item) => item.type === 'LEAVE_REOPENED').length,
      1,
    )
  })
})

test('tutor approved-leaves endpoint returns only approved leaves from assigned classes', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const assignedTutor = await createTestTutor(department)
    const assignedClass = await createTestClass(department, {
      assignedTutor: assignedTutor._id,
    })
    const otherClass = await createTestClass(department)
    const parent = await createTestUser({ role: 'PARENT' })

    const approvedStudent = await createTestStudent(
      department,
      assignedClass,
      { fullName: 'Approved Student' },
    )
    const rejectedStudent = await createTestStudent(
      department,
      assignedClass,
      { fullName: 'Rejected Student' },
    )
    const pendingStudent = await createTestStudent(
      department,
      assignedClass,
      { fullName: 'Pending Student' },
    )
    const otherClassStudent = await createTestStudent(
      department,
      otherClass,
      { fullName: 'Other Class Student' },
    )

    for (const student of [
      approvedStudent,
      rejectedStudent,
      pendingStudent,
      otherClassStudent,
    ]) {
      await createTestParentStudent(parent, student)
    }

    const hod = await createTestHod(department)
    const parentToken = await loginToken(baseUrl, parent)
    const hodToken = await loginToken(baseUrl, hod)
    const tutorToken = await loginToken(baseUrl, assignedTutor)

    const approvedApplication = await submitApplication(
      baseUrl,
      parentToken,
      approvedStudent,
    )
    const rejectedApplication = await submitApplication(
      baseUrl,
      parentToken,
      rejectedStudent,
    )
    await submitApplication(baseUrl, parentToken, pendingStudent)
    const otherClassApplication = await submitApplication(
      baseUrl,
      parentToken,
      otherClassStudent,
    )

    await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${approvedApplication.id}/approve`,
      { method: 'POST', token: hodToken },
    )
    await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${rejectedApplication.id}/reject`,
      {
        method: 'POST',
        token: hodToken,
        body: { reason: 'Not eligible' },
      },
    )
    await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${otherClassApplication.id}/approve`,
      { method: 'POST', token: hodToken },
    )

    const response = await apiRequest(
      baseUrl,
      '/api/v1/tutors/me/approved-leaves',
      { token: tutorToken },
    )

    assert.equal(response.response.status, 200)
    assert.equal(response.body.success, true)
    assert.equal(response.body.data.pagination.total, 1)
    assert.equal(
      response.body.data.applications.length,
      1,
    )
    assert.equal(
      response.body.data.applications[0].id,
      approvedApplication.id,
    )
    assert.equal(
      response.body.data.applications[0].student.id,
      approvedStudent.id,
    )
    assert.equal(response.body.data.applications[0].status, 'APPROVED')
  })
})

test('parent can read the latest decision and complete history', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamilyWithTutor()
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
        body: { comment: 'Approved with comment' },
      },
    )

    const detail = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}`,
      { token: parentToken },
    )
    assert.equal(detail.response.status, 200)
    assert.equal(detail.body.data.application.status, 'APPROVED')
    assert.equal(
      detail.body.data.application.decisionComment,
      'Approved with comment',
    )
    assert.equal(detail.body.data.application.decidedBy.id, hod.id)

    const history = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${application.id}/history`,
      { token: parentToken },
    )
    assert.equal(history.response.status, 200)
    assert.deepEqual(
      history.body.data.history.map((entry) => entry.action),
      ['SUBMITTED', 'APPROVED'],
    )
    assert.equal(
      history.body.data.history[1].reason,
      'Approved with comment',
    )
  })
})
