import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import {
  unreadNotificationCount,
} from '../../services/demoStore'
import { pendingReviewLeaves, tutorStats, departmentForHod } from '../../services/selectors'
import { ROLES } from '../../constants'
import { cn } from '../../lib/utils'

export default function DashboardLayout({ role }) {
  const { user } = useAuth()
  const { db } = useData()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const counts = useMemo(() => {
    const notificationCount = unreadNotificationCount(db, user)
    if (role === ROLES.HOD) {
      const department = departmentForHod(db, user?.id)
      return {
        pending: department ? pendingReviewLeaves(db, department.id).length : 0,
        notifications: notificationCount,
      }
    }
    if (role === ROLES.ADMIN) {
      return {
        pending: db.leaves.filter((leave) =>
          ['pending', 'reopened'].includes(leave.status),
        ).length,
        notifications: notificationCount,
      }
    }
    if (role === ROLES.CLASS_TUTOR) {
      return {
        upcoming: tutorStats(db, user?.id).upcoming,
        notifications: notificationCount,
      }
    }
    return { notifications: notificationCount }
  }, [db, user, role])

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
        counts={counts}
      />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-[78px]' : 'lg:pl-[262px]',
        )}
      >
        <Navbar role={role} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
        <footer className="mt-2 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 text-[10.5px] text-slate-400 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} College Leave Management System · Frontend demonstration
            </p>
            <p className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              Simulated session · Not an official TCE service
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
