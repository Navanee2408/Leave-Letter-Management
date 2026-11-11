import { ROLES } from '../../constants/index.js'

export const BACKEND_TO_FRONTEND_LEAVE_TYPES = {
  SICK_LEAVE: 'Medical Leave',
  FAMILY_FUNCTION: 'Family Function Leave',
  PERSONAL: 'Casual Leave',
  EMERGENCY: 'Emergency Leave',
  OTHER: 'Other',
}

export const FRONTEND_TO_BACKEND_LEAVE_TYPES = {
  'Medical Leave': 'SICK_LEAVE',
  'Family Function Leave': 'FAMILY_FUNCTION',
  'Casual Leave': 'PERSONAL',
  'Emergency Leave': 'EMERGENCY',
  Other: 'OTHER',
}

export const BACKEND_TO_FRONTEND_NOTIFICATION_TYPES = {
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  LEAVE_REOPENED: 'application_reopened',
  NEW_APPLICATION: 'new_application',
  FORWARDED_TO_TUTOR: 'forwarded_to_tutor',
  ADMINISTRATION_NOTICE: 'administration_notice',
}

export function toFrontendLeaveType(type) {
  if (!type) return 'Other'
  return BACKEND_TO_FRONTEND_LEAVE_TYPES[type] || type
}

export function toBackendLeaveType(type) {
  if (!type) return 'OTHER'
  return FRONTEND_TO_BACKEND_LEAVE_TYPES[type] || type
}

export function toFrontendNotificationType(type) {
  if (!type) return 'administration_notice'
  return BACKEND_TO_FRONTEND_NOTIFICATION_TYPES[type] || type.toLowerCase()
}

export function transformDepartment(raw) {
  if (!raw) return null
  return {
    id: String(raw._id || raw.id),
    name: raw.name,
    code: raw.code,
    description: raw.description || '',
    status: raw.status ? raw.status.toLowerCase() : 'active',
    createdAt: raw.createdAt || new Date().toISOString(),
  }
}

export function transformClass(raw) {
  if (!raw) return null
  return {
    id: String(raw._id || raw.id),
    className: raw.className,
    departmentId: String(raw.department?._id || raw.department?.id || raw.department || ''),
    year: String(raw.year || '1'),
    section: String(raw.section || 'A'),
    tutorId: raw.assignedTutor
      ? String(raw.assignedTutor._id || raw.assignedTutor.id || raw.assignedTutor)
      : null,
    status: raw.status ? raw.status.toLowerCase() : 'active',
  }
}

export function transformHod(raw) {
  if (!raw) return null
  const status = raw.accountStatus
    ? raw.accountStatus.toLowerCase()
    : raw.status
      ? raw.status.toLowerCase()
      : 'active'

  return {
    id: String(raw._id || raw.id),
    name: raw.fullName || raw.name || '',
    fullName: raw.fullName || raw.name || '',
    email: raw.email,
    phone: raw.phone || '',
    employeeId: raw.employeeId || '',
    departmentId: String(raw.department?._id || raw.department?.id || raw.department || ''),
    status,
    accountStatus: raw.accountStatus || status.toUpperCase(),
    mustChangePassword: Boolean(raw.mustChangePassword),
    role: ROLES.HOD,
    designation: raw.designation || 'Head of Department',
  }
}

export function transformTutor(raw) {
  if (!raw) return null
  const status = raw.accountStatus
    ? raw.accountStatus.toLowerCase()
    : raw.status
      ? raw.status.toLowerCase()
      : 'active'

  return {
    id: String(raw._id || raw.id),
    name: raw.fullName || raw.name || '',
    fullName: raw.fullName || raw.name || '',
    email: raw.email,
    phone: raw.phone || '',
    employeeId: raw.employeeId || '',
    departmentId: String(raw.department?._id || raw.department?.id || raw.department || ''),
    classIds: (raw.assignedClasses || []).map((c) =>
      String(c?._id || c?.id || c),
    ),
    status,
    accountStatus: raw.accountStatus || status.toUpperCase(),
    mustChangePassword: Boolean(raw.mustChangePassword),
    role: ROLES.CLASS_TUTOR,
    designation: raw.designation || 'Class Tutor',
  }
}

