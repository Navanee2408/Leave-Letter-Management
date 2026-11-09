import {
  createClass as createClassRecord,
  getClassById,
  listClasses as listClassRecords,
  setClassStatus as setClassStatusRecord,
  updateClass as updateClassRecord,
} from '../services/class.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createClass = asyncHandler(async (req, res) => {
  const classDocument = await createClassRecord(req.body)

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    class: classDocument,
  })
})

export const listClasses = asyncHandler(async (req, res) => {
  const { classes, pagination } = await listClassRecords(
    req.validatedQuery,
    req.user,
  )

  res.status(200).json({
    success: true,
    classes,
    pagination,
  })
})

export const getClass = asyncHandler(async (req, res) => {
  const classDocument = await getClassById(
    req.validatedParams.id,
    req.user,
  )

  res.status(200).json({
    success: true,
    class: classDocument,
  })
})

export const updateClass = asyncHandler(async (req, res) => {
  const classDocument = await updateClassRecord(
    req.validatedParams.id,
    req.body,
  )

  res.status(200).json({
    success: true,
    message: 'Class updated successfully',
    class: classDocument,
  })
})

export const setClassStatus = asyncHandler(async (req, res) => {
  const classDocument = await setClassStatusRecord(
    req.validatedParams.id,
    req.body.status,
  )

  res.status(200).json({
    success: true,
    message: `Class ${classDocument.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
    class: classDocument,
  })
})
