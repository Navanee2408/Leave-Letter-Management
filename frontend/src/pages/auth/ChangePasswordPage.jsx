import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import FormInput from '../../components/forms/FormInput'
import Button from '../../components/ui/Button'
import { ROLE_HOME, ROLE_LABELS, ROLE_LOGIN } from '../../constants'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../services/api/client'

const schema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current temporary password is required.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long.')
      .max(128, 'New password must be 128 characters or fewer.')
      .regex(/[A-Z]/, 'Include at least one uppercase letter.')
      .regex(/[a-z]/, 'Include at least one lowercase letter.')
      .regex(/[0-9]/, 'Include at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Confirm password must match the new password.',
      })
    }
    if (
      values.currentPassword &&
      values.newPassword === values.currentPassword
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'New password must differ from your temporary password.',
      })
    }
  })

const PASSWORD_CHECKS = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (value) => value.length >= 8,
  },
  {
    id: 'upper',
    label: 'At least 1 uppercase letter (A-Z)',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: 'lower',
    label: 'At least 1 lowercase letter (a-z)',
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: 'digit',
    label: 'At least 1 number (0-9)',
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: 'special',
    label: 'At least 1 special character (!@#$...)',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
]

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const watchedNewPassword = watch('newPassword', '')

  const onSubmit = async (values) => {
    setSubmitting(true)
    setServerError('')

    try {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      const updatedUser = result.user
      toast.success('Password updated. Welcome to your portal.')
      navigate(ROLE_HOME[updatedUser?.role] || ROLE_HOME[user?.role] || '/', {
        replace: true,
      })
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update password.')
      setServerError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    const loginPath = ROLE_LOGIN[user?.role] || '/login'
    await logout()
    navigate(loginPath, { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-navy-900">
                College Leave Portal
              </p>
              <p className="text-[11px] text-slate-500">Account security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                First-Login Security Step
              </span>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
                Change Your Temporary Password
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Your administrator created your account with a temporary password.
                Create a strong personal password before accessing your{' '}
                {ROLE_LABELS[user?.role] || 'portal'} dashboard.
              </p>
            </div>
          </div>

          {user && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Signed in as{' '}
              <span className="font-semibold text-slate-900">
                {user.name || user.fullName}
              </span>{' '}
              ({user.email}) · {ROLE_LABELS[user.role] || user.role}
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormInput
              label="Current Temporary Password"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              required
              leftIcon={Lock}
              placeholder="Enter temporary password from admin"
              error={errors.currentPassword?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              {...register('currentPassword')}
            />

            <FormInput
              label="New Password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              required
              leftIcon={Lock}
              placeholder="Create a strong personal password"
              error={errors.newPassword?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              {...register('newPassword')}
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-xs font-semibold text-slate-700">
                Password Requirements
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {PASSWORD_CHECKS.map((rule) => {
                  const passed = rule.test(watchedNewPassword)
                  return (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs ${
                        passed ? 'font-medium text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                      )}
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            </div>

            <FormInput
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              leftIcon={Lock}
              placeholder="Re-enter your new password"
              error={errors.confirmPassword?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              {...register('confirmPassword')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={submitting}
              >
                Update Password &amp; Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
