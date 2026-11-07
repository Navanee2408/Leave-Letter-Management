import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  BadgeCheck,
  CalendarCheck2,
  GraduationCap,
  History,
  Users,
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
import { tutorApprovedLeaves, tutorClasses } from '../../services/selectors'
import { LEAVE_TYPE_SHORT, LEAVE_TYPES } from '../../constants'
import { formatDate, todayISO } from '../../lib/date'

export default function TutorLeaveHistory() {
  const { user } = useAuth()
  const { db } = useData()
  const download = useLeavePdf()
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('completed')
  const [details, setDetails] = useState(null)

  const classes = useMemo(() => tutorClasses(db, user?.id), [db, user?.id])
  const approved = useMemo(
    () => tutorApprovedLeaves(db, user?.id),
    [db, user?.id],
  )

  const today = todayISO()
  const currentYear = new Date().getFullYear()

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return approved
      .filter((leave) => {
        if (scopeFilter === 'completed' && leave.toDate >= today) return false
        if (classFilter && leave.classItem?.id !== classFilter) return false
        if (typeFilter && leave.leaveType !== typeFilter) return false
        if (!query) return true
        return `${leave.id} ${leave.studentName} ${leave.registerNumber} ${leave.className} ${leave.leaveType} ${leave.reason} ${leave.remarks}`
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => b.toDate.localeCompare(a.toDate))
  }, [approved, search, classFilter, typeFilter, scopeFilter, today])

  const pagination = usePagination(filtered, 8)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, classFilter, typeFilter, scopeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const completed = approved.filter((leave) => leave.toDate < today)
  const coveredStudents = new Set(approved.map((leave) => leave.studentId)).size
  const thisYear = approved.filter((leave) =>
    leave.fromDate.startsWith(String(currentYear)),
  ).length
  const latestDecision = approved.find((leave) => leave.decisionAt)

  return (
    <div>
      <PageHeader
        eyebrow="My classroom"
        title="Leave history"
        description="An approved-only archive for your assigned classes. This record never includes pending, rejected or reopened applications."
        actions={
          <>
            <Button as={Link} to="/tutor/classes" variant="secondary">
              <GraduationCap className="h-4 w-4" />
              My classes
            </Button>
            <Button as={Link} to="/tutor/approved-leaves">
              <BadgeCheck className="h-4 w-4" />
              Approved leaves
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Completed records"
          value={completed.length}
          icon={Archive}
          tone="navy"
          helper="Approved leave that has already ended"
        />
        <StatCard
          label="All approved records"
          value={approved.length}
          icon={History}
          tone="green"
          helper="Entire approved leave archive"
        />
        <StatCard
          label="Students covered"
          value={coveredStudents}
          icon={Users}
          tone="maroon"
          helper="Students with at least one approval"
        />
        <StatCard
          label={`Approvals in ${currentYear}`}
          value={thisYear}
          icon={CalendarCheck2}
          tone="blue"
          helper="Records starting this calendar year"
        />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search archived approvals…"
          />
          <FilterDropdown
            id="tutor-history-scope"
            label="Record scope"
            value={scopeFilter}
            onChange={setScopeFilter}
            allLabel="Completed only"
            options={[{ value: 'all', label: 'All approved records' }]}
          />
          <FilterDropdown
            id="tutor-history-class"
            label="Class"
            value={classFilter}
            onChange={setClassFilter}
            allLabel="All my classes"
            options={classes.map((classItem) => ({
              value: classItem.id,
              label: classItem.title,
            }))}
          />
          <FilterDropdown
            id="tutor-history-type"
            label="Leave type"
            value={typeFilter}
            onChange={setTypeFilter}
            allLabel="All leave types"
            options={LEAVE_TYPES.map((type) => ({
              value: type,
              label: LEAVE_TYPE_SHORT[type] || type,
            }))}
          />
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filtered.length} of {approved.length} approved records
          </span>
        </div>

        <LeaveTable
          leaves={pagination.pageItems}
          onView={setDetails}
          onDownload={download}
          emptyTitle="No archived approvals found"
          emptyDescription={
            scopeFilter === 'completed'
              ? 'Completed approved leave will be archived here. Switch the scope to view current approvals.'
              : 'Approved leave for your classes will appear here after the HOD forwards it.'
          }
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Archive policy
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
            This page is restricted to approved leave for your assigned classes.
            Applications awaiting a decision and rejected applications are handled by
            the HOD and remain outside the tutor portal.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Latest decision on record
          </p>
          {latestDecision ? (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
              {latestDecision.studentName} · {latestDecision.leaveType} · approved on{' '}
              {formatDate(latestDecision.decisionAt)}
            </p>
          ) : (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
              No approved decisions are on record for your classes yet.
            </p>
          )}
        </div>
      </div>

      <LeaveDetailsModal
        open={Boolean(details)}
        leave={details}
        onClose={() => setDetails(null)}
        onDownload={download}
        title="Archived approved leave"
      />
    </div>
  )
}
