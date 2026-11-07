import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROLE_HOME, ROLE_LOGIN } from '../../constants'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { isDemoAccountActive } from '../../data/demoAuth'

function InactiveSessionRedirect({ to }) {
  const { logout } = useAuth()
  useEffect(() => logout(), [logout])
  return <Navigate to={to} replace state={{ inactive: true }} />
}

/**
 * Guards every role workspace. Access is simulated in the browser, so this only
 * keeps the demo session tidy — it is not a security boundary. A real backend
 * must enforce the same role and department checks on every request.
 */
export default function ProtectedRoute({ role }) {
  const { user } = useAuth()
  const { db } = useData()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to={ROLE_LOGIN[role] || '/login'}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  }

  if (!isDemoAccountActive(db, user)) {
    return <InactiveSessionRedirect to={ROLE_LOGIN[user.role] || '/login'} />
  }

  return <Outlet />
}
