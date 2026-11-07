import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  GraduationCap,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_HOME } from '../../constants'
import { cn } from '../../lib/utils'

const NAV_LINKS = [
  { href: '#about', label: 'Overview' },
  { href: '#portals', label: 'Portals' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#features', label: 'Features' },
  { href: '#help', label: 'Help' },
]

export default function PublicHeader() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-navy-950 text-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2 text-[10.5px] sm:px-6 lg:px-8">
          <p className="flex items-center gap-2">
            <span className="hidden h-1.5 w-1.5 rounded-full bg-brand-300 sm:block" />
            <span className="text-navy-200">
              Academic administration · Digital leave workflow
            </span>
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-amber-200 sm:inline-flex">
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
              Demo frontend
            </span>
            <a href="#help" className="text-navy-200 transition hover:text-white">
              Help desk
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'border-b border-slate-200 bg-white transition-shadow',
          scrolled && 'shadow-sm',
        )}
      >
        <div className="mx-auto flex h-[70px] max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Portal home">
            <img
              src="/brand/tce-logo.png"
              alt="Thiagarajar College of Engineering logo"
              className="h-9 w-auto max-w-[190px] object-contain sm:h-10 sm:max-w-[220px]"
            />
            <span className="hidden h-9 w-px bg-slate-200 md:block" aria-hidden="true" />
            <span className="hidden min-w-0 md:block">
              <span className="block font-display text-[12px] font-bold uppercase tracking-[0.09em] text-navy-900">
                Leave Management
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-400">
                Academic ERP Portal
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Public navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-[12.5px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-navy-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-4">
            {user ? (
              <Link
                to={ROLE_HOME[user.role]}
                className="hidden items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800 sm:inline-flex"
              >
                Open dashboard
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <a
                href="#portals"
                className="hidden items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800 sm:inline-flex"
              >
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Portal login
              </a>
            )}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 lg:hidden">
            <nav className="space-y-1" aria-label="Mobile public navigation">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <Link
                  to={ROLE_HOME[user.role]}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <a
                  href="#portals"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <GraduationCap className="h-4 w-4" />
                  Portal login
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
