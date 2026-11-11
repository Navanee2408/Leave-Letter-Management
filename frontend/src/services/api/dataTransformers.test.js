import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  toFrontendLeaveType,
  toBackendLeaveType,
  toFrontendNotificationType,
  transformDepartment,
  transformClass,
  transformTutor,
  transformLeave,
} from './dataTransformers.js'

test('dataTransformers converts backend formats to frontend entities', () => {
  assert.equal(toFrontendLeaveType('SICK_LEAVE'), 'Medical Leave')
  assert.equal(toBackendLeaveType('Medical Leave'), 'SICK_LEAVE')
  assert.equal(toFrontendNotificationType('LEAVE_APPROVED'), 'leave_approved')

  const dept = transformDepartment({
    _id: '507f1f77bcf86cd799439011',
    name: 'Computer Science',
    code: 'CSE',
    status: 'ACTIVE',
  })
  assert.equal(dept.id, '507f1f77bcf86cd799439011')
  assert.equal(dept.code, 'CSE')
  assert.equal(dept.status, 'active')

  const cls = transformClass({
    _id: '507f1f77bcf86cd799439012',
    className: 'CSE-A',
    department: '507f1f77bcf86cd799439011',
    year: '3',
    section: 'A',
    assignedTutor: '507f1f77bcf86cd799439013',
    status: 'ACTIVE',
  })
  assert.equal(cls.id, '507f1f77bcf86cd799439012')
  assert.equal(cls.tutorId, '507f1f77bcf86cd799439013')

  const tutor = transformTutor({
    _id: '507f1f77bcf86cd799439013',
    fullName: 'Dr. Tutor',
    email: 'tutor@test.com',
    role: 'TUTOR',
    designation: 'Assistant Professor',
    mustChangePassword: true,
    assignedClasses: ['507f1f77bcf86cd799439012'],
  })
  assert.equal(tutor.name, 'Dr. Tutor')
  assert.equal(tutor.role, 'CLASS_TUTOR')
  assert.equal(tutor.designation, 'Assistant Professor')
  assert.equal(tutor.mustChangePassword, true)
  assert.equal(tutor.classIds[0], '507f1f77bcf86cd799439012')

  const leave = transformLeave({
    _id: '507f1f77bcf86cd799439014',
    applicationNumber: 'LA-2026-001',
    student: '507f1f77bcf86cd799439015',
    parent: '507f1f77bcf86cd799439016',
    leaveType: 'SICK_LEAVE',
    status: 'APPROVED',
    fromDate: '2026-11-10T00:00:00.000Z',
    toDate: '2026-11-12T00:00:00.000Z',
  })
  assert.equal(leave.leaveType, 'Medical Leave')
  assert.equal(leave.status, 'approved')
  assert.equal(leave.fromDate, '2026-11-10')

  const reopenedLeave = transformLeave({
    _id: '507f1f77bcf86cd799439014',
    status: 'PENDING',
    reopenReason: 'Please attach medical certificate',
  })
  assert.equal(reopenedLeave.status, 'reopened')
})
