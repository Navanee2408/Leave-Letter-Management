import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transformLeave } from './dataTransformers.js'
import { normalizeUser } from '../../context/userUtils.js'
import {
  onNewNotification,
  onUnreadCount,
  onNotificationRead,
} from './socketClient.js'

test('Integration: normalizeUser maps backend TUTOR and fields correctly', () => {
  const backendUser = {
    _id: '607f1f77bcf86cd799439099',
    fullName: 'Dr. Test Tutor',
    email: 'tutor.test@example.com',
    role: 'TUTOR',
    department: '507f1f77bcf86cd799439011',
    accountStatus: 'ACTIVE',
  }

  const normalized = normalizeUser(backendUser)
  assert.equal(normalized.id, '607f1f77bcf86cd799439099')
  assert.equal(normalized.name, 'Dr. Test Tutor')
  assert.equal(normalized.role, 'CLASS_TUTOR')
  assert.equal(normalized.departmentId, '507f1f77bcf86cd799439011')
  assert.equal(normalized.status, 'active')
  assert.equal(normalized.accountStatus, 'ACTIVE')
})

test('Integration: normalizeUser handles HOD and populated department', () => {
  const hodUser = {
    _id: '607f1f77bcf86cd799439088',
    fullName: 'Dr. Head of Dept',
    email: 'hod.test@example.com',
    role: 'HOD',
    department: {
      _id: '507f1f77bcf86cd799439011',
      name: 'Computer Science',
      code: 'CSE',
    },
    accountStatus: 'ACTIVE',
  }

  const normalized = normalizeUser(hodUser)
  assert.equal(normalized.role, 'HOD')
  assert.equal(normalized.departmentId, '507f1f77bcf86cd799439011')
  assert.equal(normalized.department.code, 'CSE')
})

test('Integration: leave application mapping and status derivations', () => {
  const backendLeave = {
    _id: '65a123456789012345678901',
    applicationNumber: 'LA-20261109-ABCD',
    student: {
      _id: 'student-99',
      fullName: 'Rahul Verma',
    },
    parent: {
      _id: 'parent-99',
      fullName: 'Ajay Verma',
    },
    department: 'dept-1',
    class: 'class-1',
    leaveType: 'FAMILY_FUNCTION',
    fromDate: '2026-11-15T00:00:00.000Z',
    toDate: '2026-11-17T00:00:00.000Z',
    reason: 'Sister marriage ceremony',
    status: 'PENDING',
    history: [],
  }

  const leave = transformLeave(backendLeave)
  assert.equal(leave.id, '65a123456789012345678901')
  assert.equal(leave.applicationNumber, 'LA-20261109-ABCD')
  assert.equal(leave.leaveType, 'Family Function Leave')
  assert.equal(leave.status, 'pending')
  assert.equal(leave.fromDate, '2026-11-15')
  assert.equal(leave.toDate, '2026-11-17')
  assert.equal(leave.studentId, 'student-99')
  assert.equal(leave.parentId, 'parent-99')
})

test('Integration: socket client registration and listeners', () => {
  const unsub1 = onNewNotification(() => {})
  const unsub2 = onUnreadCount(() => {})
  const unsub3 = onNotificationRead(() => {})

  assert.equal(typeof unsub1, 'function')
  assert.equal(typeof unsub2, 'function')
  assert.equal(typeof unsub3, 'function')

  unsub1()
  unsub2()
  unsub3()
})
