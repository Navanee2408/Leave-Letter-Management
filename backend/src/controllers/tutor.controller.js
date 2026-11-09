import {
  createTutor as createTutorRecord,
  getTutorById,
  getTutorClasses,
  getTutorStudents,
  listTutors as listTutorRecords,
  setTutorStatus as setTutorStatusRecord,
  updateTutor as updateTutorRecord,
} from '../services/tutor.service.js'
import { listTutorApprovedLeaves } from '../services/leaveApplication.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createTutor = asyncHandler(async (req, res) => {
  const tutor = await createTutorRecord(req.body)

  res.status(201).json({
    success: true,
    message: 'Tutor account created successfully',
    tutor,
  })
})

export const listTutors = asyncHandler(async (req, res) => {
  const { tutors, pagination } = await listTutorRecords(
    req.validatedQuery,
    req.user,
  )

  res.status(200).json({
    success: true,
    tutors,
    pagination,
  })
})

export const getTutor = asyncHandler(async (req, res) => {
  const tutor = await getTutorById(req.validatedParams.id, req.user)

  res.status(200).json({
    success: true,
    tutor,
  })
})

export const updateTutor = asyncHandler(async (req, res) => {
  const tutor = await updateTutorRecord(req.validatedParams.id, req.body)

  res.status(200).json({
    success: true,
    message: 'Tutor account updated successfully',
    tutor,
  })
})

export const setTutorStatus = asyncHandler(async (req, res) => {
  const tutor = await setTutorStatusRecord(
    req.validatedParams.id,
    req.body.status,
  )

  res.status(200).json({
    success: true,
    message: `Tutor account ${tutor.accountStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
    tutor,
  })
})

export const getMyClasses = asyncHandler(async (req, res) => {
  const classes = await getTutorClasses(req.user)

  res.status(200).json({
    success: true,
    classes,
  })
})

export const getMyStudents = asyncHandler(async (req, res) => {
  const students = await getTutorStudents(req.user)

  res.status(200).json({
    success: true,
    students,
  })
})

export const getMyApprovedLeaves = asyncHandler(async (req, res) => {
  const { applications, pagination } = await listTutorApprovedLeaves(
    req.validatedQuery,
    req.user,
  )

  res.status(200).json({
    success: true,
    message: 'Approved leave applications retrieved successfully',
    data: { applications, pagination },
  })
})
