import {
  createSeedData,
  DEMO_SEED_VERSION,
  hodsSeed,
} from '../data/demoData.js'
import {
  DEMO_HOD_CREDENTIALS_STORAGE_KEY,
  DEMO_STORAGE_KEY,
  ROLES,
} from '../constants/index.js'
import { formatDate } from '../lib/date.js'
import {
  formatValidationReport,
  validateDemoData,
} from './demoValidation.js'

/**
 * Browser-local demo persistence.
 *
 * Every mutation that changes a leave application accepts the authenticated
 * actor and re-checks the relationship it depends on. These guards are a
 * convenience for the prototype: a real backend must repeat the same checks
 * against its own database, because anything running in the browser can be
 * modified by the user.
 */

function reportValidation(database, context) {
  const result = validateDemoData(database)
  if (!result.valid) {
    // Report clearly instead of silently repairing broken relationships.
    console.error(`[CLMS demo] ${context}\n${formatValidationReport(result)}`)
  }
  return result
}

function isSupportedDatabase(parsed) {
  if (!parsed || parsed.version !== DEMO_SEED_VERSION) return false
  return [
    'departments',
    'hods',
    'classes',
    'tutors',
    'students',
    'parents',
    'leaves',
    'notifications',
  ].every((collection) => Array.isArray(parsed[collection]))
}

export function migrateDemoDatabase(database) {
  const departments = database.departments.map((department) => {
    const code = String(department.code || '').trim().toUpperCase()
    const description = department.description || ''
    return code === department.code && description === department.description
      ? department
      : { ...department, code, description }
  })
  const hods = database.hods.map((hod) => {
    const seededHod = hodsSeed.find((item) => item.id === hod.id)
    return seededHod && !hod.employeeId
      ? { ...hod, employeeId: seededHod.employeeId }
      : hod
  })
  const hodsUnchanged = hods.every((hod, index) => hod === database.hods[index])
  const departmentsUnchanged = departments.every(
    (department, index) => department === database.departments[index],
  )
  return departmentsUnchanged && hodsUnchanged
    ? database
    : { ...database, departments, hods }
}

export function loadDatabase() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) {
      const seed = createSeedData()
      reportValidation(seed, 'Seeded demo database')
      return seed
    }
    const parsed = JSON.parse(raw)
    if (!isSupportedDatabase(parsed)) {
      // A database from an older seed could contain stale roles and department
      // links, so it is discarded rather than merged.
      const seed = createSeedData()
      reportValidation(seed, 'Replaced an incompatible demo database with a fresh seed')
      saveDatabase(seed)
      localStorage.removeItem(DEMO_HOD_CREDENTIALS_STORAGE_KEY)
      return seed
    }
    const migrated = migrateDemoDatabase(parsed)
    if (migrated !== parsed) saveDatabase(migrated)
    return migrated
  } catch {
    const seed = createSeedData()
    reportValidation(seed, 'Recovered demo database after a read error')
    return seed
  }
}

export function saveDatabase(db) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Demo mode continues in memory if storage is unavailable.
  }
}

export function clearDatabase() {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY)
  } catch {
    // Ignore storage errors in demo mode.
  }
  const seed = createSeedData()
  reportValidation(seed, 'Reset demo database')
  return seed
}

export function recipientKeyForUser(user) {
  if (!user || !user.role || !user.id) return null
  return `${user.role}:${user.id}`
}

export function notificationMatches(notification, user) {
  if (!user || !notification?.recipients) return false
  return notification.recipients.some(
    (recipient) => recipient.role === user.role && recipient.id === user.id,
  )
}

