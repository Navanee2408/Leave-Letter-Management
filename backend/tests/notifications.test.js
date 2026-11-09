import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { Notification } from '../src/models/Notification.js'
import {
  apiRequest,
  createTestAdmin,
  createTestDepartment,
  createTestHod,
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

function createStoredNotification(recipient, department, overrides = {}) {
  return Notification.create({
    recipient: recipient._id,
    recipientRole: recipient.role,
    department: department._id,
    application: new mongoose.Types.ObjectId(),
    title: 'Test notification',
    message: 'Test notification message',
    type: 'LEAVE_APPROVED',
    ...overrides,
  })
}

async function createParentWithDepartment() {
  const department = await createTestDepartment()
  const parent = await createTestUser({
    fullName: `Parent ${uniqueSuffix()}`,
    role: 'PARENT',
  })

  return { department, parent }
}

test('ADMIN, HOD, TUTOR, and PARENT can retrieve only their own notifications', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const admin = await createTestAdmin({ department: department._id })
    const hod = await createTestHod(department)
    const tutor = await createTestTutor(department)
    const parent = await createTestUser({ role: 'PARENT' })
    const users = [admin, hod, tutor, parent]

    const notifications = []

    for (const user of users) {
      notifications.push(
        await createStoredNotification(user, department, {
          title: `Notification for ${user.role}`,
        }),
      )
    }

    for (let index = 0; index < users.length; index += 1) {
      const user = users[index]
      const token = await loginToken(baseUrl, user)
      const { response, body } = await apiRequest(
        baseUrl,
        '/api/v1/notifications/my',
        { token },
      )

      assert.equal(response.status, 200)
      assert.equal(body.success, true)
      assert.equal(body.data.pagination.total, 1)
      assert.equal(body.data.notifications.length, 1)
      assert.equal(body.data.notifications[0].id, notifications[index].id)
      assert.equal(
        String(body.data.notifications[0].recipient),
        String(user._id),
      )
      assert.equal(body.data.notifications[0].recipientRole, user.role)
    }
  })
})

test('a user cannot retrieve another user\'s notifications', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const parentA = await createTestUser({ role: 'PARENT' })
    const parentB = await createTestUser({ role: 'PARENT' })
    await createStoredNotification(parentA, department)
    await createStoredNotification(parentB, department)

    const tokenA = await loginToken(baseUrl, parentA)
    const tokenB = await loginToken(baseUrl, parentB)

    const ownInbox = await apiRequest(baseUrl, '/api/v1/notifications/my', {
      token: tokenA,
    })
    assert.equal(ownInbox.response.status, 200)
    assert.equal(ownInbox.body.data.pagination.total, 1)
    assert.equal(
      String(ownInbox.body.data.notifications[0].recipient),
      String(parentA._id),
    )

    const otherInbox = await apiRequest(baseUrl, '/api/v1/notifications/my', {
      token: tokenB,
    })
    assert.equal(otherInbox.response.status, 200)
    assert.equal(otherInbox.body.data.pagination.total, 1)
    assert.equal(
      String(otherInbox.body.data.notifications[0].recipient),
      String(parentB._id),
    )
  })
})

