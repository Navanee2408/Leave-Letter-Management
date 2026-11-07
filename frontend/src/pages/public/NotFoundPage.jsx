import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard, LifeBuoy } from 'lucide-react'
import { ROLE_HOME, ROLE_LABELS } from '../../constants'
import { useAuth } from '../../hooks/useAuth'

export default function NotFoundPage() {
  const { user } = useAuth()
  const home = user ? ROLE_HOME[user.role] : '/'

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-16">
      <div
        className="absolute inset-0 bg-institution-grid opacity-40"
        aria-hidden="true"
      />
      <div
        className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-navy-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-card sm:p-9">
        <Link to="/" className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2">
          <img
            src="/brand/tce-logo.png"
            alt="Thiagarajar College of Engineering logo"
            className="h-9 w-auto max-w-[210px] object-contain"
          />
        </Link>

        <div className="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="mt-5 font-display text-[54px] font-bold leading-none tracking-tight text-navy-900">
          404
        </p>
        <h1 className="mt-2 font-display text-xl font-bold text-navy-900">
          This page could not be found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
          The address may be mistyped, or the page may belong to a later phase of
          the leave management portal.
        </p>

        {user && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-medium text-slate-600">
            Signed in as {ROLE_LABELS[user.role]} · {user.name}
          </p>
        )}

        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link
            to={home}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            {user ? 'Go to my dashboard' : 'Back to portal home'}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[12.5px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Landing page
          </Link>
        </div>

        <p className="mt-6 inline-flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400">
          <LifeBuoy className="h-3 w-3" aria-hidden="true" />
          Need help? Contact the department office for portal assistance.
        </p>
      </div>
    </main>
  )
}
