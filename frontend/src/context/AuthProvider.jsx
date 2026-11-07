import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AUTH_STORAGE_KEY,
  LEGACY_AUTH_STORAGE_KEY,
  ROLE_VALUES,
  ROLES,
} from '../constants'
import { AuthContext } from './authContextObject'

function readSession() {
  try {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    sessionStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    const raw =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const valid =
      parsed &&
      parsed.id &&
      ROLE_VALUES.includes(parsed.role) &&
      (parsed.role !== ROLES.HOD || Boolean(parsed.departmentId))
    if (!valid) {
      // Discard sessions created before the four-role migration (for example
      // the old lowercase 'hod' / 'tutor' / 'parent' role values).
      localStorage.removeItem(AUTH_STORAGE_KEY)
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function sessionStorageTarget(remember) {
  return remember ? localStorage : sessionStorage
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

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
      // Session persistence is a demo convenience only.
    }
  }, [])

  const login = useCallback(
    (nextUser, remember = true) => {
      setUser(nextUser)
      persist(nextUser, remember)
    },
    [persist],
  )

  const logout = useCallback(() => {
    setUser(null)
    persist(null)
  }, [persist])

  const updateProfile = useCallback(
    (patch) => {
      setUser((current) => {
        if (!current) return current
        const next = { ...current, ...patch }
        const remember = Boolean(localStorage.getItem(AUTH_STORAGE_KEY))
        persist(next, remember)
        return next
      })
    },
    [persist],
  )

  useEffect(() => {
    const sync = (event) => {
      if (event.key === AUTH_STORAGE_KEY) setUser(readSession())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateProfile,
    }),
    [user, login, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
