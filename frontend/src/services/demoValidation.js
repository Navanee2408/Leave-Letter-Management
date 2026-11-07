import { LEAVE_STATUSES, ROLES, ROLE_VALUES } from '../constants/index.js'

/**
 * Development-only dataset validator.
 *
 * The demo database is edited in the browser, so relationships can drift when a
 * record is deleted or reassigned. Rather than silently repairing invalid links,
 * this utility reports every broken relationship so it can be surfaced to the
 * person editing the data.
 */

const asArray = (value) => (Array.isArray(value) ? value : [])

function duplicateValues(items, pick) {
  const seen = new Map()
  items.forEach((item) => {
    const value = String(pick(item) || '').trim().toLowerCase()
    if (!value) return
    seen.set(value, (seen.get(value) || 0) + 1)
  })
  return [...seen.entries()].filter(([, count]) => count > 1).map(([value]) => value)
}

function findById(items, id) {
  return items.find((item) => item.id === id) || null
}

export function validateDemoData(db) {
  const errors = []
  const add = (code, message) => {
    errors.push({ code, message })
  }

  if (!db || typeof db !== 'object') {
    add('database.missing', 'The demo database is missing or not an object.')
    return { valid: false, errors }
  }

  const departments = asArray(db.departments)
  const hods = asArray(db.hods)
  const classes = asArray(db.classes)
  const tutors = asArray(db.tutors)
  const students = asArray(db.students)
  const parents = asArray(db.parents)
  const leaves = asArray(db.leaves)
  const notifications = asArray(db.notifications)

  // Departments ------------------------------------------------------------
  duplicateValues(departments, (item) => item.code).forEach((code) => {
    add('department.duplicate-code', `Department code ${code.toUpperCase()} is used more than once.`)
  })
  duplicateValues(departments, (item) => item.name).forEach((name) => {
    add('department.duplicate-name', `Department name ${name} is used more than once.`)
  })
  duplicateValues(departments, (item) => item.id).forEach((id) => {
    add('department.duplicate-id', `Department id ${id} is used more than once.`)
  })
  departments.forEach((department) => {
    if (!/^[A-Z][A-Z0-9]{1,9}$/.test(String(department.code || '').toUpperCase())) {
      add('department.code-invalid', `Department ${department.name || department.id} has an invalid code.`)
    }
    if (!String(department.name || '').trim()) {
      add('department.name-missing', `Department ${department.id} has no name.`)
    }
    if (!['active', 'inactive'].includes(department.status)) {
      add('department.status-invalid', `Department ${department.code || department.id} has an invalid status.`)
    }
  })

  // HODs -------------------------------------------------------------------
  duplicateValues(hods, (item) => item.email).forEach((email) => {
    add('hod.duplicate-email', `HOD email ${email} is used by more than one account.`)
  })
  duplicateValues(hods, (item) => item.employeeId).forEach((employeeId) => {
    add('hod.duplicate-employee-id', `HOD employee ID ${employeeId} is used more than once.`)
  })
  duplicateValues(
    hods.filter((hod) => hod.status === 'active'),
    (item) => item.departmentId,
  ).forEach((departmentId) => {
    add(
      'hod.duplicate-active-department',
      `Department ${departmentId} has more than one active HOD.`,
    )
  })

  departments.forEach((department) => {
    const departmentHods = hods.filter((hod) => hod.departmentId === department.id)
    const activeHods = departmentHods.filter((hod) => hod.status === 'active')
    if (activeHods.length > 1) {
      add(
        'department.hod-count',
        `Department ${department.code || department.id} has ${activeHods.length} active HODs; no more than one is allowed.`,
      )
    }
    const primaryHod = activeHods[0]
    if (department.hodId && department.hodId !== primaryHod?.id) {
      add(
        'department.hod-mismatch',
        `Department ${department.code || department.id} points to ${department.hodId} but its HOD record is ${primaryHod.id}.`,
      )
    }
  })

  hods.forEach((hod) => {
    if (!findById(departments, hod.departmentId)) {
      add(
        'hod.department-invalid',
        `HOD ${hod.name || hod.id} references unknown department ${hod.departmentId || '(none)'}.`,
      )
    }
    if (!ROLE_VALUES.includes(hod.role)) {
      add('hod.role-invalid', `HOD ${hod.name || hod.id} has an invalid role value.`)
    }
  })

  // Classes & tutors -------------------------------------------------------
  duplicateValues(classes, (item) => item.id).forEach((id) => {
    add('class.duplicate-id', `Class id ${id} is used more than once.`)
  })
  duplicateValues(tutors, (item) => item.email).forEach((email) => {
    add('tutor.duplicate-email', `Tutor email ${email} is used by more than one account.`)
  })

  classes.forEach((classItem) => {
    const department = findById(departments, classItem.departmentId)
    if (!department) {
      add(
        'class.department-invalid',
        `Class ${classItem.id} references unknown department ${classItem.departmentId || '(none)'}.`,
      )
    }
    if (!['1', '2', '3', '4'].includes(String(classItem.year))) {
      add('class.year-invalid', `Class ${classItem.id} has invalid year ${classItem.year}.`)
    }
    if (!classItem.section || !/^[A-Z]$/.test(classItem.section)) {
      add('class.section-invalid', `Class ${classItem.id} has invalid section ${classItem.section || '(none)'}.`)
    }
    if (!classItem.tutorId) return
    const tutor = findById(tutors, classItem.tutorId)
    if (!tutor) {
      add(
        'class.tutor-invalid',
        `Class ${classItem.id} references unknown tutor ${classItem.tutorId}.`,
      )
      return
    }
  })

  const classIdentities = new Set()
  classes.forEach((classItem) => {
    const identity = [
      classItem.departmentId,
      classItem.academicYear,
      classItem.year,
      classItem.section,
    ].join(':').toLowerCase()
    if (classIdentities.has(identity)) {
      add('class.duplicate-identity', `Class ${classItem.id} duplicates a department/year/section/academic-year combination.`)
    }
    classIdentities.add(identity)
  })

  tutors.forEach((tutor) => {
    if (!findById(departments, tutor.departmentId)) {
      add(
        'tutor.department-invalid',
        `Tutor ${tutor.name || tutor.id} references unknown department ${tutor.departmentId || '(none)'}.`,
      )
    }
  })

  // Students & parents -----------------------------------------------------
  duplicateValues(students, (item) => item.registerNumber).forEach((registerNumber) => {
    add(
      'student.duplicate-register-number',
      `Register number ${registerNumber} is used by more than one student.`,
    )
  })
  duplicateValues(students, (item) => item.email).forEach((email) => {
    add('student.duplicate-email', `Student email ${email} is used by more than one student.`)
  })
  duplicateValues(parents, (item) => item.email).forEach((email) => {
    add('parent.duplicate-email', `Parent email ${email} is used by more than one account.`)
  })

  students.forEach((student) => {
    const classItem = findById(classes, student.classId)
    if (!classItem) {
      add(
        'student.class-invalid',
        `Student ${student.name || student.id} references unknown class ${student.classId || '(none)'}.`,
      )
    } else if (classItem.departmentId !== student.departmentId) {
      add(
        'student.department-mismatch',
        `Student ${student.name || student.id} is in ${student.departmentId} but class ${classItem.id} belongs to ${classItem.departmentId}.`,
      )
    }
    if (!findById(departments, student.departmentId)) {
      add(
        'student.department-invalid',
        `Student ${student.name || student.id} references unknown department ${student.departmentId || '(none)'}.`,
      )
    }
    const parent = findById(parents, student.parentId)
    if (!parent) {
      add(
        'student.parent-invalid',
        `Student ${student.name || student.id} references unknown parent ${student.parentId || '(none)'}.`,
      )
      return
    }
    if (!asArray(parent.childIds).includes(student.id)) {
      add(
        'student.parent-link-missing',
        `Parent ${parent.name || parent.id} does not list ${student.name || student.id} in childIds.`,
      )
    }
  })

  parents.forEach((parent) => {
    const childIds = asArray(parent.childIds)
    if (childIds.length === 0) {
      add(
        'parent.no-children',
        `Parent ${parent.name || parent.id} has no linked children. Every parent must be linked to at least one student.`,
      )
    }
    childIds.forEach((childId) => {
      const child = findById(students, childId)
      if (!child) {
        add(
          'parent.child-invalid',
          `Parent ${parent.name || parent.id} references unknown student ${childId}.`,
        )
        return
      }
    })
  })

  // Leaves -----------------------------------------------------------------
  duplicateValues(leaves, (item) => item.id).forEach((id) => {
    add('leave.duplicate-id', `Leave id ${id} is used more than once.`)
  })

  leaves.forEach((leave) => {
    const student = findById(students, leave.studentId)
    if (!student) {
      add(
        'leave.student-invalid',
        `Leave ${leave.id} references unknown student ${leave.studentId || '(none)'}.`,
      )
      return
    }
    const parent = findById(parents, leave.parentId)
    if (!parent) {
      add(
        'leave.parent-invalid',
        `Leave ${leave.id} references unknown parent ${leave.parentId || '(none)'}.`,
      )
    } else {
      const linked =
        asArray(parent.childIds).includes(student.id) ||
        student.parentId === parent.id
      if (!linked) {
        add(
          'leave.parent-not-guardian',
          `Leave ${leave.id} was submitted by ${parent.name || parent.id}, who is not a guardian of ${student.name || student.id}.`,
        )
      }
    }
    if (!LEAVE_STATUSES.includes(leave.status)) {
      add('leave.status-invalid', `Leave ${leave.id} has invalid status ${leave.status}.`)
    }
    if (leave.fromDate && leave.toDate && leave.toDate < leave.fromDate) {
      add('leave.date-range-invalid', `Leave ${leave.id} ends before it starts.`)
    }
    if (leave.decidedById) {
      const decidingHod = findById(hods, leave.decidedById)
      if (!decidingHod) {
        add(
          'leave.decided-by-invalid',
          `Leave ${leave.id} records unknown HOD ${leave.decidedById} as the decision maker.`,
        )
      }
    } else if (leave.decisionAt) {
      add(
        'leave.decided-by-missing',
        `Leave ${leave.id} has a decision date but no deciding HOD id.`,
      )
    }
    if (leave.status === 'approved' && !leave.tutorNotified) {
      add(
        'leave.tutor-not-notified',
        `Leave ${leave.id} is approved but the class tutor notification is not recorded.`,
      )
    }
    if (leave.status === 'reopened') {
      if (!leave.reopenReason || !String(leave.reopenReason).trim()) {
        add('leave.reopen-reason-missing', `Leave ${leave.id} is reopened without a reason.`)
      }
      if (!leave.previousDecision) {
        add(
          'leave.previous-decision-missing',
          `Leave ${leave.id} is reopened but the previous decision was not preserved.`,
        )
      }
      if (!leave.reopenedById) {
        add(
          'leave.reopened-by-missing',
          `Leave ${leave.id} is reopened but no HOD id was recorded.`,
        )
      }
    }
    if (
      leave.decisionDepartmentId &&
      !findById(departments, leave.decisionDepartmentId)
    ) {
      add(
        'leave.decision-department-invalid',
        `Leave ${leave.id} records unknown department ${leave.decisionDepartmentId} for its decision.`,
      )
    }
  })

  // Notifications ----------------------------------------------------------
  const identityExists = (recipient) => {
    if (!recipient || !recipient.id) return false
    if (!ROLE_VALUES.includes(recipient.role)) return false
    if (recipient.role === ROLES.ADMIN) return recipient.id === 'admin-1'
    if (recipient.role === ROLES.HOD) return Boolean(findById(hods, recipient.id))
    if (recipient.role === ROLES.CLASS_TUTOR) return Boolean(findById(tutors, recipient.id))
    if (recipient.role === ROLES.PARENT) return Boolean(findById(parents, recipient.id))
    return false
  }

  notifications.forEach((notification) => {
    if (!Array.isArray(notification.recipients) || notification.recipients.length === 0) {
      add(
        'notification.no-recipients',
        `Notification ${notification.id} has no recipients.`,
      )
      return
    }
    notification.recipients.forEach((recipient) => {
      if (!recipient || !recipient.id) {
        add(
          'notification.role-wide-recipient',
          `Notification ${notification.id} targets the whole ${recipient?.role || 'unknown'} role instead of an identified account.`,
        )
        return
      }
      if (!identityExists(recipient)) {
        add(
          'notification.recipient-invalid',
          `Notification ${notification.id} targets unknown ${recipient.role} account ${recipient.id}.`,
        )
      }
    })
  })

  // Plain-text password guard ---------------------------------------------
  ;['departments', 'hods', 'classes', 'tutors', 'students', 'parents', 'leaves'].forEach(
    (collection) => {
      asArray(db[collection]).forEach((item) => {
        if (Object.prototype.hasOwnProperty.call(item, 'password')) {
          add(
            'security.plaintext-password',
            `Record ${item.id} in ${collection} contains a plaintext password field. Credentials must never be stored with college records.`,
          )
        }
      })
    },
  )

  return { valid: errors.length === 0, errors }
}

export function formatValidationReport(result) {
  if (!result) return 'No validation result.'
  if (result.valid) return 'Demo dataset validation passed.'
  return [
    `Demo dataset validation found ${result.errors.length} issue${result.errors.length === 1 ? '' : 's'}:`,
    ...result.errors.map((error) => `- [${error.code}] ${error.message}`),
  ].join('\n')
}
