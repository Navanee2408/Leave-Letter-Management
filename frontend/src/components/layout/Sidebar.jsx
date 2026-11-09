import { NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react'
import { NAV_BY_ROLE } from '../../constants/navigation'
import { ROLE_LABELS } from '../../constants'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

export default function Sidebar({
  role,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  counts = {},
}) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const sections = NAV_BY_ROLE[role] || []
  useLockBodyScroll(mobileOpen)

  const handleLogout = () => {
    logout()
    toast.success('You have been signed out.')
    navigate('/')
  }

  const renderBadge = (key) => {
    const count = counts[key]
    if (!count) return null
    if (collapsed) {
      return (
        <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
      )
    }
    return (
      <span className="ml-auto min-w-[20px] rounded-full bg-white/15 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
        {count > 99 ? '99+' : count}
      </span>
    )
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[262px] flex-col bg-navy-950 text-white shadow-2xl transition-all duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[78px]' : 'lg:w-[262px]',
        )}
        aria-label="Sidebar navigation"
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-white/10 bg-white',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {collapsed ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 font-display text-[10px] font-bold tracking-tight text-white">
              TCE
            </span>
          ) : (
            <img
              src="/brand/tce-logo.png"
              alt="Thiagarajar College of Engineering emblem"
              className="h-8 w-auto max-w-[176px] object-contain"
            />
          )}
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn(
            'shrink-0 border-b border-white/10 bg-navy-900/70 px-4 py-3',
            collapsed && 'px-2 text-center',
          )}
        >
          {collapsed ? (
            <GraduationCap className="mx-auto h-4 w-4 text-brand-300" aria-hidden="true" />
          ) : (
            <>
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">
                Leave Management
              </p>
              <p className="mt-0.5 text-[11px] text-navy-200">{ROLE_LABELS[role]}</p>
            </>
          )}
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-dark"
          aria-label="Primary"
        >
          {sections.map((section) => (
            <div key={section.label} className="mb-4 last:mb-1">
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-8 bg-white/10" aria-hidden="true" />
              ) : (
                <p className="mb-1.5 px-2.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-navy-300/70">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onMobileClose}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'sidebar-link relative',
                            isActive &&
                              'sidebar-link-active before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-300',
                            collapsed && 'justify-center px-2',
                          )
                        }
                      >
                        <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} aria-hidden="true" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {item.badgeKey && renderBadge(item.badgeKey)}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-2.5">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-white/90">College Leave Portal</p>
                <p className="truncate text-[9px] font-medium text-emerald-400/90">Live authenticated session</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'sidebar-link w-full text-rose-200/80 hover:bg-rose-500/15 hover:text-rose-100',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-1 hidden w-full items-center justify-center gap-2 rounded-md py-1.5 text-[10px] font-medium text-navy-300/70 transition hover:bg-white/5 hover:text-white lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                Collapse sidebar
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
