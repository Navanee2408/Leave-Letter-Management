import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { ROLE_BY_PORTAL, ROLE_HOME } from '../../constants'
import { authenticateDemoUser, demoCredentialsForRole } from '../../data/demoAuth'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import FormInput from '../../components/forms/FormInput'
import { cn } from '../../lib/utils'

const ROLE_CONTENT = {
  admin: {
    icon: ShieldCheck,
    loginPath: '/admin/login',
    shortLabel: 'Admin',
    tag: 'College administration',
    title: 'College Administrator',
    heading: 'Keep the college directory and academic structure in order.',
    description:
      'Manage departments, classes, students, parents and class tutor assignments from one workspace.',
    bullets: [
      'Maintain departments and classes',
      'Manage student, parent and tutor records',
      'Assign class tutors',
    ],
  },
  hod: {
    icon: Building2,
    loginPath: '/login/hod',
    shortLabel: 'HOD',
    tag: 'Department administration',
    title: 'Head of Department',
    heading: 'Review, decide and keep the department informed.',
    description:
      'A focused workspace for reviewing and deciding leave applications within your department.',
    bullets: [
      'Approve, reject or reopen leave with a recorded reason',
      'Review requests from your department',
      'Track department leave history',
    ],
  },
  tutor: {
    icon: GraduationCap,
    loginPath: '/login/tutor',
    shortLabel: 'Tutor',
    tag: 'Faculty workspace',
    title: 'Class Tutor',
    heading: 'Know exactly when your students are approved to be away.',
    description:
      'A class-scoped view of approved student leave, upcoming absences and the students assigned to you.',
    bullets: [
      'See approved leave only for assigned classes',
      'Review upcoming absences and student details',
      'Get notified after the HOD approves a request',
    ],
  },
  parent: {
    icon: UsersRound,
    loginPath: '/login/parent',
    shortLabel: 'Parent',
    tag: 'Guardian access',
    title: 'Parent / Guardian',
    heading: 'Apply with clarity and follow every decision.',
    description:
      'Submit leave requests for your children, attach supporting documents and track the outcome from one place.',
    bullets: [
      'Choose from your linked children only',
      'Follow pending, approved and rejected status',
      'Download an approved leave letter as a PDF',
    ],
  },
}

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  remember: z.boolean().optional(),
})

function ForgotPasswordModal({ open, onClose, defaultEmail }) {
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setEmail(defaultEmail)
  }, [open, defaultEmail])

  const submit = async (event) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address.')
      return
    }
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setLoading(false)
    onClose()
    toast.success(
      'Reset request captured in demo mode. No email was sent because no backend is connected.',
      { duration: 5000 },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset your password"
      description="Enter the email linked to your portal account."
      size="sm"
      icon={KeyRound}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="forgot-password-form" loading={loading}>
            Send reset link
          </Button>
        </>
      }
    >
      <form id="forgot-password-form" onSubmit={submit} className="space-y-4">
        <FormInput
          label="Registered email"
          name="reset-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leftIcon={Mail}
          placeholder="you@example.com"
        />
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
          Demo mode: submitting this form does not send an email. Password recovery
          will be connected to the backend in a later phase.
        </p>
      </form>
    </Modal>
  )
}

