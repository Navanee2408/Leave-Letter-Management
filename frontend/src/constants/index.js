export const ROLES = {
  ADMIN: 'ADMIN',
  HOD: 'HOD',
  CLASS_TUTOR: 'CLASS_TUTOR',
  PARENT: 'PARENT',
}

export const ROLE_VALUES = Object.values(ROLES)

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'College Administrator',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.CLASS_TUTOR]: 'Class Tutor',
  [ROLES.PARENT]: 'Parent / Guardian',
}

export const ROLE_SHORT = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.HOD]: 'HOD',
  [ROLES.CLASS_TUTOR]: 'Tutor',
  [ROLES.PARENT]: 'Parent',
}

export const ROLE_HOME = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.HOD]: '/hod/dashboard',
  [ROLES.CLASS_TUTOR]: '/tutor/dashboard',
  [ROLES.PARENT]: '/parent/dashboard',
}

export const ROLE_PORTAL = {
  [ROLES.ADMIN]: 'admin',
  [ROLES.HOD]: 'hod',
  [ROLES.CLASS_TUTOR]: 'tutor',
  [ROLES.PARENT]: 'parent',
}

export const ROLE_BY_PORTAL = {
  admin: ROLES.ADMIN,
  hod: ROLES.HOD,
  tutor: ROLES.CLASS_TUTOR,
  parent: ROLES.PARENT,
}

export const ROLE_LOGIN = {
  [ROLES.ADMIN]: '/admin/login',
  [ROLES.HOD]: '/login/hod',
  [ROLES.CLASS_TUTOR]: '/login/tutor',
  [ROLES.PARENT]: '/login/parent',
}

export const LEAVE_TYPES = [
  'Medical Leave',
  'Casual Leave',
  'Emergency Leave',
  'Family Function Leave',
  'Other',
]

export const LEAVE_TYPE_SHORT = {
  'Medical Leave': 'Medical',
  'Casual Leave': 'Casual',
  'Emergency Leave': 'Emergency',
  'Family Function Leave': 'Family Function',
  Other: 'Other',
}

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'reopened']

export const STATUS_META = {
  pending: {
    label: 'Pending',
    tone: 'amber',
    description: 'Awaiting HOD review',
  },
  approved: {
    label: 'Approved',
    tone: 'green',
    description: 'Leave approved by HOD',
  },
  rejected: {
    label: 'Rejected',
    tone: 'red',
    description: 'Leave request declined',
  },
  reopened: {
    label: 'Reopened',
    tone: 'blue',
    description: 'Returned for correction',
  },
}

export const STATUS_TONES = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  blue: 'border-sky-200 bg-sky-50 text-sky-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
}

export const YEAR_OPTIONS = [
  { value: '1', label: 'I Year' },
  { value: '2', label: 'II Year' },
  { value: '3', label: 'III Year' },
  { value: '4', label: 'IV Year' },
]

export const SECTION_OPTIONS = ['A', 'B', 'C'].map((section) => ({
  value: section,
  label: `Section ${section}`,
}))

export const ACADEMIC_YEARS = ['2024–2025', '2025–2026', '2026–2027']

export const ACCOUNT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export const NOTIFICATION_META = {
  new_application: {
    label: 'New leave application',
    tone: 'amber',
  },
  leave_approved: {
    label: 'Leave approved',
    tone: 'green',
  },
  leave_rejected: {
    label: 'Leave rejected',
    tone: 'red',
  },
  application_reopened: {
    label: 'Application reopened',
    tone: 'blue',
  },
  forwarded_to_tutor: {
    label: 'Approved leave forwarded',
    tone: 'navy',
  },
  administration_notice: {
    label: 'Administration notice',
    tone: 'slate',
  },
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ACCEPTED_UPLOAD_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

export const DEMO_STORAGE_KEY = 'clms_demo_database_v1'
export const DEMO_HOD_CREDENTIALS_STORAGE_KEY = 'clms_demo_hod_credentials_v1'
export const LEGACY_AUTH_STORAGE_KEY = 'clms_demo_session_v1'
export const AUTH_STORAGE_KEY = 'clms_demo_session_v2'

export const COLLEGE_NAME = 'Thiagarajar College of Engineering'
export const COLLEGE_LOCATION = 'Madurai, Tamil Nadu'
export const APP_NAME = 'Leave Management Portal'
