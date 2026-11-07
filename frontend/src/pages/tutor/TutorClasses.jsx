import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Mail,
  Users,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import {
  tutorApprovedLeaves,
  tutorClasses,
  tutorStudents,
} from '../../services/selectors'
import { formatDateRange, todayISO } from '../../lib/date'

export default function TutorClasses() {
  const { user } = useAuth()
  const { db } = useData()
  const classes = useMemo(() => tutorClasses(db, user?.id), [db, user?.id])
  const students = useMemo(() => tutorStudents(db, user?.id), [db, user?.id])
  const approved = useMemo(() => tutorApprovedLeaves(db, user?.id), [db, user?.id])

  const today = todayISO()

  return (
    <div>
      <PageHeader
        eyebrow="My classroom"
        title="My classes"
        description="The classes you coordinate as class tutor. Student lists and approved leave are scoped to these groups only."
        actions={
          <Button as={Link} to="/tutor/students" variant="secondary">
            <Users className="h-4 w-4" />
            All my students
          </Button>
        }
      />

      {classes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpenCheck}
            title="No classes assigned"
            description="The Head of Department can assign classes to your tutor record from the academic administration module."
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {classes.map((classItem) => {
            const classStudents = students.filter(
              (student) => student.classId === classItem.id,
            )
            const classLeaves = approved.filter(
              (leave) => leave.classItem?.id === classItem.id,
            )
            const awayNow = classLeaves.filter(
              (leave) => leave.fromDate <= today && leave.toDate >= today,
            )
            const nextLeave = classLeaves
              .filter((leave) => leave.fromDate >= today)
              .sort((a, b) => a.fromDate.localeCompare(b.fromDate))[0]

            return (
              <section key={classItem.id} className="card overflow-hidden">
                <div className="relative overflow-hidden bg-navy-950 px-5 py-4 text-white">
                  <div className="absolute inset-0 bg-institution-grid opacity-40" aria-hidden="true" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300">
                        Class group
                      </p>
                      <h2 className="mt-1 font-display text-lg font-bold">
                        {classItem.title}
                      </h2>
                      <p className="mt-0.5 text-[11px] text-navy-200">
                        {classItem.department?.name || 'Department not assigned'} ·{' '}
                        {classItem.academicYear}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                      <GraduationCap className="h-5 w-5 text-brand-200" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  <div className="px-4 py-3">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Students
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-navy-900">
                      {classStudents.length}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Approved
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-emerald-700">
                      {classLeaves.length}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                      Away today
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-amber-600">
                      {awayNow.length}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Students
                    </p>
                    <Link
                      to={`/tutor/students?class=${classItem.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 transition hover:text-maroon-800"
                    >
                      View list
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {classStudents.length === 0 ? (
                    <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-500">
                      No students are currently assigned to this class.
                    </p>
                  ) : (
                    <ul className="mt-2.5 space-y-2">
                      {classStudents.slice(0, 4).map((student) => (
                        <li key={student.id} className="flex items-center gap-2.5">
                          <Avatar name={student.name} size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium text-slate-700">
                              {student.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {student.registerNumber}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {approved.filter((leave) => leave.studentId === student.id).length}{' '}
                            approved
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {classStudents.length > 4 && (
                    <p className="mt-2 text-[10.5px] text-slate-400">
                      +{classStudents.length - 4} more student
                      {classStudents.length - 4 === 1 ? '' : 's'}
                    </p>
                  )}

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      <CalendarDays className="h-3 w-3" aria-hidden="true" />
                      Next approved absence
                    </p>
                    {nextLeave ? (
                      <>
                        <p className="mt-1 text-[12px] font-medium text-slate-700">
                          {nextLeave.studentName}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-slate-500">
                          {formatDateRange(nextLeave.fromDate, nextLeave.toDate)} ·{' '}
                          {nextLeave.leaveType}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">
                        No upcoming approved leave for this class.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      as={Link}
                      to={`/tutor/students?class=${classItem.id}`}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Students
                    </Button>
                    <Button
                      as={Link}
                      to={`/tutor/approved-leaves?class=${classItem.id}`}
                      size="sm"
                      className="flex-1"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Approved leave
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
        title="Tutor contact"
        subtitle="Your contact details as visible to the department"
        icon={Mail}
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
                Classes
              </span>
              {classes.length} assigned
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Students
              </span>
              {students.length} total
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
