import { daysBetween, monthShort, todayISO } from '../lib/date.js'
import { MONTHS_SHORT } from '../lib/date.js'

const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }

export function departmentById(db, id) {
  return db.departments.find((department) => department.id === id) || null
}

export function classById(db, id) {
  return db.classes.find((classItem) => classItem.id === id) || null
}

export function studentById(db, id) {
  return db.students.find((student) => student.id === id) || null
}

export function parentById(db, id) {
  return (db.parents || []).find((parent) => parent.id === id) || null
}

export function tutorById(db, id) {
  return db.tutors.find((tutor) => tutor.id === id) || null
}

export function hodById(db, id) {
  return (db.hods || []).find((hod) => hod.id === id) || null
}

export function departmentCode(db, departmentId) {
  return departmentById(db, departmentId)?.code || '—'
}

export function yearLabel(year) {
  return `${ROMAN[year] || year} Year`
}

export function classLabel(db, classItem) {
  if (!classItem) return '—'
  const department = departmentById(db, classItem.departmentId)
  return `${department?.code || 'Class'} · ${yearLabel(classItem.year)} · Sec ${classItem.section}`
}

export function classTitle(db, classItem) {
  if (!classItem) return 'Unassigned class'
  const department = departmentById(db, classItem.departmentId)
  return `${department?.code || 'Class'} — ${yearLabel(classItem.year)}, Section ${classItem.section}`
}

export function studentCountForClass(db, classId) {
  return db.students.filter((student) => student.classId === classId).length
}

export function getStudentProfile(db, student) {
  if (!student) return null
  const department = departmentById(db, student.departmentId)
  const classItem = classById(db, student.classId)
  const parent = parentById(db, student.parentId)
  const tutor = classItem ? tutorById(db, classItem.tutorId) : null
  return {
    ...student,
    department,
    classItem,
    parent,
    tutor,
    className: classLabel(db, classItem),
  }
}

export function getLeaveWithRelations(db, leave) {
  if (!leave) return null
  const student = studentById(db, leave.studentId)
  const profile = getStudentProfile(db, student)
  const parent = parentById(db, leave.parentId) || profile?.parent
  const decidedByHod = hodById(db, leave.decidedById)
  const reopenedByHod = hodById(db, leave.reopenedById)
  return {
    ...leave,
    student: profile,
    studentName: student?.name || 'Unknown student',
    registerNumber: student?.registerNumber || '—',
    department: profile?.department,
    classItem: profile?.classItem,
    className: profile?.className || '—',
    tutor: profile?.tutor,
    parent,
    decidedByHod,
    reopenedByHod,
    duration: daysBetween(leave.fromDate, leave.toDate),
  }
}

export function childrenForParent(db, parentId) {
  const parent = parentById(db, parentId)
  const ids = new Set(parent?.childIds || [])
  return db.students
    .filter(
      (student) => ids.has(student.id) || student.parentId === parentId,
    )
    .map((student) => getStudentProfile(db, student))
}

export function tutorClasses(db, tutorId) {
  return db.classes
    .filter((classItem) => classItem.tutorId === tutorId)
    .map((classItem) => ({
      ...classItem,
      department: departmentById(db, classItem.departmentId),
      studentCount: studentCountForClass(db, classItem.id),
      label: classLabel(db, classItem),
      title: classTitle(db, classItem),
    }))
}

export function tutorClassIds(db, tutorId) {
  return tutorClasses(db, tutorId).map((classItem) => classItem.id)
}

export function tutorStudents(db, tutorId) {
  const classIds = new Set(tutorClassIds(db, tutorId))
  return db.students
    .filter((student) => classIds.has(student.classId))
    .map((student) => getStudentProfile(db, student))
}

export function tutorLeaves(db, tutorId) {
  const classIds = new Set(tutorClassIds(db, tutorId))
  return db.leaves
    .filter((leave) => {
      const student = studentById(db, leave.studentId)
      return student && classIds.has(student.classId)
    })
    .map((leave) => getLeaveWithRelations(db, leave))
}

export function tutorApprovedLeaves(db, tutorId) {
  return tutorLeaves(db, tutorId)
    .filter((leave) => leave.status === 'approved')
    .sort((a, b) => new Date(b.decisionAt || b.submittedAt) - new Date(a.decisionAt || a.submittedAt))
}

