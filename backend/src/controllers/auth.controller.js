import {
  changeUserPassword,
  loginUser,
  logoutUser,
  refreshSession,
} from '../services/auth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from '../utils/cookies.js'

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body)

  setRefreshCookie(res, refreshToken)

  res.status(200).json({
    success: true,
    message: 'Login successful',
    accessToken,
    user,
  })
})

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME]

  try {
    const result = await refreshSession(token)

    setRefreshCookie(res, result.refreshToken)

    res.status(200).json({
      success: true,
      message: 'Session refreshed',
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (error) {
    clearRefreshCookie(res)
    throw error
  }
})

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME]

  await logoutUser(token)
  clearRefreshCookie(res)

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  })
})

export const changePassword = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await changeUserPassword(
    req.user._id,
    req.body,
  )

  setRefreshCookie(res, refreshToken)

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    accessToken,
    user,
  })
})