export function transformStudent(raw, parentId = null) {
  if (!raw) return null
  return {
    id: String(raw._id || raw.id),
    name: raw.fullName || raw.name || '',
    fullName: raw.fullName || raw.name || '',
    registerNumber: raw.registerNumber || '',
    departmentId: String(raw.department?._id || raw.department?.id || raw.department || ''),
    classId: String(raw.class?._id || raw.class?.id || raw.class || ''),
    parentId: parentId || (raw.parent ? String(raw.parent._id || raw.parent.id || raw.parent) : null),
    phone: raw.phone || '',
    email: raw.email || '',
    status: raw.status ? raw.status.toLowerCase() : 'active',
  }
}

export function transformParent(raw, childIds = []) {
  if (!raw) return null
  const status = raw.accountStatus
    ? raw.accountStatus.toLowerCase()
    : raw.status
      ? raw.status.toLowerCase()
      : 'active'

  const firstRelationship =
    raw.relationship ||
    (typeof childIds[0] === 'object' ? childIds[0]?.relationship : null) ||
    'Guardian'

  return {
    id: String(raw._id || raw.id),
    name: raw.fullName || raw.name || '',
    fullName: raw.fullName || raw.name || '',
    email: raw.email,
    phone: raw.phone || '',
    address: raw.address || '',
    childIds: childIds.map((c) =>
      String(c?.student?._id || c?.student?.id || c?.student || c?._id || c?.id || c),
    ),
    relationship: firstRelationship,
    status,
    accountStatus: raw.accountStatus || status.toUpperCase(),
    mustChangePassword: Boolean(raw.mustChangePassword),
    role: ROLES.PARENT,
  }
}

export function transformLeave(raw) {
  if (!raw) return null

  let status = 'pending'
  const rawStatus = (raw.status || '').toUpperCase()
  if (rawStatus === 'APPROVED') {
    status = 'approved'
  } else if (rawStatus === 'REJECTED') {
    status = 'rejected'
  } else if (raw.reopenReason || raw.reopenedAt) {
    status = 'reopened'
  }

  const fromDate = raw.fromDate
    ? new Date(raw.fromDate).toISOString().slice(0, 10)
    : ''
  const toDate = raw.toDate
    ? new Date(raw.toDate).toISOString().slice(0, 10)
    : ''

  return {
    id: String(raw._id || raw.id),
    applicationNumber: raw.applicationNumber || '',
    studentId: String(raw.student?._id || raw.student?.id || raw.student || ''),
    parentId: String(raw.parent?._id || raw.parent?.id || raw.parent || ''),
    departmentId: String(raw.department?._id || raw.department?.id || raw.department || ''),
    classId: String(raw.class?._id || raw.class?.id || raw.class || ''),
    leaveType: toFrontendLeaveType(raw.leaveType),
    fromDate,
    toDate,
    reason: raw.reason || '',
    status,
    remarks: raw.decisionComment || '',
    decisionComment: raw.decisionComment || '',
    rejectionReason: raw.rejectionReason || '',
    reopenReason: raw.reopenReason || '',
    reopenedAt: raw.reopenedAt || null,
    reopenedById: raw.reopenedBy
      ? String(raw.reopenedBy._id || raw.reopenedBy.id || raw.reopenedBy)
      : null,
    reopenedBy: raw.reopenedBy
      ? raw.reopenedBy.fullName || raw.reopenedBy.name
      : null,
    decidedAt: raw.decidedAt || null,
    decidedById: raw.decidedBy
      ? String(raw.decidedBy._id || raw.decidedBy.id || raw.decidedBy)
      : null,
    decidedBy: raw.decidedBy
      ? raw.decidedBy.fullName || raw.decidedBy.name
      : null,
    hasDocument: Boolean(raw.supportingDocument || raw.hasDocument),
    document: raw.supportingDocument || (raw.hasDocument ? { fileName: 'Supporting_Document' } : null),
    submittedAt: raw.createdAt || new Date().toISOString(),
    history: raw.history || [],
  }
}

export function transformNotification(raw, user = null) {
  if (!raw) return null
  const userKey = user ? `${user.role}:${user.id}` : null
  const isRead = Boolean(raw.isRead)

  return {
    id: String(raw._id || raw.id),
    title: raw.title || '',
    message: raw.message || '',
    type: toFrontendNotificationType(raw.type),
    applicationId: String(raw.application?._id || raw.application?.id || raw.application || ''),
    createdAt: raw.createdAt || new Date().toISOString(),
    isRead,
    readBy: isRead && userKey ? [userKey] : [],
    recipients: user ? [{ role: user.role, id: user.id }] : [],
  }
}