export function upcomingApprovedLeaves(db, leaves, days = 30) {
  const today = todayISO()
  const limit = new Date()
  limit.setDate(limit.getDate() + days)
  return leaves.filter((leave) => {
    if (leave.status !== 'approved') return false
    return leave.toDate >= today && leave.fromDate <= limit.toISOString().slice(0, 10)
  })
}

export function leavesForParent(db, parentId) {
  return db.leaves
    .filter((leave) => leave.parentId === parentId)
    .map((leave) => getLeaveWithRelations(db, leave))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

export function allLeaves(db) {
  return db.leaves
    .map((leave) => getLeaveWithRelations(db, leave))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

export function filterAdminLeaves(db, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase()
  return allLeaves(db).filter((leave) => {
    if (filters.departmentId && leave.department?.id !== filters.departmentId) {
      return false
    }
    if (filters.status && leave.status !== filters.status) return false
    if (filters.fromDate && leave.toDate < filters.fromDate) return false
    if (filters.toDate && leave.fromDate > filters.toDate) return false
    if (!query) return true
    return [
      leave.id,
      leave.studentName,
      leave.registerNumber,
      leave.className,
      leave.department?.code,
      leave.parent?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
}

/**
 * Department resolution helpers.
 *
 * Leave follows student → class → department. An HOD may only see and decide
 * applications that resolve to their own department.
 */
export function departmentForStudent(db, student) {
  if (!student) return null
  const classItem = classById(db, student.classId)
  return departmentById(db, classItem?.departmentId || student.departmentId)
}

export function departmentForHod(db, hodId) {
  const hod = hodById(db, hodId)
  if (!hod) return null
  return departmentById(db, hod.departmentId)
}

export function studentIdsForDepartment(db, departmentId) {
  const classIds = new Set(
    db.classes
      .filter((classItem) => classItem.departmentId === departmentId)
      .map((classItem) => classItem.id),
  )
  return new Set(
    db.students
      .filter(
        (student) =>
          classIds.has(student.classId) || student.departmentId === departmentId,
      )
      .map((student) => student.id),
  )
}

export function leavesForDepartment(db, departmentId) {
  const studentIds = studentIdsForDepartment(db, departmentId)
  return allLeaves(db).filter((leave) => studentIds.has(leave.studentId))
}

export function leavesForHod(db, hodId) {
  const department = departmentForHod(db, hodId)
  if (!department) return []
  return leavesForDepartment(db, department.id)
}

export function pendingReviewLeaves(db, departmentId = null) {
  const source = departmentId ? leavesForDepartment(db, departmentId) : allLeaves(db)
  return source
    .filter((leave) => leave.status === 'pending' || leave.status === 'reopened')
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
}

export function decideLeaves(db, departmentId = null) {
  const source = departmentId ? leavesForDepartment(db, departmentId) : allLeaves(db)
  return source
    .filter((leave) =>
      ['approved', 'rejected', 'reopened'].includes(leave.status),
    )
    .sort((a, b) => {
      const aTime = a.reopenedAt || a.decisionAt || a.submittedAt
      const bTime = b.reopenedAt || b.decisionAt || b.submittedAt
      return new Date(bTime) - new Date(aTime)
    })
}

export function hodStats(db, hodId) {
  const department = departmentForHod(db, hodId)
  const departmentId = department?.id || null
  const leaves = departmentId ? leavesForDepartment(db, departmentId) : []
  const studentIds = departmentId
    ? studentIdsForDepartment(db, departmentId)
    : new Set()
  const classes = departmentId
    ? db.classes.filter((classItem) => classItem.departmentId === departmentId)
    : []
  const tutors = departmentId
    ? db.tutors.filter((tutor) => tutor.departmentId === departmentId)
    : []
  const parentIds = new Set(
    db.students
      .filter((student) => studentIds.has(student.id))
      .map((student) => student.parentId)
      .filter(Boolean),
  )
  const pending = leaves.filter((leave) => leave.status === 'pending').length
  const reopened = leaves.filter((leave) => leave.status === 'reopened').length
  return {
    department,
    departmentName: department?.name || 'No department assigned',
    departmentCode: department?.code || '—',
    hodName: hodById(db, hodId)?.name || 'Head of Department',
    students: studentIds.size,
    classes: classes.length,
    tutors: tutors.length,
    parents: parentIds.size,
    total: leaves.length,
    pending,
    reopened,
    pendingWithReopened: pending + reopened,
    approved: leaves.filter((leave) => leave.status === 'approved').length,
    rejected: leaves.filter((leave) => leave.status === 'rejected').length,
  }
}

export function adminStats(db) {
  return {
    departments: db.departments.length,
    hods: (db.hods || []).length,
    classes: db.classes.length,
    students: db.students.length,
    tutors: db.tutors.length,
    parents: db.parents.length,
    totalLeaves: db.leaves.length,
    pending: db.leaves.filter((leave) => leave.status === 'pending').length,
    reopened: db.leaves.filter((leave) => leave.status === 'reopened').length,
    approved: db.leaves.filter((leave) => leave.status === 'approved').length,
    rejected: db.leaves.filter((leave) => leave.status === 'rejected').length,
  }
}

export function monthlyLeaveSeries(db, year = new Date().getFullYear(), departmentId = null) {
  const source = departmentId ? leavesForDepartment(db, departmentId) : db.leaves
  return MONTHS_SHORT.map((month, index) => {
    const leaves = source.filter((leave) => {
      const date = new Date(leave.submittedAt)
      return date.getFullYear() === year && date.getMonth() === index
    })
    return {
      month,
      requests: leaves.length,
      approved: leaves.filter((leave) => leave.status === 'approved').length,
      pending: leaves.filter((leave) =>
        leave.status === 'pending',
      ).length,
      reopened: leaves.filter((leave) => leave.status === 'reopened').length,
      rejected: leaves.filter((leave) => leave.status === 'rejected').length,
    }
  })
}

export function departmentLeaveStats(db) {
  return db.departments.map((department) => {
    const studentIds = studentIdsForDepartment(db, department.id)
    const leaves = db.leaves.filter((leave) => studentIds.has(leave.studentId))
    return {
      id: department.id,
      code: department.code,
      name: department.name,
      longName: department.name,
      hodName: department.hodName,
      total: leaves.length,
      approved: leaves.filter((leave) => leave.status === 'approved').length,
      pending: leaves.filter((leave) => leave.status === 'pending').length,
      reopened: leaves.filter((leave) => leave.status === 'reopened').length,
      rejected: leaves.filter((leave) => leave.status === 'rejected').length,
      students: studentIds.size,
    }
  })
}

export function statusDistribution(db, departmentId = null) {
  const source = departmentId ? leavesForDepartment(db, departmentId) : db.leaves
  const statuses = ['pending', 'approved', 'rejected', 'reopened']
  return statuses.map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    key: status,
    value: source.filter((leave) => leave.status === status).length,
  }))
}

export function parentStats(db, parentId) {
  const leaves = leavesForParent(db, parentId)
  return {
    total: leaves.length,
    pending: leaves.filter((leave) => leave.status === 'pending').length,
    approved: leaves.filter((leave) => leave.status === 'approved').length,
    rejected: leaves.filter((leave) => leave.status === 'rejected').length,
    reopened: leaves.filter((leave) => leave.status === 'reopened').length,
  }
}

export function tutorStats(db, tutorId) {
  const classes = tutorClasses(db, tutorId)
  const students = tutorStudents(db, tutorId)
  const approved = tutorApprovedLeaves(db, tutorId)
  const upcoming = upcomingApprovedLeaves(db, approved, 30)
  return {
    classes: classes.length,
    students: students.length,
    approved: approved.length,
    upcoming: upcoming.length,
  }
}

export function notificationForLeave(db, leave, user) {
  return db.notifications.filter(
    (notification) =>
      notification.applicationId === leave.id &&
      notification.recipients.some(
        (recipient) =>
          recipient.role === user.role && recipient.id === user.id,
      ),
  )
}

export function currentMonthLabel() {
  return `${monthShort(new Date().getMonth())} ${new Date().getFullYear()}`
}
