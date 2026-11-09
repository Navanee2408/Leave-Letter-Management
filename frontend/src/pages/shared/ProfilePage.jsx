import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  AtSign,
  Bell,
  BookOpenCheck,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import Button from '../../components/ui/Button'
import FormInput from '../../components/forms/FormInput'
import FormTextarea from '../../components/forms/FormTextarea'
import Avatar from '../../components/ui/Avatar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import StatCard from '../../components/ui/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import {
  classTitle,
  departmentById,
  tutorClasses,
  childrenForParent,
  tutorStudents,
  hodStats,
  adminStats,
} from '../../services/selectors'
import { ROLES, ROLE_LABELS } from '../../constants'

const PREFS_KEY = 'clms_demo_preferences_v1'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().min(0).max(30, 'Phone number is too long.'),
  designation: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300, 'Address must be 300 characters or fewer.').optional(),
})

function readPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { emailUpdates: true, inAppUpdates: true }
    return {
      emailUpdates: true,
      inAppUpdates: true,
      ...JSON.parse(raw),
    }
  } catch {
    return { emailUpdates: true, inAppUpdates: true }
  }
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-3.5 transition hover:border-slate-300">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-slate-800">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
          {description}
        </span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-navy-800" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
      </span>
    </label>
  )
}

export default function ProfilePage({ role }) {
  const { user, updateProfile } = useAuth()
  const { db, resetDemoData } = useData()
  const [preferences, setPreferences] = useState(readPreferences)
  const [resetOpen, setResetOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      designation: user?.designation || '',
      address: user?.address || '',
    },
  })

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences))
    } catch {
      // Preferences remain in memory when storage is unavailable.
    }
  }, [preferences])

  const department = useMemo(
    () => departmentById(db, user?.departmentId),
    [db, user?.departmentId],
  )
  const tutorClassList = useMemo(
    () => (role === ROLES.CLASS_TUTOR ? tutorClasses(db, user?.id) : []),
    [db, role, user?.id],
  )
  const children = useMemo(
    () => (role === ROLES.PARENT ? childrenForParent(db, user?.id) : []),
    [db, role, user?.id],
  )
  const students = useMemo(
    () => (role === ROLES.CLASS_TUTOR ? tutorStudents(db, user?.id) : []),
    [db, role, user?.id],
  )
  const departmentStats = useMemo(
    () => (role === ROLES.HOD ? hodStats(db, user?.id) : null),
    [db, role, user?.id],
  )
  const adminOverview = useMemo(
    () => (role === ROLES.ADMIN ? adminStats(db) : null),
    [db, role],
  )

  const submit = (values) => {
    updateProfile(values)
    toast.success('Profile details updated for this demo session.')
  }

  const updatePreference = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }))
    toast.success('Notification preference saved in this browser.')
  }

  const handleReset = () => {
    resetDemoData()
    setResetOpen(false)
    toast.success('Demo dataset restored to its original state.')
  }

  return (
    <div>
      <PageHeader
        eyebrow={ROLE_LABELS[role]}
        title="Profile & settings"
        description="Update the display details for this demo session and review the records linked to your role."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <SectionCard
            title="Account details"
            subtitle="Changes apply to the simulated session on this browser."
            icon={UserRound}
          >
            <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
              <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <Avatar name={user?.name} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <span className="mt-1.5 inline-flex rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-800">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Full name"
                  name="profile-name"
                  leftIcon={UserRound}
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />
                <FormInput
                  label="Email address"
                  name="profile-email"
                  type="email"
                  leftIcon={Mail}
                  required
                  error={errors.email?.message}
                  {...register('email')}
                />
                <FormInput
                  label="Phone number"
                  name="profile-phone"
                  leftIcon={Phone}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <FormInput
                  label={role === ROLES.PARENT ? 'Relationship' : 'Designation'}
                  name="profile-designation"
                  leftIcon={role === ROLES.PARENT ? UsersRound : GraduationCap}
                  placeholder={role === ROLES.PARENT ? 'Parent / Guardian' : 'Associate Professor'}
                  error={errors.designation?.message}
                  {...register('designation')}
                />
              </div>

              {role === ROLES.PARENT ? (
                <FormTextarea
                  label="Postal address"
                  name="profile-address"
                  rows={3}
                  maxLength={300}
                  valueLength={(user?.address || '').length}
                  error={errors.address?.message}
                  {...register('address')}
                />
              ) : (
                <FormInput
                  label="Department"
                  name="profile-department"
                  value={department?.name || 'Not assigned'}
                  readOnly
                  leftIcon={Building2}
                  hint="Department assignments are managed by the administration module."
                />
              )}

              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Save profile
                </Button>
              </div>
              {isSubmitSuccessful && (
                <p className="text-right text-[11px] text-emerald-600">
                  Profile saved in the demo session.
                </p>
              )}
            </form>
          </SectionCard>

          <SectionCard
            title="Notification preferences"
            subtitle="Stored locally as a UI preference; no email is sent in this demo."
            icon={Bell}
          >
            <div className="grid gap-3">
              <Toggle
                checked={preferences.emailUpdates}
                onChange={(value) => updatePreference('emailUpdates', value)}
                label="Email summaries"
                description="Remember that the portal should email decision summaries when a backend is connected."
              />
              <Toggle
                checked={preferences.inAppUpdates}
                onChange={(value) => updatePreference('inAppUpdates', value)}
                label="In-portal notifications"
                description="Show the notification badge and centre updates for this account."
              />
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
              <p className="text-[10.5px] leading-relaxed text-amber-800">
                No real messages are delivered. The notification centre reads from
                browser-local demo data only.
              </p>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Portal role" subtitle="Role-scoped access summary" icon={ShieldCheck}>
            <div className="grid grid-cols-2 gap-3">
              {role === ROLES.HOD && departmentStats && (
                <>
                  <StatCard
                    label="Department students"
                    value={departmentStats.students}
                    icon={UsersRound}
                    tone="navy"
                  />
                  <StatCard
                    label="Classes"
                    value={departmentStats.classes}
                    icon={Building2}
                    tone="maroon"
                  />
                  <StatCard
                    label="Tutors"
                    value={departmentStats.tutors}
                    icon={GraduationCap}
                    tone="blue"
                  />
                  <StatCard
                    label="Parents"
                    value={departmentStats.parents}
                    icon={UserRound}
                    tone="green"
                  />
                </>
              )}
              {role === ROLES.ADMIN && adminOverview && (
                <>
                  <StatCard
                    label="Departments"
                    value={adminOverview.departments}
                    icon={Building2}
                    tone="navy"
                  />
                  <StatCard
                    label="HODs"
                    value={adminOverview.hods}
                    icon={ShieldCheck}
                    tone="maroon"
                  />
                  <StatCard
                    label="Students"
                    value={adminOverview.students}
                    icon={UsersRound}
                    tone="blue"
                  />
                  <StatCard
                    label="Leave applications"
                    value={adminOverview.totalLeaves}
                    icon={BookOpenCheck}
                    tone="green"
                  />
                </>
              )}
              {role === ROLES.CLASS_TUTOR && (
                <>
                  <StatCard
                    label="Assigned classes"
                    value={tutorClassList.length}
                    icon={BookOpenCheck}
                    tone="navy"
                  />
                  <StatCard
                    label="Students"
                    value={students.length}
                    icon={UsersRound}
                    tone="maroon"
                  />
                </>
              )}
              {role === ROLES.PARENT && (
                <>
                  <StatCard
                    label="Linked children"
                    value={children.length}
                    icon={UsersRound}
                    tone="navy"
                  />
                  <StatCard
                    label="Applications"
                    value={db.leaves.filter((leave) => leave.parentId === user?.id).length}
                    icon={BookOpenCheck}
                    tone="green"
                  />
                </>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {role === ROLES.HOD && departmentStats && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    Administrative scope
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                    {departmentStats.departmentName}. You can review and decide
                    leave applications for this department only. Student, parent,
                    tutor and class records are managed by the college
                    administrator.
                  </p>
                </div>
              )}
              {role === ROLES.ADMIN && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    Administrative scope
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                    College-wide oversight of departments, HODs, classes,
                    students, tutors, parents and leave reports. Routine leave
                    approvals stay with each department HOD.
                  </p>
                </div>
              )}
              {role === ROLES.CLASS_TUTOR &&
                tutorClassList.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <div>
                      <p className="text-[12.5px] font-medium text-slate-700">
                        {classTitle(db, classItem)}
                      </p>
                      <p className="text-[10.5px] text-slate-400">
                        {classItem.studentCount} student
                        {classItem.studentCount === 1 ? '' : 's'} · {classItem.academicYear}
                      </p>
                    </div>
                    <AtSign className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                  </div>
                ))}
              {role === ROLES.PARENT &&
                children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-3"
                  >
                    <Avatar name={child.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-slate-700">
                        {child.name}
                      </p>
                      <p className="text-[10.5px] text-slate-400">
                        {child.registerNumber} · {child.className}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </SectionCard>

          {!user?.isBackend && (
            <SectionCard title="Demo data" subtitle="The dataset is stored in this browser" icon={RotateCcw}>
              <p className="text-xs leading-relaxed text-slate-500">
                Reset the browser-local demo data to restore the original departments,
                students, parents, tutors, leave applications and notifications. Your
                profile details in the simulated session are not changed.
              </p>
              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[12.5px] font-semibold text-rose-800">
                    Restore demo dataset
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-rose-700/80">
                    Any applications or edits you created will be removed.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setResetOpen(true)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset demo data
                </Button>
              </div>
            </SectionCard>
          )}

          <div className="card p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              {user?.isBackend ? 'Live Account Security' : 'Demonstration environment'}
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-400">
              {user?.isBackend
                ? 'Your session is actively authenticated against the college MongoDB database with secure JSON Web Tokens.'
                : 'This portal is a frontend-only prototype. Credentials, sessions and decisions are simulated and must not be used for real college administration.'}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset the demo dataset?"
        description="This restores the original sample records and removes any changes made in this browser."
        confirmLabel="Reset demo data"
      >
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
          The application data will return to its seeded state. Reload the page if
          a screen does not refresh automatically.
        </p>
      </ConfirmDialog>
    </div>
  )
}
