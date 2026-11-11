import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROLE_HOME, ROLE_LOGIN } from '../../constants'
import { useAuth } from '../../hooks/useAuth'

function InactiveSessionRedirect({ to }) {
  const { logout } = useAuth()
  useEffect(() => {
    logout()
  }, [logout])
  return <Navigate to={to} replace state={{ inactive: true }} />
}

export default function ProtectedRoute({ role }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={ROLE_LOGIN[role] || '/login'}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  const isInactive =
    user.status === 'inactive' ||
    user.accountStatus === 'INACTIVE' ||
    user.accountStatus === 'SUSPENDED'

  if (isInactive) {
    return <InactiveSessionRedirect to={ROLE_LOGIN[user.role] || '/login'} />
  }

  if (user.mustChangePassword) {
    return (
      <Navigate
        to="/change-password"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (role && user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  }

  return <Outlet />
}

export function PasswordChangeRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  const isInactive =
    user.status === 'inactive' ||
    user.accountStatus === 'INACTIVE' ||
    user.accountStatus === 'SUSPENDED'

  if (isInactive) {
    return <InactiveSessionRedirect to={ROLE_LOGIN[user.role] || '/login'} />
  }

  if (!user.mustChangePassword) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  }

  return <Outlet />
}