test('notification pagination, isRead filter, and type filter work newest first', async () => {
  await withServer(async ({ baseUrl }) => {
    const { department, parent } = await createParentWithDepartment()
    const token = await loginToken(baseUrl, parent)

    const created = []

    created.push(
      await createStoredNotification(parent, department, {
        type: 'LEAVE_REJECTED',
        isRead: false,
        title: 'One',
      }),
    )
    created.push(
      await createStoredNotification(parent, department, {
        type: 'LEAVE_REJECTED',
        isRead: true,
        title: 'Two',
      }),
    )
    created.push(
      await createStoredNotification(parent, department, {
        type: 'LEAVE_APPROVED',
        isRead: false,
        title: 'Three',
      }),
    )
    created.push(
      await createStoredNotification(parent, department, {
        type: 'LEAVE_REOPENED',
        isRead: false,
        title: 'Four',
      }),
    )
    created.push(
      await createStoredNotification(parent, department, {
        type: 'LEAVE_APPROVED',
        isRead: true,
        title: 'Five',
      }),
    )

    const pageTwo = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?page=2&limit=2',
      { token },
    )
    assert.equal(pageTwo.response.status, 200)
    assert.equal(pageTwo.body.data.pagination.page, 2)
    assert.equal(pageTwo.body.data.pagination.limit, 2)
    assert.equal(pageTwo.body.data.pagination.total, 5)
    assert.equal(pageTwo.body.data.pagination.totalPages, 3)
    assert.equal(pageTwo.body.data.notifications.length, 2)

    const newest = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?limit=1',
      { token },
    )
    assert.equal(newest.response.status, 200)
    assert.equal(newest.body.data.notifications[0].id, created[4].id)

    const unread = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?isRead=false',
      { token },
    )
    assert.equal(unread.response.status, 200)
    assert.equal(unread.body.data.pagination.total, 3)
    assert.equal(
      unread.body.data.notifications.every((item) => item.isRead === false),
      true,
    )

    const rejected = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?type=LEAVE_REJECTED',
      { token },
    )
    assert.equal(rejected.response.status, 200)
    assert.equal(rejected.body.data.pagination.total, 2)

    const readApproved = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?isRead=true&type=LEAVE_APPROVED',
      { token },
    )
    assert.equal(readApproved.response.status, 200)
    assert.equal(readApproved.body.data.pagination.total, 1)
    assert.equal(readApproved.body.data.notifications[0].id, created[4].id)
  })
})

test('unread count reflects only the authenticated user\'s unread notifications', async () => {
  await withServer(async ({ baseUrl }) => {
    const { department, parent } = await createParentWithDepartment()
    const otherParent = await createTestUser({ role: 'PARENT' })
    const token = await loginToken(baseUrl, parent)

    await createStoredNotification(parent, department, { isRead: false })
    await createStoredNotification(parent, department, { isRead: false })
    await createStoredNotification(parent, department, { isRead: false })
    await createStoredNotification(parent, department, { isRead: true })
    await createStoredNotification(otherParent, department, { isRead: false })

    const count = await apiRequest(
      baseUrl,
      '/api/v1/notifications/unread-count',
      { token },
    )
    assert.equal(count.response.status, 200)
    assert.equal(count.body.data.unreadCount, 3)

    const unread = await Notification.findOne({
      recipient: parent._id,
      isRead: false,
    })
    const marked = await apiRequest(
      baseUrl,
      `/api/v1/notifications/${unread._id}/read`,
      { method: 'PATCH', token },
    )
    assert.equal(marked.response.status, 200)
    assert.equal(marked.body.data.unreadCount, 2)

    const updated = await apiRequest(
      baseUrl,
      '/api/v1/notifications/unread-count',
      { token },
    )
    assert.equal(updated.body.data.unreadCount, 2)
  })
})

test('marking one notification as read works only for the owner', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const parentA = await createTestUser({ role: 'PARENT' })
    const parentB = await createTestUser({ role: 'PARENT' })
    const notificationA = await createStoredNotification(parentA, department)
    const notificationB = await createStoredNotification(parentB, department)

    const tokenA = await loginToken(baseUrl, parentA)
    const tokenB = await loginToken(baseUrl, parentB)

    const owner = await apiRequest(
      baseUrl,
      `/api/v1/notifications/${notificationA.id}/read`,
      { method: 'PATCH', token: tokenA },
    )
    assert.equal(owner.response.status, 200)
    assert.equal(owner.body.data.notification.isRead, true)
    assert.equal(owner.body.data.unreadCount, 0)

    const intruder = await apiRequest(
      baseUrl,
      `/api/v1/notifications/${notificationB.id}/read`,
      { method: 'PATCH', token: tokenA },
    )
    assert.equal(intruder.response.status, 404)

    const storedB = await Notification.findById(notificationB._id)
    assert.equal(storedB.isRead, false)

    const legitimate = await apiRequest(
      baseUrl,
      `/api/v1/notifications/${notificationB.id}/read`,
      { method: 'PATCH', token: tokenB },
    )
    assert.equal(legitimate.response.status, 200)
    assert.equal(legitimate.body.data.notification.isRead, true)
  })
})

