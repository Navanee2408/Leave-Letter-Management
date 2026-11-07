import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Eye,
  FileClock,
  FilePlus2,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
  UsersRound,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { childrenForParent, leavesForParent } from '../../services/selectors'
import { formatDate, formatDateRange, todayISO } from '../../lib/date'

export default function ParentChildren() {
  const { user } = useAuth()
  const { db } = useData()
  const [selected, setSelected] = useState(null)

  const children = useMemo(
    () => childrenForParent(db, user?.id),
    [db, user?.id],
  )
  const leaves = useMemo(() => leavesForParent(db, user?.id), [db, user?.id])
  const today = todayISO()

  const childLeaves = (childId) =>
    leaves.filter((leave) => leave.studentId === childId)

  return (
    <div>
      <PageHeader
        eyebrow="My family"
        title="My children"
        description="The student records linked to your guardian account, with their class tutor and leave activity."
        actions={
          <Button as={Link} to="/parent/apply-leave">
            <FilePlus2 className="h-4 w-4" />
            Apply for leave
          </Button>
        }
      />

      {children.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UsersRound}
            title="No linked children"
            description="No student records are linked to this parent account in the demo dataset. The department office manages this link in a real deployment."
            action={
              <Button as={Link} to="/parent/profile" variant="secondary">
                View profile
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {children.map((child) => {
            const records = childLeaves(child.id)
            const approved = records.filter((leave) => leave.status === 'approved')
            const pending = records.filter((leave) =>
              ['pending', 'reopened'].includes(leave.status),
            )
            const upcoming = approved
              .filter((leave) => leave.toDate >= today)
              .sort((a, b) => a.fromDate.localeCompare(b.fromDate))[0]
            const latest = records[0]

            return (
              <section key={child.id} className="card overflow-hidden">
                <div className="relative overflow-hidden bg-navy-950 px-5 py-4 text-white">
                  <div
                    className="absolute inset-0 bg-institution-grid opacity-40"
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar name={child.name} size="lg" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300">
                          Linked student
                        </p>
                        <h2 className="mt-0.5 truncate font-display text-lg font-bold">
                          {child.name}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-navy-200">
                          {child.registerNumber} · {child.department?.code || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                      <GraduationCap className="h-5 w-5 text-brand-200" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="relative mt-3 text-[11.5px] font-medium text-navy-200">
                    {child.className}
                  </p>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  <div className="px-4 py-3">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Applications
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-navy-900">
                      {records.length}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Approved
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-emerald-700">
                      {approved.length}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                      In review
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-amber-600">
                      {pending.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                        <UserRound className="h-3 w-3" aria-hidden="true" />
                        Class tutor
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-slate-700">
                        {child.tutor?.name || 'Unassigned'}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-slate-400">
                        {child.tutor?.email || 'No tutor email on record'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        Next approved leave
                      </p>
                      {upcoming ? (
                        <>
                          <p className="mt-1 text-[12px] font-medium text-slate-700">
                            {formatDateRange(upcoming.fromDate, upcoming.toDate)}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-400">
                            {upcoming.leaveType}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-500">
                          No upcoming approved absence
                        </p>
                      )}
                    </div>
                  </div>

                  {latest && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
                      <FileClock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11.5px] font-medium text-slate-700">
                          {latest.leaveType} · {formatDateRange(latest.fromDate, latest.toDate)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Latest application {latest.id} · {formatDate(latest.submittedAt)}
                        </p>
                      </div>
                      <StatusBadge status={latest.status} />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    <Button
                      as={Link}
                      to={`/parent/apply-leave?child=${child.id}`}
                      size="sm"
                      className="flex-1"
                    >
                      <FilePlus2 className="h-3.5 w-3.5" />
                      Apply for leave
                    </Button>
                    <Button
                      as={Link}
                      to={`/parent/applications?child=${child.id}`}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      <FileClock className="h-3.5 w-3.5" />
                      Applications
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setSelected(child)}
                      aria-label={`View details for ${child.name}`}
                      title="View student details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      <SectionCard
        className="mt-5"
        title="Guardian account"
        subtitle="Contact details recorded for your linked students"
        icon={UserRound}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="md" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Phone
              </span>
              {user?.phone || '—'}
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Address
              </span>
              {user?.address || '—'}
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Linked students
              </span>
              {children.length}
            </span>
          </div>
        </div>
      </SectionCard>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Student details'}
        description={
          selected
            ? `${selected.registerNumber} · ${selected.className}`
            : undefined
        }
        icon={GraduationCap}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected && (
              <Button as={Link} to={`/parent/apply-leave?child=${selected.id}`} onClick={() => setSelected(null)}>
                <FilePlus2 className="h-4 w-4" />
                Apply for leave
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <Avatar name={selected.name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selected.registerNumber} · {selected.department?.name || 'Department not set'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {selected.className} · {selected.classItem?.academicYear || 'Academic year not set'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <GraduationCap className="h-3 w-3" aria-hidden="true" />
                  Class tutor
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-slate-700">
                  {selected.tutor?.name || 'Unassigned'}
                </p>
                {selected.tutor?.email && (
                  <a
                    href={`mailto:${selected.tutor.email}`}
                    className="mt-1 flex items-center gap-1.5 text-[11.5px] text-navy-700 hover:text-maroon-800"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    {selected.tutor.email}
                  </a>
                )}
                {selected.tutor?.phone && (
                  <a
                    href={`tel:${selected.tutor.phone.replace(/\s+/g, '')}`}
                    className="mt-1 flex items-center gap-1.5 text-[11.5px] text-navy-700 hover:text-maroon-800"
                  >
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    {selected.tutor.phone}
                  </a>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  Leave summary
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-slate-700">
                  {childLeaves(selected.id).length} application
                  {childLeaves(selected.id).length === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-[11.5px] text-slate-500">
                  {childLeaves(selected.id).filter((leave) => leave.status === 'approved').length}{' '}
                  approved ·{' '}
                  {childLeaves(selected.id).filter((leave) => leave.status === 'pending').length}{' '}
                  pending ·{' '}
                  {childLeaves(selected.id).filter((leave) => leave.status === 'reopened').length}{' '}
                  reopened
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  Application history
                </p>
                <Link
                  to={`/parent/applications?child=${selected.id}`}
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 hover:text-maroon-800"
                >
                  Open applications
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {childLeaves(selected.id).length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                  No leave applications have been submitted for this child.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {childLeaves(selected.id)
                    .slice(0, 6)
                    .map((leave) => (
                      <li
                        key={leave.id}
                        className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium text-slate-700">
                            {leave.leaveType} · {formatDateRange(leave.fromDate, leave.toDate)}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-400">
                            {leave.id} · submitted {formatDate(leave.submittedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={leave.status} />
                          <Link
                            to={`/parent/application/${leave.id}`}
                            onClick={() => setSelected(null)}
                            className="text-[10.5px] font-semibold text-navy-700 hover:text-maroon-800"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
