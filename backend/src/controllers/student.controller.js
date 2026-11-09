import {
  createStudent as createStudentRecord,
  getStudentById,
  listStudents as listStudentRecords,
  setStudentStatus as setStudentStatusRecord,
  updateStudent as updateStudentRecord,
} from '../services/student.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createStudent = asyncHandler(async (req, res) => {
  const student = await createStudentRecord(req.body)

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    student,
  })
})

export const listStudents = asyncHandler(async (req, res) => {
  const { students, pagination } = await listStudentRecords(
    req.validatedQuery,
    req.user,
  )

  res.status(200).json({
    success: true,
    students,
    pagination,
  })
})

export const getStudent = asyncHandler(async (req, res) => {
  const student = await getStudentById(req.validatedParams.id, req.user)

  res.status(200).json({
    success: true,
    student,
  })
})

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await updateStudentRecord(
    req.validatedParams.id,
    req.body,
  )

  res.status(200).json({
    success: true,
    message: 'Student updated successfully',
    student,
  })
})

export const setStudentStatus = asyncHandler(async (req, res) => {
  const student = await setStudentStatusRecord(
    req.validatedParams.id,
    req.body.status,
  )

  res.status(200).json({
    success: true,
    message: `Student ${student.accountStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
    student,
  })
})
