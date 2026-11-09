import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { LeaveApplication } from '../src/models/LeaveApplication.js'
import { LeaveApplicationHistory } from '../src/models/LeaveApplicationHistory.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestClass,
  createTestDepartment,
  createTestParentStudent,
  createTestStudent,
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

async function createFamily() {
  const department = await createTestDepartment()
  const classDocument = await createTestClass(department, {
    className: 'Leave Class',
  })
  const parent = await createTestUser({ role: 'PARENT' })
  const student = await createTestStudent(department, classDocument, {
    fullName: 'Leave Student',
  })
  await createTestParentStudent(parent, student)

  return { department, classDocument, parent, student }
}

test('parent submits a leave application with server-derived scope and history', async () => {
  await withServer(async ({ baseUrl }) => {
    const { department, classDocument, parent, student } = await createFamily()
    const token = await loginToken(baseUrl, parent)

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
    assert.equal(body.success, true)
    assert.equal(body.message, 'Leave application submitted successfully')

    const application = body.data.application
    assert.match(application.applicationNumber, /^LA-\d{8}-[0-9A-F]{8}$/)
    assert.equal(application.status, 'PENDING')
    assert.equal(application.totalDays, 3)
    assert.equal(application.parent.id, parent.id)
    assert.equal(application.student.id, student.id)
    assert.equal(application.department.id, department.id)
    assert.equal(application.class.id, classDocument.id)
    assert.equal(application.supportingDocument, null)
    assert.equal('storedName' in (application.supportingDocument ?? {}), false)

    const stored = await LeaveApplication.findById(application.id)
    assert.equal(String(stored.department), department.id)
    assert.equal(String(stored.class), classDocument.id)
    assert.equal(stored.totalDays, 3)
    assert.equal(stored.status, 'PENDING')

    const history = await LeaveApplicationHistory.find({
      application: stored._id,
    })
    assert.equal(history.length, 1)
    assert.equal(history[0].action, 'SUBMITTED')
    assert.equal(String(history[0].actor), parent.id)
    assert.equal(history[0].actorRole, 'PARENT')
    assert.equal(history[0].actorEmail, parent.email)
    assert.equal(history[0].details.applicationNumber, application.applicationNumber)
  })
})

test('application numbers are generated and unique', async () => {
  await withServer(async ({ baseUrl }) => {
    const { parent, student } = await createFamily()
    const token = await loginToken(baseUrl, parent)
    const numbers = []

    for (let index = 0; index < 3; index += 1) {
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
      numbers.push(body.data.application.applicationNumber)
    }

    assert.equal(new Set(numbers).size, 3)
    for (const number of numbers) {
      assert.match(number, /^LA-\d{8}-[0-9A-F]{8}$/)
    }
    assert.equal(await LeaveApplication.countDocuments(), 3)
  })
})

test('server calculates totalDays inclusively', async () => {
  await withServer(async ({ baseUrl }) => {
    const { parent, student } = await createFamily()
    const token = await loginToken(baseUrl, parent)

    const singleDay = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token,
        body: leaveApplicationPayload(student.id, {
          fromDate: futureDate(2),
          toDate: futureDate(2),
        }),
      },
    )
    assert.equal(singleDay.response.status, 201)
    assert.equal(singleDay.body.data.application.totalDays, 1)

    const fiveDays = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token,
        body: leaveApplicationPayload(student.id, {
          fromDate: futureDate(4),
          toDate: futureDate(8),
        }),
      },
    )
    assert.equal(fiveDays.response.status, 201)
    assert.equal(fiveDays.body.data.application.totalDays, 5)
  })
})

test('past dates, invalid ranges, missing reason, and invalid leave type are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const { parent, student } = await createFamily()
    const token = await loginToken(baseUrl, parent)

    const past = await apiRequest(baseUrl, '/api/v1/leave-applications', {
      method: 'POST',
      token,
      body: leaveApplicationPayload(student.id, {
        fromDate: futureDate(-1),
        toDate: futureDate(1),
      }),
    })
    assert.equal(past.response.status, 400)
    assert.equal(past.body.message, 'From date cannot be in the past')

    const reversed = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token,
        body: leaveApplicationPayload(student.id, {
          fromDate: futureDate(5),
          toDate: futureDate(3),
        }),
      },
    )
    assert.equal(reversed.response.status, 400)
    assert.equal(reversed.body.message, 'Validation failed')

    const { reason, ...withoutReason } = leaveApplicationPayload(student.id)
    assert.equal(reason.length > 0, true)
    const missingReason = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      { method: 'POST', token, body: withoutReason },
    )
    assert.equal(missingReason.response.status, 400)

    const invalidType = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token,
        body: leaveApplicationPayload(student.id, {
          leaveType: 'HOLIDAY',
        }),
      },
    )
    assert.equal(invalidType.response.status, 400)

    assert.equal(await LeaveApplication.countDocuments(), 0)
  })
})

test('client-supplied department, class, status, totals, and numbers are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const { department, classDocument, parent, student } = await createFamily()
    const token = await loginToken(baseUrl, parent)
    const basePayload = leaveApplicationPayload(student.id)

    const manipulations = [
      { department: department.id },
      { class: classDocument.id },
      { status: 'APPROVED' },
      { totalDays: 99 },
      { applicationNumber: 'LA-HACKED-0001' },
      { parent: parent.id },
      { submittedAt: new Date().toISOString() },
    ]

    for (const manipulation of manipulations) {
      const { response } = await apiRequest(
        baseUrl,
        '/api/v1/leave-applications',
        {
          method: 'POST',
          token,
          body: { ...basePayload, ...manipulation },
        },
      )
      assert.equal(response.status, 400)
    }

    assert.equal(await LeaveApplication.countDocuments(), 0)
  })
})

test('application history is readable and applications cannot be modified', async () => {
  await withServer(async ({ baseUrl }) => {
    const { parent, student } = await createFamily()
    const token = await loginToken(baseUrl, parent)

    const created = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token,
        body: leaveApplicationPayload(student.id),
      },
    )
    assert.equal(created.response.status, 201)
    const applicationId = created.body.data.application.id

    const detail = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${applicationId}`,
      { token },
    )
    assert.equal(detail.response.status, 200)
    assert.equal(detail.body.data.application.id, applicationId)

    const history = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${applicationId}/history`,
      { token },
    )
    assert.equal(history.response.status, 200)
    assert.equal(history.body.success, true)
    assert.equal(history.body.data.application.id, applicationId)
    assert.equal(history.body.data.application.status, 'PENDING')
    assert.equal(history.body.data.history.length, 1)
    assert.equal(history.body.data.history[0].action, 'SUBMITTED')
    assert.equal(history.body.data.history[0].actor.id, parent.id)

    const statusPatch = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${applicationId}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: 'APPROVED' },
      },
    )
    assert.equal(statusPatch.response.status, 404)

    const edit = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${applicationId}`,
      {
        method: 'PATCH',
        token,
        body: { reason: 'Changed reason after submission' },
      },
    )
    assert.equal(edit.response.status, 404)

    const stored = await LeaveApplication.findById(applicationId)
    assert.equal(stored.status, 'PENDING')
    assert.equal(stored.accountStatus, undefined)
    assert.equal(
      await LeaveApplicationHistory.countDocuments({
        application: applicationId,
      }),
      1,
    )
  })
})
