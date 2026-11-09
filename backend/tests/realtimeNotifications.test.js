import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { io as createSocketClient } from 'socket.io-client'
import { env } from '../src/config/env.js'
import { LeaveApplication } from '../src/models/LeaveApplication.js'
import { LeaveApplicationHistory } from '../src/models/LeaveApplicationHistory.js'
import { Notification } from '../src/models/Notification.js'
import { createNotification } from '../src/services/notification.service.js'
import {
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
  signAccessToken,
} from '../src/services/token.service.js'
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openSocket(baseUrl, token) {
  return new Promise((resolve, reject) => {
    const socket = createSocketClient(baseUrl, {
      auth: token === undefined ? {} : { token },
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
      timeout: 5000,
    })

    const timer = setTimeout(() => {
      socket.close()
      reject(new Error('socket connect timeout'))
    }, 6000)

    socket.once('connect', () => {
      clearTimeout(timer)
      resolve(socket)
    })

    socket.once('connect_error', (error) => {
      clearTimeout(timer)
      socket.close()
      reject(error)
    })
  })
}

function waitForEvent(socket, event, predicate = () => true, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler)
      reject(new Error(`timed out waiting for ${event}`))
    }, timeoutMs)

    function handler(payload) {
      if (!predicate(payload)) return
      clearTimeout(timer)
      socket.off(event, handler)
      resolve(payload)
    }

    socket.on(event, handler)
  })
}

function expiredAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, type: 'access' },
    env.jwtAccessSecret,
    {
      algorithm: 'HS256',
      expiresIn: -1,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    },
  )
}

async function createFamily() {
  const department = await createTestDepartment()
  const assignedTutor = await createTestTutor(department, {
    fullName: 'Assigned Class Tutor',
  })
  const otherTutor = await createTestTutor(department, {
    fullName: 'Unassigned Tutor',
  })
  const classDocument = await createTestClass(department, {
    assignedTutor: assignedTutor._id,
  })
  const parent = await createTestUser({ role: 'PARENT' })
  const student = await createTestStudent(department, classDocument)
  await createTestParentStudent(parent, student)
  const hod = await createTestHod(department)

  return {
    department,
    classDocument,
    parent,
    student,
    hod,
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

test('missing, invalid, and expired socket tokens are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const user = await createTestUser({ role: 'PARENT' })

    await assert.rejects(openSocket(baseUrl, undefined), /Authentication required/)
    await assert.rejects(openSocket(baseUrl, 'not-a-token'), /Invalid or expired/)
    await assert.rejects(
      openSocket(baseUrl, expiredAccessToken(user)),
      /Invalid or expired/,
    )
  })
})

test('inactive accounts cannot connect to Socket.IO', async () => {
  await withServer(async ({ baseUrl }) => {
    const user = await createTestUser({
      role: 'PARENT',
      accountStatus: 'INACTIVE',
    })

    await assert.rejects(
      openSocket(baseUrl, signAccessToken(user)),
      /Account is inactive/,
    )
  })
})

test('an authenticated socket receives its own new notification and read event', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const parent = await createTestUser({ role: 'PARENT' })
    const socket = await openSocket(baseUrl, signAccessToken(parent))

    try {
      const newEvent = waitForEvent(socket, 'notification:new')

      const notification = await createNotification({
        recipient: parent._id,
        recipientRole: 'PARENT',
        department: department._id,
        application: new LeaveApplication()._id,
        title: 'New leave update',
        message: 'A leave application was updated',
        type: 'LEAVE_APPROVED',
      })

      const payload = await newEvent
      assert.equal(payload.notification.id, notification.id)
      assert.equal(String(payload.notification.recipient), String(parent._id))
      assert.equal(payload.notification.title, 'New leave update')
      assert.equal(payload.unreadCount, 1)

      const readEvent = waitForEvent(socket, 'notification:read')
      const token = signAccessToken(parent)
      const marked = await apiRequest(
        baseUrl,
        `/api/v1/notifications/${notification.id}/read`,
        { method: 'PATCH', token },
      )

      assert.equal(marked.response.status, 200)

      const readPayload = await readEvent
      assert.equal(readPayload.notificationId, notification.id)
      assert.equal(readPayload.unreadCount, 0)
    } finally {
      socket.close()
    }
  })
})

test('a user never receives another user\'s socket notifications', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const parentA = await createTestUser({ role: 'PARENT' })
    const parentB = await createTestUser({ role: 'PARENT' })
    const socketA = await openSocket(baseUrl, signAccessToken(parentA))
    const socketB = await openSocket(baseUrl, signAccessToken(parentB))

    try {
      let leakedToB = false
      socketB.on('notification:new', () => {
        leakedToB = true
      })

      const newEvent = waitForEvent(socketA, 'notification:new')

      await createNotification({
        recipient: parentA._id,
        recipientRole: 'PARENT',
        department: department._id,
        application: new LeaveApplication()._id,
        title: 'Private notification',
        message: 'Only parent A should receive this',
        type: 'LEAVE_REJECTED',
      })

      const payload = await newEvent
      assert.equal(String(payload.notification.recipient), String(parentA._id))

      await delay(400)
      assert.equal(leakedToB, false)
    } finally {
      socketA.close()
      socketB.close()
    }
  })
})

