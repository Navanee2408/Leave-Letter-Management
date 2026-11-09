export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  HOD: 'HOD',
  TUTOR: 'TUTOR',
  PARENT: 'PARENT',
})

export const ROLE_VALUES = Object.freeze(Object.values(ROLES))

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
})

export const ACCOUNT_STATUS_VALUES = Object.freeze(Object.values(ACCOUNT_STATUS))

export const BCRYPT_SALT_ROUNDS = 12

export const RELATIONSHIP_TYPES = Object.freeze({
  FATHER: 'Father',
  MOTHER: 'Mother',
  GUARDIAN: 'Guardian',
})

export const RELATIONSHIP_TYPE_VALUES = Object.freeze(
  Object.values(RELATIONSHIP_TYPES),
)

export const LEAVE_TYPES = Object.freeze({
  SICK_LEAVE: 'SICK_LEAVE',
  FAMILY_FUNCTION: 'FAMILY_FUNCTION',
  PERSONAL: 'PERSONAL',
  EMERGENCY: 'EMERGENCY',
  OTHER: 'OTHER',
})

export const LEAVE_TYPE_VALUES = Object.freeze(Object.values(LEAVE_TYPES))

export const LEAVE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
})

export const LEAVE_STATUS_VALUES = Object.freeze(Object.values(LEAVE_STATUS))

export const LEAVE_HISTORY_ACTIONS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
  UPDATED: 'UPDATED',
})

export const LEAVE_HISTORY_ACTION_VALUES = Object.freeze(
  Object.values(LEAVE_HISTORY_ACTIONS),
)

export const SUPPORTED_DOCUMENT_TYPES = Object.freeze({
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
})

export const MAX_SUPPORTING_DOCUMENT_BYTES = 5 * 1024 * 1024

export const NOTIFICATION_TYPES = Object.freeze({
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  LEAVE_REJECTED: 'LEAVE_REJECTED',
  LEAVE_REOPENED: 'LEAVE_REOPENED',
})

export const NOTIFICATION_TYPE_VALUES = Object.freeze(
  Object.values(NOTIFICATION_TYPES),
)
