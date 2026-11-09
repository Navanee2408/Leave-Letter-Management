import {
  approveLeaveApplication as approveLeaveApplicationRecord,
  createLeaveApplication as createLeaveApplicationRecord,
  getLeaveApplicationById,
  getLeaveApplicationDocument,
  getLeaveApplicationHistory as getLeaveApplicationHistoryRecord,
  listLeaveApplications as listLeaveApplicationRecords,
  listMyLeaveApplications as listMyLeaveApplicationRecords,
  rejectLeaveApplication as rejectLeaveApplicationRecord,
  reopenLeaveApplication as reopenLeaveApplicationRecord,
} from '../services/leaveApplication.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createLeaveApplication = asyncHandler(async (req, res) => {
  const application = await createLeaveApplicationRecord(
    req.user,
    req.body,
    req.file,
  )

  res.status(201).json({
    success: true,
    message: 'Leave application submitted successfully',
    data: { application },
  })
})

export const listMyLeaveApplications = asyncHandler(async (req, res) => {
  const { applications, pagination } = await listMyLeaveApplicationRecords(
    req.validatedQuery,
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'Leave applications retrieved successfully',
    data: { applications, pagination },
  })
})

export const listLeaveApplications = asyncHandler(async (req, res) => {
  const { applications, pagination } = await listLeaveApplicationRecords(
    req.validatedQuery,
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'Leave applications retrieved successfully',
    data: { applications, pagination },
  })
})

export const getLeaveApplication = asyncHandler(async (req, res) => {
  const application = await getLeaveApplicationById(
    req.validatedParams.id,
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'Leave application retrieved successfully',
    data: { application },
  })
})

export const getLeaveApplicationHistory = asyncHandler(async (req, res) => {
  const { application, history } = await getLeaveApplicationHistoryRecord(
    req.validatedParams.id,
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'Leave application history retrieved successfully',
    data: {
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
      },
      history,
    },
  })
})

export const downloadLeaveApplicationDocument = asyncHandler(
  async (req, res, next) => {
    const { absolutePath, fileName, mimeType } =
      await getLeaveApplicationDocument(req.validatedParams.id, req.user)

    res.setHeader('Cache-Control', 'private, no-store')
    if (mimeType) res.setHeader('Content-Type', mimeType)

    res.download(absolutePath, fileName, (error) => {
      if (error && !res.headersSent) next(error)
    })
  },
)

export const approveLeaveApplication = asyncHandler(async (req, res) => {
  const application = await approveLeaveApplicationRecord(
    req.validatedParams.id,
    req.user,
    req.body ?? {},
  )

  res.status(200).json({
    success: true,
    message: 'Leave application approved successfully',
    data: { application },
  })
})

export const rejectLeaveApplication = asyncHandler(async (req, res) => {
  const application = await rejectLeaveApplicationRecord(
    req.validatedParams.id,
    req.user,
    req.body,
  )

  res.status(200).json({
    success: true,
    message: 'Leave application rejected successfully',
    data: { application },
  })
})

export const reopenLeaveApplication = asyncHandler(async (req, res) => {
  const application = await reopenLeaveApplicationRecord(
    req.validatedParams.id,
    req.user,
    req.body,
  )

  res.status(200).json({
    success: true,
    message: 'Leave application reopened successfully',
    data: { application },
  })
})
