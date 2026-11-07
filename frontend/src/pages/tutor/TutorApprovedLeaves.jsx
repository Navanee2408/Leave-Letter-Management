import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Users,
  X,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Pagination from '../../components/ui/Pagination'
import LeaveTable from '../../components/leave/LeaveTable'
import LeaveDetailsModal from '../../components/leave/LeaveDetailsModal'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useLeavePdf } from '../../hooks/useLeavePdf'
import { usePagination } from '../../hooks/usePagination'
import {
  tutorApprovedLeaves,
  tutorClasses,
  tutorStudents,
} from '../../services/selectors'
import { LEAVE_TYPE_SHORT, LEAVE_TYPES } from '../../constants'
import { todayISO } from '../../lib/date'

export default function TutorApprovedLeaves() {
  const { user } = useAuth()
  const { db } = useData()
  const download = useLeavePdf()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState(searchParams.get('class') || '')
  const [studentFilter, setStudentFilter] = useState(
    searchParams.get('student') || '',
  )
  const [typeFilter, setTypeFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [details, setDetails] = useState(null)

  const classes = useMemo(() => tutorClasses(db, user?.id), [db, user?.id])
  const students = useMemo(() => tutorStudents(db, user?.id), [db, user?.id])
  const approved = useMemo(
    () => tutorApprovedLeaves(db, user?.id),
    [db, user?.id],
  )

  const today = todayISO()
  const currentClass = classes.find((classItem) => classItem.id === classFilter)
  const currentStudent = students.find((student) => student.id === studentFilter)

  useEffect(() => {
    setClassFilter(searchParams.get('class') || '')
    setStudentFilter(searchParams.get('student') || '')
  }, [searchParams])

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setSearchParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return approved
      .filter((leave) => {
        if (classFilter && leave.classItem?.id !== classFilter) return false
        if (studentFilter && leave.studentId !== studentFilter) return false
        if (typeFilter && leave.leaveType !== typeFilter) return false
        if (periodFilter === 'upcoming' && leave.toDate < today) return false
        if (periodFilter === 'past' && leave.toDate >= today) return false
        if (!query) return true
        return `${leave.id} ${leave.studentName} ${leave.registerNumber} ${leave.className} ${leave.leaveType} ${leave.reason} ${leave.remarks}`
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => {
        const aUpcoming = a.toDate >= today
        const bUpcoming = b.toDate >= today
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
        if (aUpcoming) return a.fromDate.localeCompare(b.fromDate)
        return b.toDate.localeCompare(a.toDate)
      })
  }, [approved, search, classFilter, studentFilter, typeFilter, periodFilter, today])

  const pagination = usePagination(filtered, 8)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, classFilter, studentFilter, typeFilter, periodFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const upcoming = approved.filter((leave) => leave.toDate >= today).length
  const awayToday = approved.filter(
    (leave) => leave.fromDate <= today && leave.toDate >= today,
  ).length
  const coveredStudents = new Set(approved.map((leave) => leave.studentId)).size

  return (
    <div>
      <PageHeader
        eyebrow="My classroom"
        title="Approved leaves"
        description="Only HOD-approved leave for your assigned classes appears here. Pending, rejected and reopened applications are never exposed to tutors."
        actions={
          <>
            <Button as={Link} to="/tutor/classes" variant="secondary">
              <GraduationCap className="h-4 w-4" />
              My classes
            </Button>
            <Button as={Link} to="/tutor/leave-history">
              <CalendarClock className="h-4 w-4" />
              Leave history
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Approved leaves"
          value={approved.length}
          icon={BadgeCheck}
          tone="green"
          helper="Forwarded by the Head of Department"
        />
        <StatCard
          label="Upcoming / current"
          value={upcoming}
          icon={CalendarDays}
          tone="blue"
          helper="Leave ending today or later"
        />
        <StatCard
          label="Away today"
          value={awayToday}
          icon={CheckCircle2}
          tone="amber"
          helper="Approved absences covering today"
        />
        <StatCard
          label="Students covered"
          value={coveredStudents}
          icon={Users}
          tone="navy"
          helper={`Across ${classes.length} assigned class${classes.length === 1 ? '' : 'es'}`}
        />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search approved leave by student or application ID…"
          />
          <FilterDropdown
            id="tutor-approved-class"
            label="Class"
            value={classFilter}
            onChange={(value) => updateFilters({ class: value })}
            allLabel="All my classes"
            options={classes.map((classItem) => ({
              value: classItem.id,
              label: classItem.title,
            }))}
          />
          <FilterDropdown
            id="tutor-approved-student"
            label="Student"
            value={studentFilter}
            onChange={(value) => updateFilters({ student: value })}
            allLabel="All my students"
            options={students
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((student) => ({
                value: student.id,
                label: `${student.name} · ${student.registerNumber}`,
              }))}
          />
          <FilterDropdown
            id="tutor-approved-type"
            label="Leave type"
            value={typeFilter}
            onChange={setTypeFilter}
            allLabel="All leave types"
            options={LEAVE_TYPES.map((type) => ({
              value: type,
              label: LEAVE_TYPE_SHORT[type] || type,
            }))}
          />
          <FilterDropdown
            id="tutor-approved-period"
            label="Period"
            value={periodFilter}
            onChange={setPeriodFilter}
            allLabel="All dates"
            options={[
              { value: 'upcoming', label: 'Upcoming / current' },
              { value: 'past', label: 'Completed' },
            ]}
          />
        </div>

        {(currentClass || currentStudent) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 bg-navy-50/50 px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-700">
              Deep link filter
            </span>
            {currentClass && (
              <button
                type="button"
                onClick={() => updateFilters({ class: '' })}
                className="inline-flex items-center gap-1 rounded-full border border-navy-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-navy-800 hover:border-navy-300"
              >
                {currentClass.title}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
            {currentStudent && (
              <button
                type="button"
                onClick={() => updateFilters({ student: '' })}
                className="inline-flex items-center gap-1 rounded-full border border-navy-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-navy-800 hover:border-navy-300"
              >
                {currentStudent.name}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <LeaveTable
          leaves={pagination.pageItems}
          onView={setDetails}
          onDownload={download}
          emptyTitle="No approved leave found"
          emptyDescription="Approved applications appear here after the HOD forwards them. Adjust the filters or try another student."
        />

        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onChange={pagination.setPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
        />
      </section>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
        <p className="text-[11.5px] leading-relaxed text-emerald-900">
          Approved leave is visible to you because you coordinate these classes. The
          approved leave letter can be downloaded for attendance and academic planning.
          A parent correction is reviewed by the HOD before it is shared again.
        </p>
      </div>

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
