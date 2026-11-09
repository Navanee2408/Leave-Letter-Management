import {
  ACCOUNT_STATUS,
  LEAVE_HISTORY_ACTIONS,
  LEAVE_STATUS,
  ROLES,
} from '../constants/index.js'
import { Class } from '../models/Class.js'
import { Department } from '../models/Department.js'
import { LeaveApplication } from '../models/LeaveApplication.js'
import { LeaveApplicationHistory } from '../models/LeaveApplicationHistory.js'
import { Notification } from '../models/Notification.js'
import { ParentStudent } from '../models/ParentStudent.js'
import { Student } from '../models/Student.js'
import { AppError } from '../utils/AppError.js'
import {
  duplicateKeyFields,
  isDuplicateKeyError,
} from '../utils/databaseErrors.js'
import { escapeRegExp } from '../utils/escapeRegExp.js'
import {
  removeLeaveDocument,
  resolveLeaveDocumentPath,
  storeLeaveDocument,
} from './documentStorage.service.js'
import {
  notifyParentOfApproval,
  notifyParentOfRejection,
  notifyParentOfReopen,
  notifyTutorOfApproval,
  publishNotificationCreated,
} from './notification.service.js'

const DAY_MS = 24 * 60 * 60 * 1000

const APPLICATION_POPULATE = [
  { path: 'parent', select: 'fullName email phone role accountStatus' },
  {
    path: 'student',
    select: 'fullName registerNumber email phone accountStatus department class',
  },
  { path: 'department', select: 'name code description status' },
  {
    path: 'class',
    select: 'className year section department assignedTutor status',
  },
  { path: 'decidedBy', select: 'fullName email role' },
  { path: 'reopenedBy', select: 'fullName email role' },
]

const TUTOR_APPLICATION_POPULATE = [
  {
    path: 'student',
    select: 'fullName registerNumber email phone accountStatus department class',
  },
  { path: 'department', select: 'name code' },
  {
    path: 'class',
    select: 'className year section department status',
  },
  { path: 'decidedBy', select: 'fullName email role' },
]

function userId(user) {
  return String(user._id ?? user.id)
}

function startOfUtcDay(value) {
  const date = new Date(value)
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

function startOfTodayUtc() {
  return startOfUtcDay(new Date())
}

function entityId(value) {
  return String(value?._id ?? value)
}

async function resolveStudentForParent(parent, studentId) {
  const student = await Student.findById(studentId)

  if (!student) {
    throw new AppError('Student not found', 404)
  }

  const linked = await ParentStudent.exists({
    parent: userId(parent),
    student: student._id,
  })

  if (!linked) {
    throw new AppError(
      'You can only submit leave applications for your linked children',
      403,
    )
  }

  if (student.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError(
      'Cannot submit a leave application for an inactive student',
      400,
    )
  }

  const [department, classDocument] = await Promise.all([
    Department.findById(student.department),
    Class.findById(student.class),
  ])

  if (!department) {
    throw new AppError('Department not found', 404)
  }

  if (department.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError(
      'Cannot submit a leave application for a student in an inactive department',
      400,
    )
  }

  if (!classDocument) {
    throw new AppError('Class not found', 404)
  }

  if (classDocument.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError(
      'Cannot submit a leave application for a student in an inactive class',
      400,
    )
  }

  if (String(classDocument.department) !== String(department._id)) {
    throw new AppError(
      'The student record has an inconsistent department and class',
      400,
    )
  }

  return { student, department, classDocument }
}

async function createApplicationDocument(payload) {
  let lastError

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await LeaveApplication.create(payload)
    } catch (error) {
      lastError = error

      if (
        isDuplicateKeyError(error) &&
        duplicateKeyFields(error).includes('applicationNumber')
      ) {
        continue
      }

      throw error
    }
  }

  throw lastError
}

function assertApplicationAccess(application, user) {
  if (user.role === ROLES.ADMIN) return

  if (
    user.role === ROLES.HOD &&
    user.department &&
    entityId(application.department) === String(user.department)
  ) {
    return
  }

  if (
    user.role === ROLES.PARENT &&
    entityId(application.parent) === userId(user)
  ) {
    return
  }

  throw new AppError(
    'You do not have permission to access this leave application',
    403,
  )
}

