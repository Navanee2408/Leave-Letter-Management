import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEMO_HOD_CREDENTIALS_STORAGE_KEY,
  DEMO_STORAGE_KEY,
  ROLES,
} from '../constants/index.js'
import {
  DEMO_ACCOUNTS,
  authenticateDemoUser,
  demoCredentialsForRole,
  getDemoAccounts,
  isDemoAccountActive,
  saveDemoHodPassword,
} from '../data/demoAuth.js'
import { createSeedData, DEMO_SEED_VERSION } from '../data/demoData.js'
import { demoService } from './demoStore.js'
import { validateDemoData } from './demoValidation.js'
import {
  migrateDemoDatabase,
  notificationsFor,
  recipientKeyForUser,
  unreadNotificationCount,
  loadDatabase,
} from './demoStore.js'
import {
  adminStats,
  allLeaves,
  departmentLeaveStats,
  filterAdminLeaves,
  monthlyLeaveSeries,
} from './selectors.js'
import { createCsv } from '../lib/csv.js'

function createRequest() {
  const db = createSeedData()
  const student = db.students[0]
  const parent = db.parents.find((item) => item.id === student.parentId)
  const hod = db.hods.find((item) => item.departmentId === student.departmentId)
  const classItem = db.classes.find((item) => item.id === student.classId)
  const tutor = db.tutors.find((item) => item.id === classItem.tutorId)
  const payload = {
    studentId: student.id,
    leaveType: 'Medical Leave',
    fromDate: '2026-12-01',
    toDate: '2026-12-02',
    reason: 'Medical appointment and recovery at home.',
  }
  const submittedDb = demoService.submitLeave(db, payload, parent)
  const leave = submittedDb.leaves[0]

  return { db, submittedDb, leave, student, parent, hod, tutor, payload }
}

test('seed data includes all required relationships and departments', () => {
  const result = validateDemoData(createSeedData())
  assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'))
})

test('only a linked parent can submit a leave request', () => {
  const { db, student, parent, payload } = createRequest()
  const otherParent = db.parents.find((item) => item.id !== parent.id)
  const forgedParent = {
    id: 'parent-not-in-database',
    role: ROLES.PARENT,
    childIds: [student.id],
  }

  assert.equal(demoService.submitLeave(db, payload, null), db)
  assert.equal(demoService.submitLeave(db, payload, otherParent), db)
  assert.equal(demoService.submitLeave(db, payload, forgedParent), db)
  assert.equal(
    demoService.submitLeave(db, payload, { ...parent, role: ROLES.ADMIN }),
    db,
  )
  assert.equal(student.parentId, parent.id)
})

test('approval is department-scoped and notifies only the assigned tutor', () => {
  const { submittedDb, leave, hod, tutor, db } = createRequest()
  const otherHod = db.hods.find((item) => item.id !== hod.id)

  assert.equal(demoService.approveLeave(submittedDb, leave.id, '', otherHod), submittedDb)
  assert.equal(demoService.approveLeave(submittedDb, leave.id, ''), submittedDb)

  const approvedDb = demoService.approveLeave(submittedDb, leave.id, '', hod)
  const updatedLeave = approvedDb.leaves.find((item) => item.id === leave.id)
  const tutorNotifications = approvedDb.notifications.filter(
    (item) => item.applicationId === leave.id && item.type === 'forwarded_to_tutor',
  )

  assert.equal(updatedLeave.status, 'approved')
  assert.equal(tutorNotifications.length, 1)
  assert.deepEqual(tutorNotifications[0].recipients, [
    { role: ROLES.CLASS_TUTOR, id: tutor.id },
  ])
  assert.equal(
    approvedDb.notifications.some(
      (item) =>
        item.applicationId === leave.id &&
        item.type === 'leave_approved' &&
        item.recipients.some((recipient) => recipient.role === ROLES.CLASS_TUTOR),
    ),
    false,
  )
  assert.equal(demoService.approveLeave(approvedDb, leave.id, '', hod), approvedDb)
})