export default function LoginPage({ role }) {
  const { login } = useAuth()
  const { db } = useData()
  const navigate = useNavigate()
  const content = ROLE_CONTENT[role]
  const credential = demoCredentialsForRole(db, ROLE_BY_PORTAL[role])
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: credential.email,
      password: credential.password,
      remember: true,
    },
  })

  const fillDemo = () => {
    reset({
      email: credential.email,
      password: credential.password,
      remember: true,
    })
    toast.success('Demo credentials filled.')
  }

  const submit = async (values) => {
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 650))
    const result = authenticateDemoUser(values.email, values.password, db)
    const expectedRole = ROLE_BY_PORTAL[role]
    if (result.error || result.user.role !== expectedRole) {
      setSubmitting(false)
      toast.error(result.error || 'Use an account assigned to this portal.')
      return
    }
    login(result.user, values.remember)
    setSubmitting(false)
    toast.success(`Signed in as ${result.user.name} (demo session).`)
    navigate(ROLE_HOME[expectedRole])
  }

  const RoleIcon = content.icon
  const otherRoles = Object.keys(ROLE_CONTENT).filter((item) => item !== role)

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-navy-950 px-8 py-8 text-white lg:flex lg:flex-col xl:px-12">
        <div className="absolute inset-0 bg-institution-grid opacity-50" aria-hidden="true" />
        <div
          className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-navy-800/50 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-maroon-900/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between">
          <Link to="/" className="inline-flex rounded-lg bg-white px-3.5 py-2.5">
            <img
              src="/brand/tce-logo.png"
              alt="Thiagarajar College of Engineering logo"
              className="h-9 w-auto max-w-[220px] object-contain"
            />
          </Link>
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-amber-200">
            Demo frontend
          </span>
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-200">
            <RoleIcon className="h-3 w-3" aria-hidden="true" />
            {content.tag}
          </span>
          <h1 className="mt-5 font-display text-[34px] font-bold leading-[1.15] tracking-[-0.015em] text-white xl:text-[38px]">
            {content.heading}
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-navy-200">
            {content.description}
          </p>

          <ul className="mt-7 space-y-3">
            {content.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-200 ring-1 ring-white/15">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-[12.5px] leading-relaxed text-navy-200">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <p className="text-[11px] font-semibold text-white">Simulated access</p>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-navy-300">
              No credentials are verified in this frontend phase. Real JWT
              authentication will be added with the backend integration.
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[10px] text-navy-400">
          <span>College Leave Management System</span>
          <Link to="/" className="inline-flex items-center gap-1 transition hover:text-white">
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to portal
          </Link>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col bg-slate-50/50">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Link to="/" className="inline-flex">
            <img
              src="/brand/tce-logo.png"
              alt="Thiagarajar College of Engineering logo"
              className="h-8 w-auto max-w-[190px] object-contain"
            />
          </Link>
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
            Demo
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-7">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 transition hover:text-navy-800 lg:hidden"
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  Portal home
                </Link>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                  <LockKeyhole className="h-2.5 w-2.5" aria-hidden="true" />
                  Demo sign-in
                </span>
              </div>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white">
                <RoleIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-display text-[26px] font-bold tracking-tight text-navy-900">
                {content.title} Login
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                Sign in to the {content.title.toLowerCase()} workspace of the
                College Leave Management System.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <div className="mb-5 grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1">
                {Object.keys(ROLE_CONTENT).map((key) => (
                  <Link
                    key={key}
                    to={ROLE_CONTENT[key].loginPath}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-center text-[10.5px] font-semibold transition',
                      key === role
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-slate-500 hover:text-navy-800',
                    )}
                  >
                    {ROLE_CONTENT[key].shortLabel}
                  </Link>
                ))}
              </div>

              <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
                <FormInput
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@example.com"
                  leftIcon={Mail}
                  required
                  error={errors.email?.message}
                  {...register('email')}
                />

                <FormInput
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  leftIcon={LockKeyhole}
                  required
                  error={errors.password?.message}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:text-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  {...register('password')}
                />

                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[11.5px] text-slate-600">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-navy-800"
                      {...register('remember')}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-[11.5px] font-semibold text-navy-800 transition hover:text-maroon-800"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" loading={submitting}>
                  Sign in to portal
                  {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </form>

              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800">
                    Demo credentials
                  </p>
                  <button
                    type="button"
                    onClick={fillDemo}
                    className="rounded border border-amber-300 bg-white px-2 py-1 text-[9.5px] font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    Fill again
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-[10.5px] text-amber-900/80">
                  <p>
                    <span className="text-amber-700">Email:</span>{' '}
                    {credential.email}
                  </p>
                  <p>
                    <span className="text-amber-700">Password:</span>{' '}
                    {credential.password}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-400">
                Demo sign-in checks the listed account credentials locally. No backend session or JWT is issued.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10.5px] text-slate-400">
              <span className="font-medium text-slate-500">Other portals:</span>
              {otherRoles.map((item) => (
                <Link
                  key={item}
                  to={ROLE_CONTENT[item].loginPath}
                  className="font-medium text-navy-700 transition hover:text-maroon-800"
                >
                  {ROLE_CONTENT[item].title}
                </Link>
              ))}
            </div>

            <p className="mt-5 text-center text-[9.5px] leading-relaxed text-slate-400">
              Independent academic prototype. Not an official portal of Thiagarajar
              College of Engineering.
            </p>
          </div>
        </div>
      </main>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        defaultEmail={credential.email}
      />
    </div>
  )
}