test('marking all as read affects only the authenticated owner', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const parentA = await createTestUser({ role: 'PARENT' })
    const parentB = await createTestUser({ role: 'PARENT' })

    await createStoredNotification(parentA, department, { isRead: false })
    await createStoredNotification(parentA, department, { isRead: false })
    await createStoredNotification(parentA, department, { isRead: true })
    await createStoredNotification(parentB, department, { isRead: false })

    const tokenA = await loginToken(baseUrl, parentA)
    const tokenB = await loginToken(baseUrl, parentB)

    const result = await apiRequest(
      baseUrl,
      '/api/v1/notifications/read-all',
      { method: 'PATCH', token: tokenA },
    )
    assert.equal(result.response.status, 200)
    assert.equal(result.body.data.modifiedCount, 2)
    assert.equal(result.body.data.unreadCount, 0)

    const unreadA = await Notification.countDocuments({
      recipient: parentA._id,
      isRead: false,
    })
    const unreadB = await Notification.countDocuments({
      recipient: parentB._id,
      isRead: false,
    })

    assert.equal(unreadA, 0)
    assert.equal(unreadB, 1)

    const countB = await apiRequest(
      baseUrl,
      '/api/v1/notifications/unread-count',
      { token: tokenB },
    )
    assert.equal(countB.body.data.unreadCount, 1)
  })
})

test('notification endpoints validate authentication, ids, queries, and bodies', async () => {
  await withServer(async ({ baseUrl }) => {
    const { parent } = await createParentWithDepartment()
    const token = await loginToken(baseUrl, parent)

    const anonymous = await apiRequest(baseUrl, '/api/v1/notifications/my')
    assert.equal(anonymous.response.status, 401)

    const badType = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?type=NOT_A_TYPE',
      { token },
    )
    assert.equal(badType.response.status, 400)

    const badIsRead = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?isRead=maybe',
      { token },
    )
    assert.equal(badIsRead.response.status, 400)

    const unknownField = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my?recipient=someone',
      { token },
    )
    assert.equal(unknownField.response.status, 400)

    const unknownCountQuery = await apiRequest(
      baseUrl,
      '/api/v1/notifications/unread-count?recipient=someone',
      { token },
    )
    assert.equal(unknownCountQuery.response.status, 400)

    const unknownReadAllQuery = await apiRequest(
      baseUrl,
      '/api/v1/notifications/read-all?recipient=someone',
      { method: 'PATCH', token },
    )
    assert.equal(unknownReadAllQuery.response.status, 400)

    const badId = await apiRequest(
      baseUrl,
      '/api/v1/notifications/not-an-id/read',
      { method: 'PATCH', token },
    )
    assert.equal(badId.response.status, 400)

    const bodyNotAllowed = await apiRequest(
      baseUrl,
      '/api/v1/notifications/read-all',
      { method: 'PATCH', token, body: { isRead: true } },
    )
    assert.equal(bodyNotAllowed.response.status, 400)

    const missing = await apiRequest(
      baseUrl,
      `/api/v1/notifications/${new mongoose.Types.ObjectId()}/read`,
      { method: 'PATCH', token },
    )
    assert.equal(missing.response.status, 404)

    const noBody = await apiRequest(
      baseUrl,
      '/api/v1/notifications/read-all',
      { method: 'PATCH', token },
    )
    assert.equal(noBody.response.status, 200)
  })
})