test('rejection requires a reason and never notifies a tutor', () => {
  const { submittedDb, leave, hod } = createRequest()

  assert.equal(demoService.rejectLeave(submittedDb, leave.id, '', hod), submittedDb)
  assert.equal(demoService.rejectLeave(submittedDb, leave.id, 'Too short', hod), submittedDb)

  const rejectedDb = demoService.rejectLeave(
    submittedDb,
    leave.id,
    'Please provide the missing medical documentation.',
    hod,
  )
  const updatedLeave = rejectedDb.leaves.find((item) => item.id === leave.id)

  assert.equal(updatedLeave.status, 'rejected')
  assert.equal(
    rejectedDb.notifications.some(
      (item) =>
        item.applicationId === leave.id &&
        item.recipients.some((recipient) => recipient.role === ROLES.CLASS_TUTOR),
    ),
    false,
  )
  assert.equal(demoService.rejectLeave(rejectedDb, leave.id, 'Valid reason is long enough.', hod), rejectedDb)
})

test('reopening requires a prior decision and preserves correction history', () => {
  const { submittedDb, leave, hod, parent } = createRequest()
  const approvedDb = demoService.approveLeave(submittedDb, leave.id, '', hod)

  assert.equal(demoService.reopenLeave(submittedDb, leave.id, 'A valid correction reason.', hod), submittedDb)
  assert.equal(demoService.reopenLeave(approvedDb, leave.id, '   ', hod), approvedDb)

  const reopenedDb = demoService.reopenLeave(
    approvedDb,
    leave.id,
    'Please attach the required supporting document.',
    hod,
  )
  const reopenedLeave = reopenedDb.leaves.find((item) => item.id === leave.id)

  assert.equal(reopenedLeave.status, 'reopened')
  assert.equal(reopenedLeave.previousDecision.status, 'approved')
  assert.equal(reopenedLeave.history.at(-1).note, reopenedLeave.reopenReason)
  assert.equal(demoService.reopenLeave(reopenedDb, leave.id, 'Another correction reason.', hod), reopenedDb)
  assert.equal(demoService.resubmitLeave(reopenedDb, leave.id, {}, null), reopenedDb)

  const resubmittedDb = demoService.resubmitLeave(reopenedDb, leave.id, {}, parent)
  const resubmittedLeave = resubmittedDb.leaves.find((item) => item.id === leave.id)
  assert.equal(resubmittedLeave.status, 'pending')
  assert.equal(resubmittedLeave.previousDecision, null)
  assert.equal(resubmittedLeave.reopenReason, '')
})

test('account deactivation persists and blocks demo authentication and access', () => {
  const db = createSeedData()
  const parent = db.parents[0]
  const credentials = DEMO_ACCOUNTS.find((account) => account.id === parent.id)
  const inactiveDb = demoService.updateAccountStatus(
    db,
    ROLES.PARENT,
    parent.id,
    'inactive',
  )

  assert.equal(isDemoAccountActive(db, parent), true)
  assert.equal(isDemoAccountActive(inactiveDb, parent), false)
  assert.equal(validateDemoData(inactiveDb).valid, true)
  assert.match(
    authenticateDemoUser(credentials.email, credentials.password, inactiveDb).error,
    /inactive/i,
  )
})

test('HOD assignments swap atomically without duplicate active department assignments', () => {
  const db = createSeedData()
  const firstHod = db.hods[0]
  const secondHod = db.hods[1]
  const firstDepartmentId = firstHod.departmentId
  const secondDepartmentId = secondHod.departmentId
  const duplicate = demoService.addHod(db, {
    name: 'Another HOD',
    email: 'another.hod@example.com',
    departmentId: firstDepartmentId,
  })

  assert.equal(duplicate, db)
  const updatedHod = demoService.updateHod(db, firstHod.id, {
    departmentId: secondDepartmentId,
  })
  assert.equal(
    updatedHod.hods.find((hod) => hod.id === firstHod.id).departmentId,
    secondDepartmentId,
  )
  assert.equal(validateDemoData(updatedHod).valid, true)
  const reassigned = demoService.assignHod(db, firstDepartmentId, secondHod.id)
  assert.equal(
    reassigned.hods.find((hod) => hod.id === firstHod.id).departmentId,
    secondDepartmentId,
  )
  assert.equal(
    reassigned.hods.find((hod) => hod.id === secondHod.id).departmentId,
    firstDepartmentId,
  )
  assert.equal(validateDemoData(reassigned).valid, true)
})