export function notificationsFor(db, user) {
  return (db.notifications || [])
    .filter((notification) => {
      if (!notificationMatches(notification, user)) return false
      if (user.role !== ROLES.HOD) return true
      const hod = (db.hods || []).find((item) => item.id === user.id)
      const leave = db.leaves.find(
        (item) => item.id === notification.applicationId,
      )
      const student = leave ? findStudent(db, leave.studentId) : null
      return (
        Boolean(hod?.departmentId) &&
        (leave?.decisionDepartmentId || departmentIdForStudent(db, student)) ===
          hod.departmentId
      )
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function unreadNotificationCount(db, user) {
  const key = recipientKeyForUser(user)
  return notificationsFor(db, user).filter(
    (notification) => !(notification.readBy || []).includes(key),
  ).length
}

function nextSequence(items) {
  const numbers = items
    .map((item) => Number(String(item.id).split('-').pop()))
    .filter((value) => Number.isFinite(value))
  const max = numbers.length ? Math.max(...numbers) : 0
  return max + 1
}

function createNotification({
  type,
  title,
  message,
  applicationId,
  recipients,
}) {
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    message,
    createdAt: new Date().toISOString(),
    applicationId,
    recipients,
    readBy: [],
  }
}

function logEvent(leave, { status, label, by, note }) {
  leave.history = [
    ...(leave.history || []),
    {
      status,
      label,
      at: new Date().toISOString(),
      by,
      note,
    },
  ]
}

function findStudent(db, studentId) {
  return db.students.find((student) => student.id === studentId) || null
}

function findTutorForStudent(db, student) {
  if (!student) return null
  const classItem = db.classes.find((item) => item.id === student.classId)
  if (!classItem) return null
  return db.tutors.find((tutor) => tutor.id === classItem.tutorId) || null
}

/**
 * Resolves a student to its department through student → class → department.
 * The class record is treated as authoritative for department routing because
 * the HOD owns the classes in their department.
 */
function departmentIdForStudent(db, student) {
  if (!student) return null
  const classItem = db.classes.find((item) => item.id === student.classId)
  return classItem?.departmentId || student.departmentId || null
}

function hodForDepartment(db, departmentId) {
  if (!departmentId) return null
  return (
    (db.hods || []).find(
      (hod) => hod.departmentId === departmentId && hod.status === 'active',
    ) || null
  )
}

function isGuardian(db, actor, student) {
  if (!actor || actor.role !== ROLES.PARENT || !student) return false
  const parent = (db.parents || []).find((item) => item.id === actor.id)
  if (!parent || parent.status !== 'active') return false
  return (parent.childIds || []).includes(student.id) || student.parentId === parent.id
}

function canHodDecide(db, actor, leave) {
  if (!actor || actor.role !== ROLES.HOD) {
    console.warn('[CLMS demo] Leave decisions require an authenticated HOD actor.')
    return false
  }
  const hod = (db.hods || []).find((item) => item.id === actor.id)
  const student = findStudent(db, leave.studentId)
  const departmentId = departmentIdForStudent(db, student)
  if (
    !hod ||
    hod.role !== ROLES.HOD ||
    hod.status !== 'active' ||
    !departmentId ||
    !departmentIsActive(db, departmentId) ||
    hod.departmentId !== departmentId
  ) {
    console.warn(
      `[CLMS demo] HOD ${actor.id} cannot decide leave ${leave.id} outside department ${departmentId}.`,
    )
    return false
  }
  return true
}

function addNotification(db, notification) {
  db.notifications = [notification, ...(db.notifications || [])]
}

function identity(role, id) {
  return id ? { role, id } : null
}

function recipientsFor(...entries) {
  return entries.filter(Boolean)
}

function syncDepartmentHod(db, departmentId) {
  if (!departmentId) return db
  const hod = (db.hods || []).find(
    (item) => item.departmentId === departmentId && item.status === 'active',
  )
  return {
    ...db,
    departments: db.departments.map((department) =>
      department.id === departmentId
        ? {
            ...department,
            hodId: hod?.id || null,
            hodName: hod?.name || 'Not assigned',
            hodEmail: hod?.email || '',
          }
        : department,
    ),
  }
}

function departmentIsActive(db, departmentId) {
  return db.departments.some(
    (department) => department.id === departmentId && department.status === 'active',
  )
}

function classIsActive(db, classId) {
  const classItem = db.classes.find((item) => item.id === classId)
  return Boolean(
    classItem &&
      classItem.status === 'active' &&
      departmentIsActive(db, classItem.departmentId),
  )
}

function uniqueId(prefix, records) {
  let id
  do {
    id = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  } while (records.some((record) => record.id === id))
  return id
}

function classIdentity(classItem) {
  return [
    classItem.departmentId,
    classItem.academicYear,
    classItem.year,
    classItem.section,
  ].join(':').toLowerCase()
}

export const demoService = {
  addDepartment(db, payload) {
    const code = String(payload.code || '').trim().toUpperCase()
    const name = String(payload.name || '').trim()
    if (
      !/^[A-Z][A-Z0-9]{1,9}$/.test(code) ||
      !name ||
      !['active', 'inactive'].includes(payload.status || 'active') ||
      db.departments.some(
        (item) =>
          item.code.trim().toUpperCase() === code ||
          item.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      return db
    }
    return {
      ...db,
      departments: [
        ...db.departments,
        {
          id: uniqueId(`dept-${code.toLowerCase()}`, db.departments),
          ...payload,
          code,
          name,
          description: String(payload.description || '').trim(),
          hodId: null,
          hodName: 'Not assigned',
          hodEmail: '',
          status: payload.status || 'active',
        },
      ],
    }
  },

  updateDepartment(db, id, payload) {
    const current = db.departments.find((department) => department.id === id)
    const name = String(payload.name ?? current?.name ?? '').trim()
    if (
      !current ||
      !name ||
      (payload.status && !['active', 'inactive'].includes(payload.status)) ||
      (payload.code && String(payload.code).trim().toUpperCase() !== current.code) ||
      db.departments.some(
        (department) =>
          department.id !== id &&
          department.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      return db
    }
    return {
      ...db,
      departments: db.departments.map((department) =>
        department.id === id
          ? {
              ...department,
              ...payload,
              name,
              description: String(payload.description ?? department.description ?? '').trim(),
              status: payload.status || department.status,
              code: department.code,
            }
          : department,
      ),
    }
  },

  deleteDepartment(db, id) {
    const department = db.departments.find((item) => item.id === id)
    if (!department) return db
    const hasLinkedRecords =
      db.hods.some((hod) => hod.departmentId === id) ||
      db.tutors.some((tutor) => tutor.departmentId === id) ||
      db.classes.some((classItem) => classItem.departmentId === id) ||
      db.students.some((student) => student.departmentId === id) ||
      db.leaves.some((leave) => {
        const student = db.students.find((item) => item.id === leave.studentId)
        const classItem = db.classes.find((item) => item.id === student?.classId)
        return classItem?.departmentId === id || student?.departmentId === id
      })
    if (hasLinkedRecords) return db
    return { ...db, departments: db.departments.filter((item) => item.id !== id) }
  },

  addHod(db, payload, { replaceActive = false } = {}) {
    const status = payload.status || 'active'
    const email = String(payload.email || '').trim().toLowerCase()
    const employeeId = String(payload.employeeId || '').trim().toLowerCase()
    if (
      !email ||
      !employeeId ||
      !departmentIsActive(db, payload.departmentId) ||
      db.hods.some(
        (hod) =>
          hod.email.toLowerCase() === email ||
          hod.employeeId?.toLowerCase() === employeeId,
      )
    ) {
      return db
    }
    const assigned = hodForDepartment(db, payload.departmentId)
    if (
      status === 'active' &&
      assigned &&
      !replaceActive
    ) {
      return db
    }
    const id = `hod-${Date.now().toString(36)}`
    const { password: _password, ...details } = payload
    const next = {
      ...db,
      hods: [
        ...db.hods.map((hod) =>
          status === 'active' &&
          replaceActive &&
          hod.departmentId === payload.departmentId &&
          hod.status === 'active'
            ? { ...hod, status: 'inactive' }
            : hod,
        ),
        {
          id,
          role: ROLES.HOD,
          ...details,
          email,
          employeeId: String(payload.employeeId).trim(),
          status,
        },
      ],
    }
    return syncDepartmentHod(next, payload.departmentId)
  },

  updateHod(db, id, payload) {
    const previous = (db.hods || []).find((hod) => hod.id === id)
    const departmentId = payload.departmentId || previous?.departmentId
    const status = payload.status || previous?.status
    const email = payload.email ? String(payload.email).trim().toLowerCase() : ''
    const employeeId = payload.employeeId
      ? String(payload.employeeId).trim().toLowerCase()
      : ''
    if (
      (payload.email &&
        (db.hods || []).some(
          (hod) => hod.id !== id && hod.email.toLowerCase() === email,
        )) ||
      (payload.employeeId &&
        db.hods.some(
          (hod) => hod.id !== id && hod.employeeId?.toLowerCase() === employeeId,
        )) ||
      (payload.departmentId &&
        payload.departmentId !== previous?.departmentId &&
        !departmentIsActive(db, payload.departmentId)) ||
      (status === 'active' && !departmentIsActive(db, departmentId))
    ) {
      return db
    }
    const next = {
      ...db,
      hods: (db.hods || []).map((hod) => {
        if (hod.id === id) {
          return {
            ...hod,
            ...payload,
            email: email || hod.email,
            employeeId: payload.employeeId
              ? String(payload.employeeId).trim()
              : hod.employeeId,
          }
        }
        if (
          status === 'active' &&
          hod.departmentId === departmentId &&
          hod.status === 'active'
        ) {
          return { ...hod, status: 'inactive' }
        }
        return hod
      }),
    }
    const synced = syncDepartmentHod(next, departmentId)
    if (previous?.departmentId && previous.departmentId !== departmentId) {
      return syncDepartmentHod(synced, previous.departmentId)
    }
    return synced
  },

  assignHod(db, departmentId, hodId) {
    if (!departmentIsActive(db, departmentId)) return db
    const targetHod = hodForDepartment(db, departmentId)
    const selectedHod = (db.hods || []).find(
      (hod) => hod.id === hodId && hod.status === 'active',
    )
    if (!selectedHod || targetHod?.id === selectedHod.id) return db
    const sourceDepartmentId = selectedHod.departmentId

    const next = {
      ...db,
      hods: db.hods.map((hod) => {
        if (targetHod && hod.id === targetHod.id) {
          return { ...hod, departmentId: sourceDepartmentId }
        }
        if (hod.id === selectedHod.id) {
          return { ...hod, departmentId }
        }
        return hod
      }),
    }
    return sourceDepartmentId
      ? syncDepartmentHod(syncDepartmentHod(next, departmentId), sourceDepartmentId)
      : syncDepartmentHod(next, departmentId)
  },

  deleteHod(db, id) {
    const previous = (db.hods || []).find((hod) => hod.id === id)
    const next = {
      ...db,
      hods: (db.hods || []).filter((hod) => hod.id !== id),
    }
    return syncDepartmentHod(next, previous?.departmentId)
  },

  addClass(db, payload) {
    const department = db.departments.find(
      (item) => item.id === payload.departmentId,
    )
    if (!department || department.status !== 'active') return db
    if (db.classes.some((item) => classIdentity(item) === classIdentity(payload))) {
      return db
    }
    if (
      payload.tutorId &&
      !db.tutors.some(
        (tutor) =>
          tutor.id === payload.tutorId &&
          tutor.status === 'active',
      )
    ) {
      return db
    }
    return {
      ...db,
      classes: [
        ...db.classes,
        { id: uniqueId('class', db.classes), ...payload },
      ],
    }
  },

  updateClass(db, id, payload) {
    const current = db.classes.find((item) => item.id === id)
    if (!current) return db
    const departmentId = payload.departmentId || current.departmentId
    const department = db.departments.find(
      (item) => item.id === departmentId,
    )
    if (
      !department ||
      (departmentId !== current.departmentId &&
        department.status !== 'active') ||
      db.classes.some(
        (item) =>
          item.id !== id &&
          classIdentity(item) ===
            classIdentity({ ...current, ...payload, departmentId }),
      ) ||
      (departmentId !== current.departmentId &&
        db.students.some((student) => student.classId === id)) ||
      (payload.tutorId &&
        payload.tutorId !== current.tutorId &&
        !db.tutors.some(
          (tutor) =>
            tutor.id === payload.tutorId &&
            tutor.status === 'active',
        ))
    ) {
      return db
    }
    return {
      ...db,
      classes: db.classes.map((classItem) =>
        classItem.id === id ? { ...classItem, ...payload } : classItem,
      ),
    }
  },

  deleteClass(db, id) {
    if (
      db.students.some((student) => student.classId === id) ||
      db.leaves.some((leave) =>
        db.students.some(
          (student) => student.id === leave.studentId && student.classId === id,
        ),
      )
    ) {
      return db
    }
    return {
      ...db,
      classes: db.classes.filter((classItem) => classItem.id !== id),
    }
  },

  addStudent(db, payload) {
    const department = db.departments.find(
      (item) => item.id === payload.departmentId,
    )
    const classItem = db.classes.find((item) => item.id === payload.classId)
    const parent = db.parents.find((item) => item.id === payload.parentId)
    if (
      !department ||
      department.status !== 'active' ||
      !classItem ||
      classItem.status !== 'active' ||
      classItem.departmentId !== department.id ||
      !parent
    ) {
      return db
    }
    const id = uniqueId('student', db.students)
    const next = { ...db }
    next.students = [...db.students, { id, ...payload }]
    next.parents = db.parents.map((parent) =>
      parent.id === payload.parentId
        ? { ...parent, childIds: Array.from(new Set([...(parent.childIds || []), id])) }
        : parent,
    )
    return next
  },

  updateStudent(db, id, payload) {
    const previous = db.students.find((student) => student.id === id)
    if (!previous) return db
    const departmentId = payload.departmentId || previous.departmentId
    const classId = payload.classId || previous.classId
    const department = db.departments.find((item) => item.id === departmentId)
    const classItem = db.classes.find((item) => item.id === classId)
    const isMoving = departmentId !== previous.departmentId || classId !== previous.classId
    if (
      !department ||
      !classItem ||
      classItem.departmentId !== departmentId ||
      (isMoving &&
        (department.status !== 'active' || classItem.status !== 'active')) ||
      (payload.parentId && !db.parents.some((parent) => parent.id === payload.parentId))
    ) {
      return db
    }
    const next = {
      ...db,
      students: db.students.map((student) =>
        student.id === id ? { ...student, ...payload } : student,
      ),
    }
    next.parents = db.parents.map((parent) => {
      const children = new Set(parent.childIds || [])
      if (parent.id === payload.parentId) children.add(id)
      if (parent.id === previous?.parentId && parent.id !== payload.parentId) {
        children.delete(id)
      }
      return { ...parent, childIds: [...children] }
    })
    return next
  },

  deleteStudent(db, id) {
    const previous = db.students.find((student) => student.id === id)
    const next = {
      ...db,
      students: db.students.filter((student) => student.id !== id),
    }
    next.parents = db.parents.map((parent) =>
      parent.id === previous?.parentId
        ? {
            ...parent,
            childIds: (parent.childIds || []).filter((childId) => childId !== id),
          }
        : parent,
    )
    return next
  },

  addParent(db, payload) {
    const parentId = `parent-${Date.now().toString(36)}`
    const childIds = payload.childIds || []
    return {
      ...db,
      parents: [...db.parents, { ...payload, id: parentId, childIds }],
      students: db.students.map((student) =>
        childIds.includes(student.id)
          ? { ...student, parentId }
          : student,
      ),
    }
  },

  updateParent(db, id, payload) {
    const childIds = payload.childIds || []
    return {
      ...db,
      parents: db.parents.map((parent) =>
        parent.id === id ? { ...parent, ...payload, childIds } : parent,
      ),
      students: db.students.map((student) => {
        if (childIds.includes(student.id)) return { ...student, parentId: id }
        if (student.parentId === id) return { ...student, parentId: null }
        return student
      }),
    }
  },

  deleteParent(db, id) {
    return {
      ...db,
      parents: db.parents.filter((parent) => parent.id !== id),
      students: db.students.map((student) =>
        student.parentId === id ? { ...student, parentId: null } : student,
      ),
    }
  },

  addTutor(db, payload) {
    if (!departmentIsActive(db, payload.departmentId)) return db
    const tutorId = `tutor-${Date.now().toString(36)}`
    const classIds = payload.classIds || []
    if (
        (classIds.length && (payload.status || 'active') !== 'active') ||
      classIds.some(
        (classId) => !classIsActive(db, classId),
      )
    ) {
      return db
    }
    const clean = { ...payload }
    delete clean.classIds
    return {
      ...db,
      tutors: [...db.tutors, { id: tutorId, role: ROLES.CLASS_TUTOR, ...clean }],
      classes: db.classes.map((classItem) =>
        classIds.includes(classItem.id)
          ? { ...classItem, tutorId }
          : classItem,
      ),
    }
  },

  updateTutor(db, id, payload) {
    const current = db.tutors.find((tutor) => tutor.id === id)
    if (!current) return db
    const classIds = payload.classIds || []
    const departmentId = payload.departmentId || current.departmentId
    const addedClassIds = classIds.filter(
      (classId) => !db.classes.some((classItem) => classItem.id === classId && classItem.tutorId === id),
    )
    if (
      (departmentId !== current.departmentId && !departmentIsActive(db, departmentId)) ||
      (payload.status === 'inactive' && addedClassIds.length > 0) ||
      addedClassIds.some((classId) => !classIsActive(db, classId))
    ) {
      return db
    }
    const clean = { ...payload }
    delete clean.classIds
    return {
      ...db,
      tutors: db.tutors.map((tutor) =>
        tutor.id === id ? { ...tutor, ...clean } : tutor,
      ),
      classes: db.classes.map((classItem) => {
        if (classIds.includes(classItem.id)) return { ...classItem, tutorId: id }
        if (classItem.tutorId === id) return { ...classItem, tutorId: '' }
        return classItem
      }),
    }
  },

  deleteTutor(db, id) {
    return {
      ...db,
      tutors: db.tutors.filter((tutor) => tutor.id !== id),
      classes: db.classes.map((classItem) =>
        classItem.tutorId === id ? { ...classItem, tutorId: '' } : classItem,
      ),
    }
  },

  updateAccountStatus(db, role, id, status) {
    if (!['active', 'inactive'].includes(status)) return db
    if (role === ROLES.ADMIN) {
      if (id !== 'admin-1') return db
      return { ...db, adminStatus: status }
    }
    const collection =
      role === ROLES.HOD
        ? 'hods'
        : role === ROLES.CLASS_TUTOR
          ? 'tutors'
          : role === ROLES.PARENT
            ? 'parents'
            : null
    if (!collection || !db[collection]?.some((account) => account.id === id)) {
      return db
    }
    if (role === ROLES.HOD) {
      const target = db.hods.find((hod) => hod.id === id)
      if (status === 'active' && !departmentIsActive(db, target.departmentId)) return db
    }
    const next = {
      ...db,
      [collection]: db[collection].map((account) =>
        account.id === id
          ? { ...account, status }
          : role === ROLES.HOD &&
              status === 'active' &&
              account.departmentId === db.hods.find((hod) => hod.id === id)?.departmentId
            ? { ...account, status: 'inactive' }
            : account,
      ),
    }
    if (role === ROLES.HOD) {
      const hod = db.hods.find((account) => account.id === id)
      return syncDepartmentHod(next, hod.departmentId)
    }
    return next
  },

  submitLeave(db, payload, actor) {
    const student = findStudent(db, payload.studentId)
    if (!student) {
      console.warn('[CLMS demo] Leave submission rejected: unknown student.')
      return db
    }
    if (!isGuardian(db, actor, student)) {
      console.warn(
        `[CLMS demo] An authenticated linked parent is required to submit for student ${student.id}.`,
      )
      return db
    }
    const departmentId = departmentIdForStudent(db, student)
    const classItem = db.classes.find((item) => item.id === student.classId)
    if (!departmentIsActive(db, departmentId) || classItem?.status !== 'active') {
      console.warn('[CLMS demo] Inactive departments and classes cannot receive new leave applications.')
      return db
    }

    const now = new Date().toISOString()
    const id = `LV-${new Date().getFullYear()}-${String(nextSequence(db.leaves)).padStart(3, '0')}`
    const parentId = actor?.id || student.parentId || null
    const hod = hodForDepartment(db, departmentId)
    const parent = (db.parents || []).find((item) => item.id === parentId)
    const leave = {
      ...payload,
      studentId: student.id,
      id,
      parentId,
      submittedById: parentId,
      submittedByRole: ROLES.PARENT,
      status: 'pending',
      submittedAt: now,
      decisionAt: null,
      decidedBy: null,
      decidedById: null,
      decidedByRole: null,
      remarks: '',
      rejectionReason: '',
      reopenedAt: null,
      reopenedBy: null,
      reopenedById: null,
      reopenReason: '',
      previousDecision: null,
      tutorNotified: false,
      history: [
        {
          status: 'submitted',
          label: 'Application submitted',
          at: now,
          by: parent?.name || actor?.name || 'Parent / Guardian',
          note: 'Leave request submitted from the parent portal.',
        },
      ],
    }

    const next = { ...db, leaves: [leave, ...db.leaves] }

    if (hod) {
      addNotification(next, {
        type: 'new_application',
        title: 'New leave application received',
        message: `${parent?.name || 'A guardian'} submitted a ${payload.leaveType.toLowerCase()} request for ${student.name} (${student.registerNumber}) from ${formatDate(payload.fromDate)} to ${formatDate(payload.toDate)}.`,
        applicationId: id,
        recipients: recipientsFor(identity(ROLES.HOD, hod.id)),
      })
    } else {
      console.warn(
        `[CLMS demo] No HOD is configured for department ${departmentId}; the application has no reviewer notification.`,
      )
    }

    return next
  },

  approveLeave(db, id, remarks, actor) {
    const original = db.leaves.find((leave) => leave.id === id)
    if (!original || !['pending', 'reopened'].includes(original.status)) return db
    if (!canHodDecide(db, actor, original)) return db

    const student = findStudent(db, original.studentId)
    const tutor = findTutorForStudent(db, student)
    const parent = (db.parents || []).find((item) => item.id === original.parentId)
    const now = new Date().toISOString()
    const next = { ...db }
    const leave = {
      ...original,
      status: 'approved',
      decisionAt: now,
      decidedBy: actor.name || 'Head of Department',
      decidedById: actor.id,
      decidedByRole: ROLES.HOD,
      decisionDepartmentId: departmentIdForStudent(db, student),
      remarks: String(remarks || '').trim(),
      rejectionReason: '',
      tutorNotified: true,
      previousDecision: original.previousDecision || null,
      history: [
        ...(original.history || []),
        {
          status: 'approved',
          label: 'Approved by HOD',
          at: now,
          by: actor.name || 'Head of Department',
          note: String(remarks || '').trim() || 'Leave approved.',
        },
      ],
    }
    next.leaves = db.leaves.map((item) => (item.id === id ? leave : item))

    addNotification(next, {
      type: 'leave_approved',
      title: 'Leave application approved',
      message: `${student?.name || 'Your child'}'s leave request (${id}) was approved by ${actor.name || 'the HOD'}.`,
      applicationId: id,
      recipients: recipientsFor(
        identity(ROLES.HOD, actor.id),
        identity(ROLES.PARENT, leave.parentId || parent?.id),
      ),
    })

    if (tutor) {
      // Approved leave is routed to the tutor of the student's own class only.
      addNotification(next, {
        type: 'forwarded_to_tutor',
        title: 'Approved leave forwarded',
        message: `${student.name} (${student.registerNumber}) has approved leave from ${formatDate(original.fromDate)} to ${formatDate(original.toDate)}.`,
        applicationId: id,
        recipients: recipientsFor(identity(ROLES.CLASS_TUTOR, tutor.id)),
      })
    }

    return next
  },

  resubmitLeave(db, id, payload, actor) {
    const original = db.leaves.find((leave) => leave.id === id)
    if (!original || original.status !== 'reopened') return db
    const targetStudent = findStudent(db, payload.studentId || original.studentId)
    if (!targetStudent) return db
    if (!isGuardian(db, actor, targetStudent)) {
      console.warn(
        `[CLMS demo] An authenticated linked parent is required to resubmit leave ${id}.`,
      )
      return db
    }

    const parentId = actor?.id || targetStudent.parentId || original.parentId
    const parent = (db.parents || []).find((item) => item.id === parentId)
    const departmentId = departmentIdForStudent(db, targetStudent)
    const hod = hodForDepartment(db, departmentId)
    const now = new Date().toISOString()
    const next = { ...db }
    const leave = {
      ...original,
      ...payload,
      studentId: targetStudent.id,
      parentId,
      submittedById: parentId,
      submittedByRole: ROLES.PARENT,
      status: 'pending',
      remarks: '',
      rejectionReason: '',
      decisionAt: null,
      decidedBy: null,
      decidedById: null,
      decidedByRole: null,
      decisionDepartmentId: null,
      tutorNotified: false,
      reopenedAt: null,
      reopenedBy: null,
      reopenedById: null,
      reopenReason: '',
      previousDecision: null,
      history: [
        ...(original.history || []),
        {
          status: 'submitted',
          label: 'Corrected and resubmitted',
          at: now,
          by: parent?.name || actor?.name || 'Parent / Guardian',
          note: 'The parent updated the application after the HOD requested a correction.',
        },
      ],
    }
    next.leaves = db.leaves.map((item) => (item.id === id ? leave : item))

    if (hod) {
      addNotification(next, {
        type: 'new_application',
        title: 'Corrected leave application received',
        message: `${parent?.name || 'The parent'} resubmitted ${id} for ${targetStudent.name} after the requested correction.`,
        applicationId: id,
        recipients: recipientsFor(identity(ROLES.HOD, hod.id)),
      })
    }
    return next
  },

  rejectLeave(db, id, reason, actor) {
    const original = db.leaves.find((leave) => leave.id === id)
    if (!original || !['pending', 'reopened'].includes(original.status)) return db
    if (!canHodDecide(db, actor, original)) return db

    const trimmed = String(reason || '').trim()
    if (trimmed.length < 15) return db
    const student = findStudent(db, original.studentId)
    const parent = (db.parents || []).find((item) => item.id === original.parentId)
    const now = new Date().toISOString()
    const next = { ...db }
    const leave = {
      ...original,
      status: 'rejected',
      decisionAt: now,
      decidedBy: actor.name || 'Head of Department',
      decidedById: actor.id,
      decidedByRole: ROLES.HOD,
      decisionDepartmentId: departmentIdForStudent(db, student),
      remarks: '',
      rejectionReason: trimmed,
      tutorNotified: false,
      previousDecision: original.previousDecision || null,
      history: [
        ...(original.history || []),
        {
          status: 'rejected',
          label: 'Rejected by HOD',
          at: now,
          by: actor.name || 'Head of Department',
          note: trimmed,
        },
      ],
    }
    next.leaves = db.leaves.map((item) => (item.id === id ? leave : item))

    addNotification(next, {
      type: 'leave_rejected',
      title: 'Leave application rejected',
      message: `${student?.name || 'Your child'}'s leave request (${id}) was rejected. Reason: ${trimmed}`,
      applicationId: id,
      recipients: recipientsFor(
        identity(ROLES.HOD, actor.id),
        identity(ROLES.PARENT, leave.parentId || parent?.id),
      ),
    })

    // Rejection never creates a tutor notification.
    return next
  },

  reopenLeave(db, id, reason, actor) {
    const original = db.leaves.find((leave) => leave.id === id)
    if (!original || !['approved', 'rejected'].includes(original.status)) return db
    if (!canHodDecide(db, actor, original)) return db

    const trimmed = String(reason || '').trim()
    if (trimmed.length < 15) {
      console.warn('[CLMS demo] Reopening requires a reason.')
      return db
    }
    const student = findStudent(db, original.studentId)
    const parent = (db.parents || []).find((item) => item.id === original.parentId)
    const now = new Date().toISOString()
    const next = { ...db }
    const leave = {
      ...original,
      status: 'reopened',
      reopenedAt: now,
      reopenedBy: actor.name || 'Head of Department',
      reopenedById: actor.id,
      reopenReason: trimmed,
      tutorNotified: false,
      previousDecision: original.previousDecision || {
        status: original.status,
        at: original.decisionAt,
        by: original.decidedBy || 'Head of Department',
        byId: original.decidedById || null,
        note:
          original.status === 'approved'
            ? original.remarks || 'Approved earlier.'
            : original.rejectionReason || 'Rejected earlier.',
      },
      history: [
        ...(original.history || []),
        {
          status: 'reopened',
          label: 'Reopened for correction',
          at: now,
          by: actor.name || 'Head of Department',
          note: trimmed,
        },
      ],
    }
    next.leaves = db.leaves.map((item) => (item.id === id ? leave : item))

    addNotification(next, {
      type: 'application_reopened',
      title: 'Application reopened for correction',
      message: `${student?.name || 'Your child'}'s leave request (${id}) was reopened by ${actor.name || 'the HOD'}. ${trimmed}`,
      applicationId: id,
      recipients: recipientsFor(
        identity(ROLES.HOD, actor.id),
        identity(ROLES.PARENT, leave.parentId || parent?.id),
      ),
    })

    return next
  },

  markNotificationRead(db, notificationId, userKey) {
    return {
      ...db,
      notifications: db.notifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              readBy: Array.from(
                new Set([...(notification.readBy || []), userKey]),
              ),
            }
          : notification,
      ),
    }
  },

  markAllNotificationsRead(db, user) {
    const key = recipientKeyForUser(user)
    return {
      ...db,
      notifications: db.notifications.map((notification) =>
        notificationMatches(notification, user)
          ? {
              ...notification,
              readBy: Array.from(
                new Set([...(notification.readBy || []), key]),
              ),
            }
          : notification,
      ),
    }
  },
}

export { createNotification, logEvent, reportValidation }
