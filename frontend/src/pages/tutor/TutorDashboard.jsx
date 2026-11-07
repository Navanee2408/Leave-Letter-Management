import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  Users,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import SectionCard from '../../components/ui/SectionCard'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import LeaveDetailsModal from '../../components/leave/LeaveDetailsModal'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useLeavePdf } from '../../hooks/useLeavePdf'
import {
  tutorApprovedLeaves,
  tutorClasses,
  tutorStats,
  upcomingApprovedLeaves,
} from '../../services/selectors'
import { formatDateRange, todayISO } from '../../lib/date'

export default function TutorDashboard() {
  const { user } = useAuth()
  const { db } = useData()
  const download = useLeavePdf()
  const [details, setDetails] = useState(null)

  const stats = useMemo(() => tutorStats(db, user?.id), [db, user?.id])
  const classes = useMemo(() => tutorClasses(db, user?.id), [db, user?.id])
  const approved = useMemo(() => tutorApprovedLeaves(db, user?.id), [db, user?.id])
  const upcoming = useMemo(
    () => upcomingApprovedLeaves(db, approved, 30),
    [db, approved],
  )
  const awayToday = approved.filter(
    (leave) => leave.fromDate <= todayISO() && leave.toDate >= todayISO(),
  )

  return (
    <div>
      <PageHeader
        eyebrow="Class tutor workspace"
        title={`Welcome, ${user?.name?.split(' ').slice(-1)[0] || 'Tutor'}`}
        description="Approved leave for the classes you coordinate. Pending and rejected applications are handled by the HOD and are not shown here."
        actions={
          <>
            <Button as={Link} to="/tutor/classes" variant="secondary">
              <BookOpenCheck className="h-4 w-4" />
              My classes
            </Button>
            <Button as={Link} to="/tutor/approved-leaves">
              <BadgeCheck className="h-4 w-4" />
              Approved leaves
            </Button>
          </>
        }
      />

      {upcoming.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-emerald-200">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-emerald-900">
                {upcoming.length} approved absence
                {upcoming.length === 1 ? '' : 's'} in the next 30 days
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
                {awayToday.length
                  ? `${awayToday.length} student${awayToday.length === 1 ? ' is' : 's are'} on approved leave today.`
                  : 'Review the dates so coursework and attendance can be planned.'}
              </p>
            </div>
          </div>
          <Button
            as={Link}
            to="/tutor/approved-leaves"
            size="sm"
            variant="secondary"
            className="shrink-0"
          >
            View schedule
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned classes"
          value={stats.classes}
          icon={BookOpenCheck}
          tone="navy"
          helper="Classes you coordinate as tutor"
        />
        <StatCard
          label="My students"
          value={stats.students}
          icon={Users}
          tone="maroon"
          helper="Across all assigned classes"
        />
        <StatCard
          label="Approved leaves"
          value={stats.approved}
          icon={BadgeCheck}
          tone="green"
          helper="Only HOD-approved applications"
        />
        <StatCard
          label="Upcoming absences"
          value={stats.upcoming}
          icon={CalendarDays}
          tone="blue"
          helper="Starting within the next 30 days"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Upcoming approved leave"
          subtitle="Students away in the next 30 days"
          icon={CalendarClock}
          actions={
            <Button as={Link} to="/tutor/approved-leaves" size="sm" variant="ghost">
              All approved
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
          bodyClassName="p-0"
        >
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming approved leave"
              description="Approved leave for your classes will appear here as soon as the HOD forwards it."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.slice(0, 6).map((leave) => (
                <li
                  key={leave.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar name={leave.studentName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {leave.studentName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {leave.registerNumber} · {leave.className}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {formatDateRange(leave.fromDate, leave.toDate)}
                        <span className="font-normal text-slate-400">
                          · {leave.duration} day{leave.duration === 1 ? '' : 's'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pl-[44px] sm:pl-0">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => setDetails(leave)}
                    >
                      Details
                    </Button>
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title="Students away today"
            subtitle="Approved leave covering today's date"
            icon={CheckCircle2}
            bodyClassName="p-0"
          >
            {awayToday.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-[13px] font-medium text-slate-700">
                  Everyone is expected in class today
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  No approved leave overlaps today's date.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {awayToday.map((leave) => (
                  <li key={leave.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar name={leave.studentName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">
                        {leave.studentName}
                      </p>
                      <p className="text-[10.5px] text-slate-400">
                        {leave.className} · until {new Date(`${leave.toDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="My classes"
            subtitle="Student groups assigned to you"
            icon={GraduationCap}
            actions={
              <Button as={Link} to="/tutor/classes" size="sm" variant="ghost">
                View
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
            bodyClassName="p-0"
          >
            {classes.length === 0 ? (
              <EmptyState
                title="No classes assigned"
                description="The HOD can assign classes from the academic administration module."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {classes.map((classItem) => (
                  <li key={classItem.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-slate-800">
                          {classItem.title}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-slate-400">
                          {classItem.academicYear} · {classItem.studentCount} student
                          {classItem.studentCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <Link
                        to="/tutor/students"
                        className="shrink-0 text-[10.5px] font-semibold text-navy-700 hover:text-maroon-800"
                      >
                        Students
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard
        className="mt-5"
        title="Approved leave snapshot"
        subtitle="A quick view of the latest approved applications for your students"
        icon={BadgeCheck}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {approved.length} approved
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {approved.slice(0, 3).map((leave) => (
            <button
              key={leave.id}
              type="button"
              onClick={() => setDetails(leave)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-navy-200 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={leave.studentName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-slate-800">
                    {leave.studentName}
                  </p>
                  <p className="truncate text-[10.5px] text-slate-400">
                    {leave.registerNumber} · {leave.className}
                  </p>
                </div>
                <Clock3 className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
              </div>
              <p className="mt-2.5 text-[11.5px] font-medium text-slate-600">
                {leave.leaveType}
              </p>
              <p className="mt-0.5 text-[10.5px] text-slate-400">
                {formatDateRange(leave.fromDate, leave.toDate)}
              </p>
            </button>
          ))}
          {approved.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={BadgeCheck}
                title="No approved applications yet"
                description="Approved leave for your assigned students will appear here."
              />
            </div>
          )}
        </div>
      </SectionCard>

      <LeaveDetailsModal
        open={Boolean(details)}
        leave={details}
        onClose={() => setDetails(null)}
        onDownload={download}
        title="Approved leave details"
      />
    </div>
  )
}
