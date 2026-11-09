import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AUTH_STORAGE_KEY,
  LEGACY_AUTH_STORAGE_KEY,
  ROLE_VALUES,
  ROLES,
} from '../constants'
import { AuthContext } from './authContextObject'
import { authApi } from '../services/api/authApi'
import {
  getAccessToken,
  setAccessToken,
  onAuthFailure,
} from '../services/api/client'
import { connectSocket, disconnectSocket } from '../services/api/socketClient'

import { normalizeUser } from './userUtils.js'

function readSession() {
  try {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    sessionStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    const raw =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const normalized = normalizeUser(parsed)
    const valid =
      normalized &&
      normalized.id &&
      (ROLE_VALUES.includes(normalized.role) || normalized.role === 'TUTOR')
    if (!valid) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return normalized
  } catch {
    return null
  }
}

function sessionStorageTarget(remember) {
  return remember ? localStorage : sessionStorage
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)
  const [isLoading, setIsLoading] = useState(true)

  const persist = useCallback((nextUser, remember = true) => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      if (nextUser) {
        sessionStorageTarget(remember).setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(nextUser),
        )
      }
    } catch {
      // Session storage convenience
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await authApi.logout()
      }
    } catch {
      // Logout even if request fails
    } finally {
      disconnectSocket()
      setAccessToken(null)
      setUser(null)
      persist(null)
    }
  }, [persist])

  const login = useCallback(
    (nextUser, remember = true, token = null) => {
      const normalized = normalizeUser(nextUser)
      setUser(normalized)
      persist(normalized, remember)
      if (token) {
        setAccessToken(token)
        connectSocket(token)
      }
    },
    [persist],
  )

  const loginWithCredentials = useCallback(
    async ({ email, password, remember = true }) => {
      const result = await authApi.login({ email, password })
      const normalized = normalizeUser({
        ...result.user,
        isBackend: true,
      })
      setUser(normalized)
      persist(normalized, remember)
      if (result.accessToken) {
        setAccessToken(result.accessToken)
        connectSocket(result.accessToken)
      }
      return { user: normalized, accessToken: result.accessToken }
    },
    [persist],
  )

  const updateProfile = useCallback(
    (patch) => {
      setUser((current) => {
        if (!current) return current
        const next = normalizeUser({ ...current, ...patch })
        const remember = Boolean(localStorage.getItem(AUTH_STORAGE_KEY))
        persist(next, remember)
        return next
      })
    },
    [persist],
  )

  // Initial session restoration: attempt silent refresh to restore token and user from backend cookie
  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        const result = await authApi.refresh()
        if (mounted && result?.user && result?.accessToken) {
          const normalized = normalizeUser({
            ...result.user,
            isBackend: true,
          })
          setUser(normalized)
          const remember = Boolean(localStorage.getItem(AUTH_STORAGE_KEY))
          persist(normalized, remember)
          connectSocket(result.accessToken)
        }
      } catch {
        // Backend session not active; preserve local demo session if valid
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initSession()

    return () => {
      mounted = false
    }
  }, [persist])

  // Sync session across browser tabs
  useEffect(() => {
    const sync = (event) => {
      if (event.key === AUTH_STORAGE_KEY) {
        setUser(readSession())
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  // Listen for unrecoverable 401s during API calls
  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      logout()
    })
    return unsubscribe
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      loginWithCredentials,
      logout,
      updateProfile,
    }),
    [user, isLoading, login, loginWithCredentials, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
