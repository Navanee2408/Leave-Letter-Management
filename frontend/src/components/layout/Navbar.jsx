import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PAGE_TITLES } from '../../constants/navigation'
import { ROLE_LABELS, ROLE_PORTAL, ROLE_SHORT } from '../../constants'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useClickOutside } from '../../hooks/useClickOutside'
import { unreadNotificationCount } from '../../services/demoStore'
import { formatDate } from '../../lib/date'
import Avatar from '../ui/Avatar'
import NotificationPanel from '../notifications/NotificationPanel'
import { cn } from '../../lib/utils'

export default function Navbar({ role, onOpenSidebar }) {
  const { user, logout } = useAuth()
  const { db } = useData()
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen)

  const unread = useMemo(() => {
    if (user?.isBackend) {
      const key = `${user.role}:${user.id}`
      return (db.notifications || []).filter(
        (item) => !(item.readBy || []).includes(key),
      ).length
    }
    return unreadNotificationCount(db, user)
  }, [db, user])

  const title = PAGE_TITLES[location.pathname] || (
    location.pathname.includes('/parent/application/')
      ? 'Application Details'
      : 'Portal'
  )

  const handleLogout = () => {
    logout()
    toast.success('You have been signed out.')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
            <span>Portal</span>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span>{ROLE_SHORT[role]}</span>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span className="truncate font-medium text-slate-500">{title}</span>
          </div>
          <h2 className="truncate font-display text-[15px] font-semibold text-navy-900 sm:mt-0.5">
            {title}
          </h2>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-medium text-slate-500">
            {formatDate(new Date(), { weekday: 'short' })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] font-semibold text-amber-700">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Demo mode
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((open) => !open)
                setProfileOpen(false)
              }}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-navy-800',
                notificationsOpen && 'border-navy-200 bg-navy-50 text-navy-800',
              )}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-maroon-700 px-1 text-[9px] font-bold leading-none text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <NotificationPanel
              open={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              user={user}
            />
          </div>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open)
                setNotificationsOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg p-1 pr-1 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 sm:pr-2"
              aria-expanded={profileOpen}
              aria-label="Open account menu"
            >
              <Avatar name={user?.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[130px] truncate text-xs font-semibold text-slate-800">
                  {user?.name}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {ROLE_LABELS[role]}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'hidden h-3.5 w-3.5 text-slate-400 transition-transform sm:block',
                  profileOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[240px] animate-slideUp overflow-hidden rounded-xl border border-slate-200 bg-white shadow-dropdown">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {user?.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{user?.email}</p>
                  <span className="mt-2 inline-flex rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold text-navy-700">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
                <div className="p-1.5">
                  <Link
                    to={`/${ROLE_PORTAL[role]}/profile`}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    Profile & settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
