import {
  createDepartment as createDepartmentRecord,
  getDepartmentById,
  listDepartments as listDepartmentRecords,
  setDepartmentStatus as setDepartmentStatusRecord,
  updateDepartment as updateDepartmentRecord,
} from '../services/department.service.js'
import { getActiveHodForDepartment } from '../services/hod.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await createDepartmentRecord(req.body)

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    department,
  })
})

export const listDepartments = asyncHandler(async (req, res) => {
  const { departments, pagination } = await listDepartmentRecords(
    req.validatedQuery,
  )

  res.status(200).json({
    success: true,
    departments,
    pagination,
  })
})

export const getDepartment = asyncHandler(async (req, res) => {
  const department = await getDepartmentById(req.validatedParams.id)

  res.status(200).json({
    success: true,
    department,
  })
})

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await updateDepartmentRecord(
    req.validatedParams.id,
    req.body,
  )

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    department,
  })
})

export const setDepartmentStatus = asyncHandler(async (req, res) => {
  const department = await setDepartmentStatusRecord(
    req.validatedParams.id,
    req.body.status,
  )

  res.status(200).json({
    success: true,
    message: `Department ${department.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
    department,
  })
})

export const getDepartmentHod = asyncHandler(async (req, res) => {
  const hod = await getActiveHodForDepartment(req.validatedParams.id)

  res.status(200).json({
    success: true,
    hod,
  })
})
