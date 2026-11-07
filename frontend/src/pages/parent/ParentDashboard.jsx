import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  FileClock,
  FilePlus2,
  GraduationCap,
  RefreshCcw,
  UsersRound,
  XCircle,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import SectionCard from '../../components/ui/SectionCard'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useLeavePdf } from '../../hooks/useLeavePdf'
import {
  childrenForParent,
  leavesForParent,
  parentStats,
} from '../../services/selectors'
import { formatDate, formatDateRange, todayISO } from '../../lib/date'

export default function ParentDashboard() {
  const { user } = useAuth()
  const { db } = useData()
  const download = useLeavePdf()

  const children = useMemo(
    () => childrenForParent(db, user?.id),
    [db, user?.id],
  )
  const leaves = useMemo(() => leavesForParent(db, user?.id), [db, user?.id])
  const stats = useMemo(() => parentStats(db, user?.id), [db, user?.id])

  const today = todayISO()
  const reopened = leaves.filter((leave) => leave.status === 'reopened')
  const pending = leaves.filter((leave) => leave.status === 'pending')
  const approved = leaves.filter((leave) => leave.status === 'approved')
  const upcoming = approved
    .filter((leave) => leave.toDate >= today)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate))
  const recent = leaves.slice(0, 5)

  return (
    <div>
      <PageHeader
        eyebrow="Guardian workspace"
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Parent'}`}
        description="Apply for leave, follow the HOD's decision and download approved leave letters for your children."
        actions={
          <>
            <Button as={Link} to="/parent/applications" variant="secondary">
              <FileClock className="h-4 w-4" />
              My applications
            </Button>
            <Button as={Link} to="/parent/apply-leave">
              <FilePlus2 className="h-4 w-4" />
              Apply for leave
            </Button>
          </>
        }
      />

      {reopened.length > 0 && (
        <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 ring-1 ring-sky-200">
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-sky-900">
                  {reopened.length} application{reopened.length === 1 ? '' : 's'}{' '}
                  need{reopened.length === 1 ? 's' : ''} your correction
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-sky-800">
                  The HOD reopened{' '}
                  {reopened.length === 1 ? reopened[0].id : 'these applications'} and
                  requested a correction. Review the reason and resubmit.
                </p>
              </div>
            </div>
            <Button
              as={Link}
              to={
                reopened.length === 1
                  ? `/parent/application/${reopened[0].id}`
                  : '/parent/applications'
              }
              size="sm"
              variant="secondary"
              className="shrink-0"
            >
              Review correction
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Linked children"
          value={children.length}
          icon={UsersRound}
          tone="navy"
          helper="Students linked to your guardian account"
        />
        <StatCard
          label="Awaiting decision"
          value={stats.pending + stats.reopened}
          icon={FileClock}
          tone="amber"
          helper={`${stats.pending} pending · ${stats.reopened} awaiting correction`}
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={BadgeCheck}
          tone="green"
          helper="Leave letters available to download"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          tone="red"
          helper="HOD reason is shown in the application"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <SectionCard
          title="Recent applications"
          subtitle="Your latest leave requests and their current status"
          icon={FileClock}
          actions={
            <Button as={Link} to="/parent/applications" size="sm" variant="ghost">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
          bodyClassName="p-0"
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={FilePlus2}
              title="No applications yet"
              description="Start by applying for leave for one of your linked children."
              action={
                <Button as={Link} to="/parent/apply-leave" size="sm">
                  Apply for leave
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((leave) => (
                <li key={leave.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar name={leave.studentName} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-slate-800">
                            {leave.studentName}
                          </p>
                          <StatusBadge status={leave.status} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {leave.id} · {leave.leaveType}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                          {formatDateRange(leave.fromDate, leave.toDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 pl-[44px] sm:pl-0">
                      {leave.status === 'approved' && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-navy-700 hover:bg-navy-50"
                          onClick={() => download(leave)}
                          aria-label={`Download approved leave letter for ${leave.id}`}
                          title="Download approved leave letter"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        as={Link}
                        to={`/parent/application/${leave.id}`}
                        size="xs"
                        variant="secondary"
                      >
                        {leave.status === 'reopened' ? 'Correct' : 'Details'}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title="Your children"
            subtitle="Linked student records"
            icon={GraduationCap}
            actions={
              <Button as={Link} to="/parent/children" size="sm" variant="ghost">
                View
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
            bodyClassName="p-0"
          >
            {children.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                title="No linked children"
                description="Contact the department office to link a student record to your account."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {children.map((child) => {
                  const childLeaves = leaves.filter(
                    (leave) => leave.studentId === child.id,
                  )
                  const childApproved = childLeaves.filter(
                    (leave) => leave.status === 'approved',
                  ).length
                  return (
                    <li key={child.id} className="flex items-center gap-3 px-5 py-3.5">
                      <Avatar name={child.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-slate-800">
                          {child.name}
                        </p>
                        <p className="truncate text-[10.5px] text-slate-400">
                          {child.registerNumber} · {child.className}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Tutor: {child.tutor?.name || 'Unassigned'} ·{' '}
                          {childApproved} approved
                        </p>
                      </div>
                      <Link
                        to={`/parent/apply-leave?child=${child.id}`}
                        className="shrink-0 text-[10.5px] font-semibold text-navy-700 transition hover:text-maroon-800"
                      >
                        Apply
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Upcoming approved leave"
            subtitle="Approved absences ending today or later"
            icon={CalendarDays}
            bodyClassName="p-0"
          >
            {upcoming.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-[13px] font-medium text-slate-700">
                  No upcoming approved leave
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Approved applications will appear here with a downloadable letter.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.slice(0, 4).map((leave) => (
                  <li key={leave.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">
                        {leave.studentName}
                      </p>
                      <p className="truncate text-[10.5px] text-slate-400">
                        {formatDateRange(leave.fromDate, leave.toDate)} ·{' '}
                        {leave.leaveType}
                      </p>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-navy-700 hover:bg-navy-50"
                      onClick={() => download(leave)}
                      aria-label={`Download approved leave letter for ${leave.id}`}
                      title="Download approved leave letter"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-maroon-50 text-maroon-800">
              <FileClock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-[13.5px] font-semibold text-navy-900">
                {pending.length} request{pending.length === 1 ? '' : 's'} waiting for
                the HOD
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
                Submitted {formatDate(recent[0]?.submittedAt)} · Decisions and
                corrections are tracked in your notifications.
              </p>
            </div>
          </div>
          <Button as={Link} to="/parent/application-status" size="sm" variant="secondary">
            Track application status
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