test('approval notifies the parent and exactly the assigned tutor over Socket.IO', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const parentToken = await loginToken(baseUrl, family.parent)
    const hodToken = await loginToken(baseUrl, family.hod)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    const parentSocket = await openSocket(
      baseUrl,
      signAccessToken(family.parent),
    )
    const tutorSocket = await openSocket(
      baseUrl,
      signAccessToken(family.assignedTutor),
    )
    const otherTutorSocket = await openSocket(
      baseUrl,
      signAccessToken(family.otherTutor),
    )

    try {
      let otherTutorReceived = false
      otherTutorSocket.on('notification:new', () => {
        otherTutorReceived = true
      })

      const parentEvent = waitForEvent(parentSocket, 'notification:new')
      const tutorEvent = waitForEvent(tutorSocket, 'notification:new')

      const approved = await apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/approve`,
        {
          method: 'POST',
          token: hodToken,
          body: { comment: 'Approved for the socket test' },
        },
      )
      assert.equal(approved.response.status, 200)

      const parentPayload = await parentEvent
      const tutorPayload = await tutorEvent

      assert.equal(parentPayload.notification.type, 'LEAVE_APPROVED')
      assert.equal(
        String(parentPayload.notification.recipient),
        String(family.parent._id),
      )
      assert.equal(tutorPayload.notification.type, 'LEAVE_APPROVED')
      assert.equal(
        String(tutorPayload.notification.recipient),
        String(family.assignedTutor._id),
      )

      await delay(400)
      assert.equal(otherTutorReceived, false)

      assert.equal(
        await Notification.countDocuments({ application: application.id }),
        2,
      )
    } finally {
      parentSocket.close()
      tutorSocket.close()
      otherTutorSocket.close()
    }
  })
})

test('rejection and reopening notify the parent but never the tutor over Socket.IO', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const parentToken = await loginToken(baseUrl, family.parent)
    const hodToken = await loginToken(baseUrl, family.hod)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    const parentSocket = await openSocket(
      baseUrl,
      signAccessToken(family.parent),
    )
    const tutorSocket = await openSocket(
      baseUrl,
      signAccessToken(family.assignedTutor),
    )

    try {
      let tutorEvents = 0
      tutorSocket.on('notification:new', () => {
        tutorEvents += 1
      })

      const rejectionEvent = waitForEvent(parentSocket, 'notification:new')
      const rejected = await apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/reject`,
        {
          method: 'POST',
          token: hodToken,
          body: { reason: 'Missing supporting document' },
        },
      )
      assert.equal(rejected.response.status, 200)

      const rejectionPayload = await rejectionEvent
      assert.equal(rejectionPayload.notification.type, 'LEAVE_REJECTED')

      await delay(300)
      assert.equal(tutorEvents, 0)

      const reopenEvent = waitForEvent(
        parentSocket,
        'notification:new',
        (payload) => payload.notification.type === 'LEAVE_REOPENED',
      )
      const reopened = await apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/reopen`,
        {
          method: 'POST',
          token: hodToken,
          body: { reason: 'Parent supplied the document' },
        },
      )
      assert.equal(reopened.response.status, 200)

      const reopenPayload = await reopenEvent
      assert.equal(reopenPayload.notification.type, 'LEAVE_REOPENED')

      await delay(300)
      assert.equal(tutorEvents, 0)

      assert.equal(
        await Notification.countDocuments({
          application: application.id,
          recipientRole: 'TUTOR',
        }),
        0,
      )
    } finally {
      parentSocket.close()
      tutorSocket.close()
    }
  })
})

test('a rolled-back decision emits no socket notification', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const parentToken = await loginToken(baseUrl, family.parent)
    const hodToken = await loginToken(baseUrl, family.hod)
    const application = await submitApplication(
      baseUrl,
      parentToken,
      family.student,
    )

    const parentSocket = await openSocket(
      baseUrl,
      signAccessToken(family.parent),
    )

    const originalCreate = Notification.create
    let parentReceived = false
    parentSocket.on('notification:new', () => {
      parentReceived = true
    })

    try {
      // Force notification persistence to fail after the status update. The
      // service must roll the transition back and emit nothing.
      Notification.create = async () => {
        throw new Error('Forced notification failure')
      }

      const approved = await apiRequest(
        baseUrl,
        `/api/v1/leave-applications/${application.id}/approve`,
        { method: 'POST', token: hodToken },
      )

      assert.equal(approved.response.status, 500)

      await delay(400)
      assert.equal(parentReceived, false)

      const stored = await LeaveApplication.findById(application.id)
      assert.equal(stored.status, 'PENDING')
      assert.equal(
        await LeaveApplicationHistory.countDocuments({
          application: application.id,
        }),
        1,
      )
      assert.equal(
        await Notification.countDocuments({ application: application.id }),
        0,
      )
    } finally {
      Notification.create = originalCreate
      parentSocket.close()
    }
  })
})
