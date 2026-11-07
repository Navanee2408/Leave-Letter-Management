import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  Download,
  Eye,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
  Users,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Pagination from '../../components/ui/Pagination'
import DataTable from '../../components/ui/DataTable'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
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
import { formatDateRange, todayISO } from '../../lib/date'

export default function TutorStudents() {
  const { user } = useAuth()
  const { db } = useData()
  const download = useLeavePdf()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState(searchParams.get('class') || '')
  const [leaveFilter, setLeaveFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)

  const classes = useMemo(() => tutorClasses(db, user?.id), [db, user?.id])
  const students = useMemo(() => tutorStudents(db, user?.id), [db, user?.id])
  const approved = useMemo(
    () => tutorApprovedLeaves(db, user?.id),
    [db, user?.id],
  )

  const today = todayISO()

  const leavesByStudent = useMemo(() => {
    const map = new Map()
    approved.forEach((leave) => {
      const list = map.get(leave.studentId) || []
      list.push(leave)
      map.set(leave.studentId, list)
    })
    return map
  }, [approved])

  const rows = useMemo(() => {
    return students
      .map((student) => {
        const studentLeaves = leavesByStudent.get(student.id) || []
        const active = studentLeaves.filter((leave) => leave.toDate >= today)
        const nextLeave = [...active].sort((a, b) =>
          a.fromDate.localeCompare(b.fromDate),
        )[0]
        return {
          ...student,
          approvedLeaves: studentLeaves,
          approvedCount: studentLeaves.length,
          awayToday: studentLeaves.some(
            (leave) => leave.fromDate <= today && leave.toDate >= today,
          ),
          nextLeave: nextLeave || null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [students, leavesByStudent, today])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((student) => {
      if (classFilter && student.classId !== classFilter) return false
      if (leaveFilter === 'away' && !student.awayToday) return false
      if (leaveFilter === 'upcoming' && !student.nextLeave) return false
      if (leaveFilter === 'approved' && student.approvedCount === 0) return false
      if (leaveFilter === 'none' && student.approvedCount > 0) return false
      if (!query) return true
      return `${student.name} ${student.registerNumber} ${student.department?.name || ''} ${student.className} ${student.parent?.name || ''} ${student.parent?.email || ''} ${student.parent?.phone || ''}`
        .toLowerCase()
        .includes(query)
    })
  }, [rows, search, classFilter, leaveFilter])

  const pagination = usePagination(filtered, 9)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, classFilter, leaveFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setClassFilter(searchParams.get('class') || '')
  }, [searchParams])

  const changeClass = (value) => {
    setClassFilter(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('class', value)
    else next.delete('class')
    setSearchParams(next, { replace: true })
  }

  const selectedLeaves = selected ? leavesByStudent.get(selected.id) || [] : []
  const currentClass = classes.find((classItem) => classItem.id === classFilter)

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (student) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={student.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-800">
              {student.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {student.registerNumber} · {student.department?.code || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (student) => (
        <span className="text-[12px] text-slate-600">{student.className}</span>
      ),
    },
    {
      key: 'parent',
      header: 'Parent / guardian',
      render: (student) => (
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-slate-700">
            {student.parent?.name || 'Not linked'}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] text-slate-400">
            {student.parent?.phone || student.parent?.email || 'No contact on record'}
          </p>
        </div>
      ),
    },
    {
      key: 'approved',
      header: 'Approved leave',
      render: (student) => (
        <div className="flex items-center gap-1.5">
          <BadgeCheck
            className={`h-3.5 w-3.5 ${
              student.approvedCount ? 'text-emerald-600' : 'text-slate-300'
            }`}
            aria-hidden="true"
          />
          <span className="text-[12.5px] font-medium text-slate-700">
            {student.approvedCount}
          </span>
          {student.awayToday && (
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
              Away today
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'upcoming',
      header: 'Next absence',
      render: (student) =>
        student.nextLeave ? (
          <div>
            <p className="whitespace-nowrap text-[12px] font-medium text-slate-700">
              {formatDateRange(student.nextLeave.fromDate, student.nextLeave.toDate)}
            </p>
            <p className="mt-0.5 text-[10.5px] text-slate-400">
              {student.nextLeave.leaveType}
            </p>
          </div>
        ) : (
          <span className="text-[11.5px] text-slate-400">No upcoming leave</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (student) => (
        <Button
          size="xs"
          variant="secondary"
          onClick={() => setSelected(student)}
          aria-label={`View details for ${student.name}`}
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="My classroom"
        title="My students"
        description="Students enrolled in the classes you coordinate. Only HOD-approved leave is reflected in this directory."
        actions={
          <Button as={Link} to="/tutor/classes" variant="secondary">
            <GraduationCap className="h-4 w-4" />
            My classes
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={students.length}
          icon={Users}
          tone="navy"
          helper="Across your assigned classes"
        />
        <StatCard
          label="Away today"
          value={rows.filter((student) => student.awayToday).length}
          icon={CalendarDays}
          tone="amber"
          helper="Covered by approved leave today"
        />
        <StatCard
          label="With approved leave"
          value={rows.filter((student) => student.approvedCount > 0).length}
          icon={BadgeCheck}
          tone="green"
          helper="At least one approved application"
        />
        <StatCard
          label="Assigned classes"
          value={classes.length}
          icon={GraduationCap}
          tone="maroon"
          helper="Class groups under your care"
        />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by student, register number or parent…"
          />
          <FilterDropdown
            id="tutor-students-class"
            label="Class"
            value={classFilter}
            onChange={changeClass}
            allLabel="All my classes"
            options={classes.map((classItem) => ({
              value: classItem.id,
              label: classItem.title,
            }))}
          />
          <FilterDropdown
            id="tutor-students-leave"
            label="Approved leave status"
            value={leaveFilter}
            onChange={setLeaveFilter}
            allLabel="All students"
            options={[
              { value: 'away', label: 'Away today' },
              { value: 'upcoming', label: 'Has upcoming leave' },
              { value: 'approved', label: 'Has approved leave' },
              { value: 'none', label: 'No approved leave' },
            ]}
          />
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filtered.length} of {students.length} students
          </span>
        </div>

        {currentClass && (
          <div className="flex flex-col gap-2 border-b border-navy-100 bg-navy-50/50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11.5px] font-medium text-navy-800">
              Showing {currentClass.title} · {currentClass.studentCount} student
              {currentClass.studentCount === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={() => changeClass('')}
              className="self-start text-[11px] font-semibold text-navy-700 hover:text-maroon-800 sm:self-auto"
            >
              Clear class filter
            </button>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={pagination.pageItems}
          empty={
            <EmptyState
              icon={Users}
              title="No matching students"
              description="Try a different name, register number or clear the class and leave filters."
            />
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

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Student details'}
        description={
          selected
            ? `${selected.registerNumber} · ${selected.className}`
            : undefined
        }
        icon={UserRound}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected && (
              <Button
                as={Link}
                to={`/tutor/approved-leaves?student=${selected.id}`}
                onClick={() => setSelected(null)}
              >
                <BadgeCheck className="h-4 w-4" />
                Approved leave
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
                <p className="mt-1 text-[11px] text-slate-400">{selected.className}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <UserRound className="h-3 w-3" aria-hidden="true" />
                  Parent / guardian
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-slate-700">
                  {selected.parent?.name || 'Not linked'}
                </p>
                {selected.parent?.email && (
                  <a
                    href={`mailto:${selected.parent.email}`}
                    className="mt-1 flex items-center gap-1.5 text-[11.5px] text-navy-700 hover:text-maroon-800"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    {selected.parent.email}
                  </a>
                )}
                {selected.parent?.phone && (
                  <a
                    href={`tel:${selected.parent.phone.replace(/\s+/g, '')}`}
                    className="mt-1 flex items-center gap-1.5 text-[11.5px] text-navy-700 hover:text-maroon-800"
                  >
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    {selected.parent.phone}
                  </a>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <GraduationCap className="h-3 w-3" aria-hidden="true" />
                  Academic record
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-slate-700">
                  {selected.classItem?.academicYear || 'Academic year not set'}
                </p>
                <p className="mt-1 text-[11.5px] text-slate-500">
                  Class tutor: {selected.tutor?.name || 'Unassigned'}
                </p>
                <p className="mt-1 text-[11.5px] text-slate-500">
                  Approved leave records: {selected.approvedCount}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                Approved leave
              </p>
              {selectedLeaves.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                  No approved leave is recorded for this student.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {selectedLeaves.map((leave) => (
                    <li
                      key={leave.id}
                      className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-700">
                          {leave.leaveType}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatDateRange(leave.fromDate, leave.toDate)} · {leave.id}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            setSelected(null)
                            setDetails(leave)
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-navy-700 hover:bg-navy-50"
                          onClick={() => download(leave)}
                          aria-label={`Download approved letter for ${leave.id}`}
                          title="Download approved leave letter"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-[10.5px] leading-relaxed text-slate-400">
              Pending and rejected applications are handled by the HOD and are never
              shown in the class tutor portal.
            </p>
          </div>
        )}
      </Modal>

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
