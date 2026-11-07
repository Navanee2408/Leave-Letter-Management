import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { ROLE_BY_PORTAL, ROLE_HOME } from '../../constants'
import { demoCredentialsForRole } from '../../data/demoAuth'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'

const ROLES = [
  {
    key: 'admin',
    icon: ShieldCheck,
    title: 'College Administrator',
    eyebrow: 'College administration',
    description:
      'Manage departments, classes, students, parents and class tutor assignments.',
    points: [
      'Maintain the academic structure',
      'Manage student, parent and tutor records',
      'Assign tutors to classes',
    ],
    tone: 'bg-navy-900',
    iconTone: 'bg-navy-50 text-navy-800',
    loginPath: '/admin/login',
    actionLabel: 'administrator',
  },
  {
    key: 'hod',
    icon: Building2,
    title: 'Head of Department',
    eyebrow: 'Administration',
    description:
      'Review and decide department leave applications, then follow their outcomes in leave history.',
    points: [
      'Approve, reject or reopen with a reason',
      'Review leave requests for your department',
      'Track decisions in department leave history',
    ],
    tone: 'bg-navy-900',
    iconTone: 'bg-navy-50 text-navy-800',
    loginPath: '/login/hod',
    actionLabel: 'HOD',
  },
  {
    key: 'tutor',
    icon: GraduationCap,
    title: 'Class Tutor',
    eyebrow: 'Faculty',
    description:
      'See approved leave for the classes you coordinate, with upcoming absences and downloadable letters.',
    points: [
      'Approved leave only, scoped to your classes',
      'Student directory and absence planning',
      'Notified after HOD approval',
    ],
    tone: 'bg-maroon-800',
    iconTone: 'bg-maroon-50 text-maroon-800',
    loginPath: '/login/tutor',
    actionLabel: 'tutor',
  },
  {
    key: 'parent',
    icon: UsersRound,
    title: 'Parent / Guardian',
    eyebrow: 'Guardian access',
    description:
      'Apply for leave for your linked children, track decisions and correct an application when requested.',
    points: [
      'Apply for linked children only',
      'Follow pending, approved and rejected status',
      'Download approved leave letters as PDF',
    ],
    tone: 'bg-brand-600',
    iconTone: 'bg-brand-50 text-brand-700',
    loginPath: '/login/parent',
    actionLabel: 'parent',
  },
]

export default function LoginChooserPage() {
  const { user } = useAuth()
  const { db } = useData()

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="Portal home">
            <img
              src="/brand/tce-logo.png"
              alt="Thiagarajar College of Engineering logo"
              className="h-9 w-auto max-w-[195px] object-contain"
            />
            <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <span className="hidden sm:block">
              <span className="block font-display text-[11px] font-bold uppercase tracking-[0.1em] text-navy-900">
                Leave Management
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-400">
                Academic ERP Portal
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to={ROLE_HOME[user.role]}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-navy-900 px-3.5 text-xs font-semibold text-white transition hover:bg-navy-800"
              >
                Open dashboard
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wide text-amber-700">
                <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
                Demo sign-in
              </span>
            )}
            <Link
              to="/"
              className="hidden items-center gap-1 text-[11.5px] font-medium text-slate-500 transition hover:text-navy-800 sm:inline-flex"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              Portal home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-700">
            <LockKeyhole className="h-3 w-3" aria-hidden="true" />
            Choose your portal
          </span>
          <h1 className="mt-4 font-display text-[30px] font-bold leading-tight tracking-tight text-navy-900 sm:text-[36px]">
            Sign in to the leave management system
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
            Four role-based workspaces share one leave workflow. Choose a portal to
            continue with the pre-filled demo credentials.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => {
            const Icon = role.icon
            const credential = demoCredentialsForRole(db, ROLE_BY_PORTAL[role.key])
            return (
              <Link
                key={role.key}
                to={role.loginPath}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
              >
                <span
                  className={`absolute inset-x-0 top-0 h-[3px] ${role.tone}`}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${role.iconTone}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 ring-1 ring-slate-200">
                    {role.eyebrow}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-[17px] font-bold text-navy-900">
                  {role.title}
                </h2>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                  {role.description}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-[11.5px] leading-snug text-slate-600">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                    <KeyRound className="h-2.5 w-2.5" aria-hidden="true" />
                    Demo credentials
                  </p>
                  <p className="mt-1 truncate text-[10.5px] text-amber-900">
                    {credential.email}
                  </p>
                  <p className="text-[10.5px] text-amber-900/70">
                    Password: {credential.password}
                  </p>
                </div>

                <span className="mt-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11.5px] font-semibold text-navy-900 transition group-hover:border-navy-200 group-hover:bg-navy-50">
                  Continue as {role.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="flex items-start gap-2.5 text-[11px] leading-relaxed text-amber-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>
              <span className="font-semibold">Frontend demo only.</span> Sign-in checks
              the listed credentials locally. No backend session or JWT is issued, and
              sessions and records remain in this browser.
            </span>
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-2 px-4 py-5 text-[10.5px] text-slate-400 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} College Leave Management System · Frontend
            demonstration
          </p>
          <p>Independent academic prototype · Not an official TCE service</p>
        </div>
      </footer>
    </div>
  )
}
