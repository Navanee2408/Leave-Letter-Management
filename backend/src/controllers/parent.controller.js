import {
  addChild as addChildRecord,
  createParent as createParentRecord,
  getParentById,
  listChildren as listChildRecords,
  listMyChildren as listMyChildRecords,
  listParents as listParentRecords,
  removeChild as removeChildRecord,
  setParentStatus as setParentStatusRecord,
  updateParent as updateParentRecord,
} from '../services/parent.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createParent = asyncHandler(async (req, res) => {
  const parent = await createParentRecord(req.body)

  res.status(201).json({
    success: true,
    message: 'Parent account created successfully',
    parent,
  })
})

export const listParents = asyncHandler(async (req, res) => {
  const { parents, pagination } = await listParentRecords(
    req.validatedQuery,
  )

  res.status(200).json({
    success: true,
    parents,
    pagination,
  })
})

export const getParent = asyncHandler(async (req, res) => {
  const parent = await getParentById(req.validatedParams.id)

  res.status(200).json({
    success: true,
    parent,
  })
})

export const updateParent = asyncHandler(async (req, res) => {
  const parent = await updateParentRecord(
    req.validatedParams.id,
    req.body,
  )

  res.status(200).json({
    success: true,
    message: 'Parent account updated successfully',
    parent,
  })
})

export const setParentStatus = asyncHandler(async (req, res) => {
  const parent = await setParentStatusRecord(
    req.validatedParams.id,
    req.body.status,
  )

  res.status(200).json({
    success: true,
    message: `Parent account ${parent.accountStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
    parent,
  })
})

export const addChild = asyncHandler(async (req, res) => {
  const child = await addChildRecord(req.validatedParams.parentId, req.body)

  res.status(201).json({
    success: true,
    message: 'Student linked to parent successfully',
    child,
  })
})

export const listChildren = asyncHandler(async (req, res) => {
  const { children, pagination } = await listChildRecords(
    req.validatedParams.parentId,
    req.validatedQuery,
  )

  res.status(200).json({
    success: true,
    children,
    pagination,
  })
})

export const listMyChildren = asyncHandler(async (req, res) => {
  const { children, pagination } = await listMyChildRecords(
    req.user,
    req.validatedQuery,
  )

  res.status(200).json({
    success: true,
    children,
    pagination,
  })
})

export const removeChild = asyncHandler(async (req, res) => {
  await removeChildRecord(
    req.validatedParams.parentId,
    req.validatedParams.studentId,
  )

  res.status(200).json({
    success: true,
    message: 'Parent-student link removed successfully',
  })
})