test('Admin statistics and filters cover department, status, student, and date', () => {
  const db = createSeedData()
  const target = allLeaves(db)[0]
  const filtered = filterAdminLeaves(db, {
    departmentId: target.department.id,
    status: target.status,
    query: target.registerNumber,
    fromDate: target.fromDate,
    toDate: target.toDate,
  })
  const stats = adminStats(db)
  const departments = departmentLeaveStats(db)
  const months = monthlyLeaveSeries(db, new Date().getFullYear())

  assert.equal(filtered.some((leave) => leave.id === target.id), true)
  assert.equal(stats.departments, 5)
  assert.equal(stats.hods, 5)
  assert.equal(stats.tutors, 10)
  assert.equal(stats.students, 20)
  assert.equal(stats.parents, 20)
  assert.equal(departments.length, 5)
  assert.equal(months.length, 12)
  assert.equal(
    months.reduce((count, month) => count + month.reopened, 0),
    stats.reopened,
  )
})

test('CSV export quotes values and neutralizes spreadsheet formulas', () => {
  assert.equal(
    createCsv(
      [{ name: 'Demo Student, One', note: '=HYPERLINK("x")' }],
      [
        { key: 'name', header: 'Student' },
        { key: 'note', header: 'Note' },
      ],
    ),
    '"Student","Note"\r\n"Demo Student, One","\'=HYPERLINK(""x"")"',
  )
})

test('Admin status persists and inactive Admin cannot sign in or access routes', () => {
  const db = createSeedData()
  const admin = DEMO_ACCOUNTS.find((account) => account.role === ROLES.ADMIN)
  const inactiveDb = demoService.updateAccountStatus(
    db,
    ROLES.ADMIN,
    admin.id,
    'inactive',
  )

  assert.equal(isDemoAccountActive(inactiveDb, admin), false)
  assert.match(
    authenticateDemoUser(admin.email, admin.password, inactiveDb).error,
    /inactive/i,
  )
})

test('edited HOD details are returned at sign-in while static demo passwords remain valid', () => {
  const db = createSeedData()
  const hod = db.hods[0]
  const credentials = DEMO_ACCOUNTS.find((account) => account.id === hod.id)
  const updatedDb = demoService.updateHod(db, hod.id, {
    name: 'Updated HOD Name',
    email: 'updated.hod@example.com',
  })
  const result = authenticateDemoUser(
    'updated.hod@example.com',
    credentials.password,
    updatedDb,
  )

  assert.equal(demoCredentialsForRole(updatedDb, ROLES.HOD).email, 'updated.hod@example.com')
  assert.equal(result.user.name, 'Updated HOD Name')
  assert.equal(result.user.email, 'updated.hod@example.com')
  assert.equal(isDemoAccountActive(updatedDb, result.user), true)
  assert.match(
    authenticateDemoUser(credentials.email, credentials.password, updatedDb).error,
    /invalid/i,
  )
})

