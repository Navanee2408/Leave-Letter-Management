import { ROLES } from '../constants/index.js'

export function normalizeUser(rawUser) {
  if (!rawUser) return null
  const role =
    rawUser.role === 'TUTOR'
      ? ROLES.CLASS_TUTOR
      : rawUser.role

  const departmentId =
    rawUser.department?._id ||
    rawUser.department?.id ||
    (typeof rawUser.department === 'string' ? rawUser.department : rawUser.departmentId) ||
    null

  const status = rawUser.accountStatus
    ? rawUser.accountStatus.toLowerCase()
    : rawUser.status || 'active'

  const accountStatus =
    rawUser.accountStatus || (status === 'active' ? 'ACTIVE' : 'INACTIVE')

  return {
    ...rawUser,
    id: String(rawUser.id || rawUser._id || ''),
    name: rawUser.fullName || rawUser.name || '',
    fullName: rawUser.fullName || rawUser.name || '',
    email: rawUser.email || '',
    role,
    departmentId,
    department: rawUser.department || null,
    status,
    accountStatus,
    mustChangePassword: Boolean(rawUser.mustChangePassword),
    designation: rawUser.designation || '',
    address: rawUser.address || '',
  }
}
