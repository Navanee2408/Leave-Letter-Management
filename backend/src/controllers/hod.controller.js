import {
  createHod as createHodRecord,
  getHodById,
  listHods as listHodRecords,
  setHodStatus as setHodStatusRecord,
  updateHod as updateHodRecord,
} from '../services/hod.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createHod = asyncHandler(async (req, res) => {
  const hod = await createHodRecord(req.body)

  res.status(201).json({
    success: true,
    message: 'HOD account created successfully',
    hod,
  })
})

export const listHods = asyncHandler(async (req, res) => {
  const { hods, pagination } = await listHodRecords(req.validatedQuery)

  res.status(200).json({
    success: true,
    hods,
    pagination,
  })
})

export const getHod = asyncHandler(async (req, res) => {
  const hod = await getHodById(req.validatedParams.id)

  res.status(200).json({
    success: true,
    hod,
  })
})

export const updateHod = asyncHandler(async (req, res) => {
  const hod = await updateHodRecord(req.validatedParams.id, req.body)

  res.status(200).json({
    success: true,
    message: 'HOD account updated successfully',
    hod,
  })
})

export const setHodStatus = asyncHandler(async (req, res) => {
  const hod = await setHodStatusRecord(
    req.validatedParams.id,
    req.body.status,
  )

  res.status(200).json({
    success: true,
    message: `HOD account ${hod.accountStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
    hod,
  })
})