test('new HOD creation replaces the active assignment and keeps its password outside profile data', () => {
  const db = createSeedData()
  const previousStorage = globalThis.localStorage
  const values = new Map()
  globalThis.localStorage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
  }

  try {
    const newEmail = 'new.hod@example.com'
    const password = 'DemoOnly!NewHodTest-9xP4v7K2'
    assert.equal(
      demoService.addHod(
        db,
        {
          name: 'Duplicate Email',
          email: DEMO_ACCOUNTS.find((account) => account.role === ROLES.HOD).email,
          employeeId: 'DEMO-HOD-NEW-EMAIL',
          departmentId: 'dept-cse',
          password,
        },
        { replaceActive: true },
      ),
      db,
    )
    assert.equal(
      demoService.addHod(
        db,
        {
          name: 'Duplicate Employee ID',
          email: 'duplicate.employee@example.com',
          employeeId: db.hods[0].employeeId,
          departmentId: 'dept-cse',
          password,
        },
        { replaceActive: true },
      ),
      db,
    )
    const next = demoService.addHod(
      db,
      {
        name: 'New HOD',
        email: newEmail,
        employeeId: 'TCE-HOD-NEW',
        phone: '',
        departmentId: 'dept-cse',
        password,
        status: 'active',
      },
      { replaceActive: true },
    )
    const added = next.hods.find((hod) => hod.email === newEmail)
    const previousHod = db.hods.find((hod) => hod.departmentId === 'dept-cse')

    assert.ok(added)
    assert.equal(Object.hasOwn(added, 'password'), false)
    assert.equal(next.hods.find((hod) => hod.id === previousHod.id).status, 'inactive')
    assert.equal(next.departments.find((department) => department.id === 'dept-cse').hodId, added.id)
    const previouslyDecidedLeave = db.leaves.find(
      (leave) => leave.decidedById === previousHod.id,
    )
    assert.ok(previouslyDecidedLeave)
    assert.equal(
      next.leaves.find((leave) => leave.id === previouslyDecidedLeave.id).decidedById,
      previousHod.id,
    )

    saveDemoHodPassword(added.id, password)
    assert.equal(getDemoAccounts(next).some((account) => account.id === added.id), true)
    assert.equal(authenticateDemoUser(newEmail, password, next).user.id, added.id)
    const restoredAssignment = demoService.updateAccountStatus(
      next,
      ROLES.HOD,
      previousHod.id,
      'active',
    )
    assert.equal(
      restoredAssignment.hods.find((hod) => hod.id === previousHod.id).status,
      'active',
    )
    assert.equal(
      restoredAssignment.hods.find((hod) => hod.id === added.id).status,
      'inactive',
    )
    assert.equal(validateDemoData(next).valid, true)
    assert.equal(validateDemoData(restoredAssignment).valid, true)
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

test('HOD notifications are department-scoped and marking read updates only that HOD badge', () => {
  const db = createSeedData()
  const hod = db.hods.find((item) => item.departmentId === 'dept-cse')
  const otherHod = db.hods.find((item) => item.departmentId === 'dept-it')
  const inbox = notificationsFor(db, hod)
  const otherInbox = notificationsFor(db, otherHod)
  const key = recipientKeyForUser(hod)

  assert.ok(inbox.length > 0)
  assert.ok(
    inbox.every((notification) => {
      const leave = db.leaves.find((item) => item.id === notification.applicationId)
      const student = db.students.find((item) => item.id === leave?.studentId)
      return (
        notification.recipients.some(
          (recipient) => recipient.role === ROLES.HOD && recipient.id === hod.id,
        ) && student?.departmentId === hod.departmentId
      )
    }),
  )
  assert.equal(notificationsFor({ ...db, notifications: [] }, hod).length, 0)

  const before = unreadNotificationCount(db, hod)
  const updated = demoService.markNotificationRead(db, inbox[0].id, key)
  assert.equal(unreadNotificationCount(updated, hod), before - 1)
  assert.equal(notificationsFor(updated, otherHod).length, otherInbox.length)
})

test('database migration preserves dynamic departments and backfills seeded HOD employee IDs', () => {
  const db = createSeedData()
  const withMaths = {
    ...db,
    hods: db.hods.map((hod) => ({ ...hod, employeeId: '' })),
    departments: [
      ...db.departments,
      { id: 'dept-mt', code: 'MT', name: 'Mathematics', status: 'active' },
    ],
  }
  const normalized = migrateDemoDatabase(withMaths)

  assert.deepEqual(
    normalized.departments.map((department) => department.code),
    ['CSE', 'IT', 'ECE', 'MECH', 'MCA', 'MT'],
  )
  assert.ok(normalized.hods.every((hod) => hod.employeeId))
  assert.equal(demoService.deleteDepartment(db, 'dept-mca'), db)
  assert.equal(validateDemoData(normalized).valid, true)
})

test('department service creates dynamic departments and preserves related records on edit', () => {
  const db = createSeedData()
  const expanded = demoService.addDepartment(db, {
    code: 'aids',
    name: 'Artificial Intelligence and Data Science',
    description: 'AI and data science programs.',
  })
  assert.equal(expanded.departments.length, 6)
  assert.equal(expanded.departments[5].code, 'AIDS')
  assert.equal(
    demoService.addDepartment(expanded, { code: 'aids', name: 'Duplicate code' }),
    expanded,
  )
  assert.equal(
    demoService.addDepartment(expanded, {
      code: 'ROBOTICS',
      name: 'Computer Science and Engineering',
    }),
    expanded,
  )
  const unassignedDepartmentDb = demoService.addDepartment(expanded, {
    code: 'CIVIL',
    name: 'Civil Engineering',
  })
  const unassignedDepartment = unassignedDepartmentDb.departments.find(
    (item) => item.code === 'CIVIL',
  )
  const assignedHodDb = demoService.assignHod(
    unassignedDepartmentDb,
    unassignedDepartment.id,
    db.hods[0].id,
  )
  assert.equal(
    assignedHodDb.hods.find((hod) => hod.id === db.hods[0].id).departmentId,
    unassignedDepartment.id,
  )
  assert.equal(validateDemoData(assignedHodDb).valid, true)

  const department = expanded.departments.find((item) => item.code === 'CSE')
  const updated = demoService.updateDepartment(expanded, department.id, {
    name: 'Computer Science and Engineering Updated',
    description: 'Computing and software systems.',
  })

  assert.equal(updated.departments.length, 6)
  assert.equal(updated.departments.find((item) => item.id === department.id).description, 'Computing and software systems.')
  assert.equal(updated.departments.find((item) => item.id === department.id).hodId, department.hodId)
  assert.equal(updated.classes.length, expanded.classes.length)
  assert.equal(updated.students.length, expanded.students.length)
  assert.equal(validateDemoData(updated).valid, true)
})

test('dynamic department supports HOD, class, tutor, student, reports, and historic leave after deactivation', () => {
  const db = createSeedData()
  const departmentDb = demoService.addDepartment(db, {
    code: 'aids',
    name: 'Artificial Intelligence and Data Science',
    description: 'AI and data science programs.',
    status: 'active',
  })
  const department = departmentDb.departments.find((item) => item.code === 'AIDS')
  const parent = departmentDb.parents[0]
  const hodPayload = {
    name: 'AIDS Department Head',
    email: 'hod.aids@example.com',
    employeeId: 'DEMO-HOD-AIDS',
    departmentId: department.id,
    status: 'active',
  }
  const hodDb = demoService.addHod(departmentDb, hodPayload)
  const hod = hodDb.hods.find((item) => item.email === hodPayload.email)
  assert.ok(hod)
  assert.equal(hodDb.departments.find((item) => item.id === department.id).hodId, hod.id)

  const classDb = demoService.addClass(hodDb, {
    departmentId: department.id,
    academicYear: '2026–2027',
    year: '1',
    section: 'A',
    status: 'active',
    tutorId: '',
  })
  const classItem = classDb.classes.find((item) => item.departmentId === department.id)
  assert.ok(classItem)
  assert.equal(
    demoService.addClass(classDb, { ...classItem, id: undefined }),
    classDb,
  )

  const tutorDb = demoService.addTutor(classDb, {
    name: 'AIDS Class Tutor',
    email: 'tutor.aids@example.com',
    phone: '+1-202-555-0198',
    departmentId: 'dept-cse',
    designation: 'Assistant Professor',
    status: 'active',
    classIds: [classItem.id],
  })
  const tutor = tutorDb.tutors.find((item) => item.email === 'tutor.aids@example.com')
  assert.ok(tutor)
  assert.equal(tutorDb.classes.find((item) => item.id === classItem.id).tutorId, tutor.id)

  const studentDb = demoService.addStudent(tutorDb, {
    name: 'AIDS Student',
    registerNumber: '26AI1001',
    email: 'aids.student@example.com',
    phone: '+1-202-555-0199',
    departmentId: department.id,
    classId: classItem.id,
    parentId: parent.id,
    status: 'active',
  })
  const student = studentDb.students.find((item) => item.email === 'aids.student@example.com')
  assert.ok(student)
  assert.equal(student.departmentId, department.id)
  assert.equal(studentDb.parents.find((item) => item.id === parent.id).childIds.includes(student.id), true)
  assert.equal(
    demoService.addStudent(studentDb, {
      ...student,
      id: undefined,
      registerNumber: '26AI1002',
      email: 'aids.mismatch@example.com',
      departmentId: 'dept-cse',
      classId: classItem.id,
    }),
    studentDb,
  )
  assert.equal(
    demoService.updateStudent(studentDb, student.id, {
      departmentId: 'dept-cse',
      classId: classItem.id,
    }),
    studentDb,
  )
  assert.equal(
    demoService.updateClass(studentDb, classItem.id, {
      departmentId: 'dept-cse',
      academicYear: classItem.academicYear,
      year: classItem.year,
      section: classItem.section,
      status: classItem.status,
      tutorId: classItem.tutorId,
    }),
    studentDb,
  )

  const leaveDb = demoService.submitLeave(
    studentDb,
    {
      studentId: student.id,
      leaveType: 'Medical Leave',
      fromDate: '2030-04-10',
      toDate: '2030-04-11',
      reason: 'Medical appointment and recovery at home.',
    },
    parent,
  )
  const leave = leaveDb.leaves[0]
  const approvedDb = demoService.approveLeave(leaveDb, leave.id, '', hod)
  assert.equal(approvedDb.leaves[0].status, 'approved')
  assert.equal(
    approvedDb.notifications.some(
      (notification) =>
        notification.applicationId === leave.id &&
        notification.recipients.some(
          (recipient) => recipient.role === ROLES.CLASS_TUTOR && recipient.id === tutor.id,
        ),
    ),
    true,
  )

  const deactivatedDb = demoService.updateDepartment(approvedDb, department.id, {
    status: 'inactive',
  })
  assert.equal(deactivatedDb.departments.find((item) => item.id === department.id).status, 'inactive')
  assert.equal(deactivatedDb.leaves.some((item) => item.id === leave.id), true)
  assert.equal(deactivatedDb.classes.some((item) => item.id === classItem.id), true)
  assert.equal(deactivatedDb.students.some((item) => item.id === student.id), true)
  assert.equal(demoService.deleteDepartment(deactivatedDb, department.id), deactivatedDb)
  assert.equal(
    demoService.addClass(deactivatedDb, {
      ...classItem,
      id: undefined,
      year: '2',
    }),
    deactivatedDb,
  )
  assert.equal(
    demoService.addHod(deactivatedDb, {
      ...hodPayload,
      email: 'inactive.department.hod@example.com',
      employeeId: 'DEMO-HOD-INACTIVE',
    }),
    deactivatedDb,
  )
  assert.equal(
    demoService.addTutor(deactivatedDb, {
      name: 'Inactive Department Tutor',
      email: 'inactive.department.tutor@example.com',
      departmentId: department.id,
      status: 'active',
      classIds: [],
    }),
    deactivatedDb,
  )
  assert.equal(
    demoService.addStudent(deactivatedDb, {
      ...student,
      id: undefined,
      registerNumber: '26AI1003',
      email: 'aids.inactive@example.com',
    }),
    deactivatedDb,
  )
  assert.equal(adminStats(deactivatedDb).departments, 6)
  assert.equal(departmentLeaveStats(deactivatedDb).some((item) => item.id === department.id), true)
  assert.equal(
    filterAdminLeaves(deactivatedDb, { departmentId: department.id }).some(
      (item) => item.id === leave.id,
    ),
    true,
  )
  const reactivatedDb = demoService.updateDepartment(deactivatedDb, department.id, {
    status: 'active',
  })
  assert.equal(reactivatedDb.departments.find((item) => item.id === department.id).status, 'active')
  assert.equal(reactivatedDb.leaves.some((item) => item.id === leave.id), true)
  assert.equal(validateDemoData(deactivatedDb).valid, true)
  assert.equal(validateDemoData(reactivatedDb).valid, true)
})

test('older browser demo data is replaced with the sanitized seed', () => {
  const previousStorage = globalThis.localStorage
  const oldDatabase = createSeedData()
  oldDatabase.version = DEMO_SEED_VERSION - 1
  oldDatabase.parents[0].name = 'Old Demo Name'
  oldDatabase.parents[0].email = 'old.parent@example.com'
  const values = new Map([
    [DEMO_STORAGE_KEY, JSON.stringify(oldDatabase)],
    [DEMO_HOD_CREDENTIALS_STORAGE_KEY, JSON.stringify({ 'hod-old': 'old-demo-password' })],
  ])
  globalThis.localStorage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }

  try {
    const database = loadDatabase()
    const storedDatabase = JSON.parse(values.get(DEMO_STORAGE_KEY))
    assert.equal(database.version, DEMO_SEED_VERSION)
    assert.equal(database.parents[0].name, 'Demo Parent 01')
    assert.equal(storedDatabase.version, DEMO_SEED_VERSION)
    assert.equal(storedDatabase.parents[0].email, 'parent01@example.com')
    assert.equal(values.has(DEMO_HOD_CREDENTIALS_STORAGE_KEY), false)
  } finally {
    globalThis.localStorage = previousStorage
  }
})