async function findApplicationOrThrow(id) {
  const application = await LeaveApplication.findById(id).populate(
    APPLICATION_POPULATE,
  )

  if (!application) {
    throw new AppError('Leave application not found', 404)
  }

  return application
}

export async function createLeaveApplication(parent, data, file) {
  const { student, department, classDocument } = await resolveStudentForParent(
    parent,
    data.studentId,
  )

  const fromDate = startOfUtcDay(data.fromDate)
  const toDate = startOfUtcDay(data.toDate)

  if (fromDate < startOfTodayUtc()) {
    throw new AppError('From date cannot be in the past', 400)
  }

  if (toDate < fromDate) {
    throw new AppError('To date must be on or after from date', 400)
  }

  const totalDays =
    Math.floor((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1

  const supportingDocument = await storeLeaveDocument(file)

  let application

  try {
    // Department and class always come from the stored Student record. Client
    // input cannot override them, and status is always PENDING on creation.
    application = await createApplicationDocument({
      parent: parent._id,
      student: student._id,
      department: department._id,
      class: classDocument._id,
      leaveType: data.leaveType,
      fromDate,
      toDate,
      totalDays,
      reason: data.reason,
      supportingDocument,
      status: LEAVE_STATUS.PENDING,
      submittedAt: new Date(),
    })
  } catch (error) {
    await removeLeaveDocument(supportingDocument?.storedName)
    throw error
  }

  try {
    await LeaveApplicationHistory.create({
      application: application._id,
      actor: parent._id,
      actorName: parent.fullName,
      actorEmail: parent.email,
      actorRole: parent.role,
      action: LEAVE_HISTORY_ACTIONS.SUBMITTED,
      previousStatus: null,
      newStatus: application.status,
      details: {
        applicationNumber: application.applicationNumber,
        status: application.status,
        student: String(student._id),
        leaveType: application.leaveType,
        fromDate: application.fromDate,
        toDate: application.toDate,
        totalDays: application.totalDays,
        supportingDocument: Boolean(supportingDocument),
      },
    })
  } catch (error) {
    await LeaveApplication.deleteOne({ _id: application._id })
    await removeLeaveDocument(supportingDocument?.storedName)
    throw error
  }

  await application.populate(APPLICATION_POPULATE)

  return application
}

export async function listLeaveApplications(query, user) {
  const filter = {}

  if (user.role === ROLES.PARENT) {
    filter.parent = userId(user)
  } else if (user.role === ROLES.HOD) {
    if (!user.department) {
      throw new AppError(
        'You do not have permission to view leave applications',
        403,
      )
    }

    if (
      query.department &&
      String(query.department) !== String(user.department)
    ) {
      throw new AppError(
        'You do not have permission to access leave applications from another department',
        403,
      )
    }

    filter.department = user.department
  } else if (user.role === ROLES.ADMIN) {
    if (query.department) filter.department = query.department
  } else {
    throw new AppError(
      'You do not have permission to view leave applications',
      403,
    )
  }

  if (query.status) filter.status = query.status
  if (query.studentId) filter.student = query.studentId
  if (query.classId) filter.class = query.classId

  if (query.fromDate || query.toDate) {
    filter.$and = []

    // Match applications whose leave period overlaps the requested range.
    if (query.fromDate) {
      filter.$and.push({ toDate: { $gte: startOfUtcDay(query.fromDate) } })
    }

    if (query.toDate) {
      filter.$and.push({ fromDate: { $lte: startOfUtcDay(query.toDate) } })
    }
  }

  if (query.search) {
    const pattern = new RegExp(escapeRegExp(query.search), 'i')
    filter.$or = [{ applicationNumber: pattern }, { reason: pattern }]
  }

  const [applications, total] = await Promise.all([
    LeaveApplication.find(filter)
      .populate(APPLICATION_POPULATE)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    LeaveApplication.countDocuments(filter),
  ])

  return {
    applications,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}

export async function listMyLeaveApplications(query, user) {
  if (user.role !== ROLES.PARENT) {
    throw new AppError(
      'Only parent accounts can view their leave applications',
      403,
    )
  }

  return listLeaveApplications(query, user)
}

export async function getLeaveApplicationById(id, user) {
  const application = await findApplicationOrThrow(id)
  assertApplicationAccess(application, user)
  return application
}

export async function getLeaveApplicationHistory(id, user) {
  const application = await findApplicationOrThrow(id)
  assertApplicationAccess(application, user)

  const history = await LeaveApplicationHistory.find({
    application: application._id,
  })
    .populate('actor', 'fullName email role accountStatus')
    .sort({ createdAt: 1, _id: 1 })

  return { application, history }
}

export async function getLeaveApplicationDocument(id, user) {
  const application = await LeaveApplication.findById(id).select(
    '+supportingDocument.storedName',
  )

  if (!application) {
    throw new AppError('Leave application not found', 404)
  }

  assertApplicationAccess(application, user)

  if (!application.supportingDocument?.storedName) {
    throw new AppError('Supporting document not found', 404)
  }

  const absolutePath = await resolveLeaveDocumentPath(
    application.supportingDocument.storedName,
  )

  return {
    absolutePath,
    fileName:
      application.supportingDocument.fileName || 'supporting-document',
    mimeType: application.supportingDocument.mimeType,
  }
}

function assertHodDecisionAccess(application, user) {
  if (user.role !== ROLES.HOD) {
    throw new AppError('Only HOD accounts can decide leave applications', 403)
  }

  if (
    !user.department ||
    entityId(application.department) !== String(user.department)
  ) {
    throw new AppError(
      'You do not have permission to decide leave applications from another department',
      403,
    )
  }
}

function decisionState(application) {
  return {
    status: application.status,
    decidedBy: application.decidedBy?._id ?? application.decidedBy ?? null,
    decidedAt: application.decidedAt ?? null,
    decisionComment: application.decisionComment ?? null,
    rejectionReason: application.rejectionReason ?? null,
    reopenedBy: application.reopenedBy?._id ?? application.reopenedBy ?? null,
    reopenedAt: application.reopenedAt ?? null,
    reopenReason: application.reopenReason ?? null,
  }
}

/**
 * Perform one status transition atomically, then append history and notify.
 * The status filter makes concurrent requests race safely: exactly one wins,
 * and every other request receives a 409 without creating extra history.
 */
async function commitStatusTransition({
  application,
  user,
  action,
  newStatus,
  expectedStatuses,
  reason = null,
  setFields = {},
  details = {},
  notify,
}) {
  const previous = decisionState(application)

  const updated = await LeaveApplication.findOneAndUpdate(
    { _id: application._id, status: { $in: expectedStatuses } },
    { $set: { status: newStatus, ...setFields } },
    { returnDocument: 'after', runValidators: true },
  )

  if (!updated) {
    throw new AppError(
      'This leave application has already been decided or is not in a valid state',
      409,
    )
  }

  let historyRecord
  const createdNotifications = []

  try {
    historyRecord = await LeaveApplicationHistory.create({
      application: updated._id,
      actor: user._id ?? user.id,
      actorName: user.fullName,
      actorEmail: user.email,
      actorRole: user.role,
      action,
      previousStatus: previous.status,
      newStatus,
      reason,
      details: {
        applicationNumber: updated.applicationNumber,
        student: entityId(updated.student),
        ...details,
      },
    })

    if (notify) await notify(updated, createdNotifications)
  } catch (error) {
    // Standalone MongoDB deployments cannot use multi-document transactions.
    // If history or notification creation fails, roll the decision back so the
    // application never claims a transition that has no audit record.
    if (historyRecord) {
      await LeaveApplicationHistory.deleteOne({ _id: historyRecord._id })
    }

    // Remove any notifications persisted before a later step failed. A
    // rolled-back decision must not leave inbox entries behind.
    if (createdNotifications.length > 0) {
      await Notification.deleteMany({
        _id: { $in: createdNotifications.map((item) => item._id) },
      })
    }

    await LeaveApplication.updateOne(
      { _id: updated._id, status: newStatus },
      { $set: previous },
    )

    throw error
  }

  // Publish only after the transition, history, and notifications have all
  // committed successfully. Real-time delivery is best effort and must never
  // roll back a committed database operation.
  for (const notification of createdNotifications) {
    try {
      await publishNotificationCreated(notification)
    } catch {
      // Ignore real-time delivery failures; the REST inbox still works.
    }
  }

  return LeaveApplication.findById(updated._id).populate(APPLICATION_POPULATE)
}

export async function approveLeaveApplication(id, user, data = {}) {
  const application = await findApplicationOrThrow(id)
  assertHodDecisionAccess(application, user)

  if (application.status !== LEAVE_STATUS.PENDING) {
    throw new AppError('Only pending leave applications can be approved', 409)
  }

  const comment = data.comment?.trim() ? data.comment.trim() : null
  const decidedAt = new Date()

  return commitStatusTransition({
    application,
    user,
    action: LEAVE_HISTORY_ACTIONS.APPROVED,
    newStatus: LEAVE_STATUS.APPROVED,
    expectedStatuses: [LEAVE_STATUS.PENDING],
    reason: comment,
    setFields: {
      decidedBy: user._id ?? user.id,
      decidedAt,
      decisionComment: comment,
      rejectionReason: null,
    },
    details: { comment, decidedAt },
    notify: async (updated, createdNotifications) => {
      createdNotifications.push(
        await notifyParentOfApproval(updated, { emit: false }),
      )

      const tutorNotification = await notifyTutorOfApproval(updated, {
        emit: false,
      })

      if (tutorNotification) createdNotifications.push(tutorNotification)
    },
  })
}

export async function rejectLeaveApplication(id, user, data) {
  const application = await findApplicationOrThrow(id)
  assertHodDecisionAccess(application, user)

  if (application.status !== LEAVE_STATUS.PENDING) {
    throw new AppError('Only pending leave applications can be rejected', 409)
  }

  const reason = data.reason.trim()
  const decidedAt = new Date()

  return commitStatusTransition({
    application,
    user,
    action: LEAVE_HISTORY_ACTIONS.REJECTED,
    newStatus: LEAVE_STATUS.REJECTED,
    expectedStatuses: [LEAVE_STATUS.PENDING],
    reason,
    setFields: {
      decidedBy: user._id ?? user.id,
      decidedAt,
      decisionComment: null,
      rejectionReason: reason,
    },
    details: { reason, decidedAt },
    notify: async (updated, createdNotifications) => {
      createdNotifications.push(
        await notifyParentOfRejection(updated, { emit: false }),
      )
    },
  })
}

export async function reopenLeaveApplication(id, user, data) {
  const application = await findApplicationOrThrow(id)
  assertHodDecisionAccess(application, user)

  if (
    ![LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED].includes(
      application.status,
    )
  ) {
    throw new AppError(
      'Only approved or rejected leave applications can be reopened',
      409,
    )
  }

  const reason = data.reason.trim()
  const reopenedAt = new Date()

  return commitStatusTransition({
    application,
    user,
    action: LEAVE_HISTORY_ACTIONS.REOPENED,
    newStatus: LEAVE_STATUS.PENDING,
    expectedStatuses: [LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED],
    reason,
    setFields: {
      reopenedBy: user._id ?? user.id,
      reopenedAt,
      reopenReason: reason,
    },
    details: { reason, reopenedAt },
    // Reopening notifies the parent only. The tutor is notified again only
    // after a new approval.
    notify: async (updated, createdNotifications) => {
      createdNotifications.push(
        await notifyParentOfReopen(updated, { emit: false }),
      )
    },
  })
}

export async function listTutorApprovedLeaves(query, user) {
  if (user.role !== ROLES.TUTOR) {
    throw new AppError(
      'Only tutor accounts can view approved class leaves',
      403,
    )
  }

  const classIds = await Class.find({
    assignedTutor: userId(user),
    status: ACCOUNT_STATUS.ACTIVE,
  }).distinct('_id')

  const emptyPagination = {
    page: query.page,
    limit: query.limit,
    total: 0,
    totalPages: 0,
  }

  if (classIds.length === 0) {
    return { applications: [], pagination: emptyPagination }
  }

  const filter = {
    status: LEAVE_STATUS.APPROVED,
    class: { $in: classIds },
  }

  const [applications, total] = await Promise.all([
    LeaveApplication.find(filter)
      .populate(TUTOR_APPLICATION_POPULATE)
      .sort({ fromDate: 1, submittedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    LeaveApplication.countDocuments(filter),
  ])

  return {
    applications,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  }
}
