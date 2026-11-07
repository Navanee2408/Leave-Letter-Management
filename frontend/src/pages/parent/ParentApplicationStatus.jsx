import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileClock,
  FilePlus2,
  FileSearch,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useLeavePdf } from '../../hooks/useLeavePdf'
import { usePagination } from '../../hooks/usePagination'
import { childrenForParent, leavesForParent, parentStats } from '../../services/selectors'
import { formatDate, formatDateRange, formatDateTime } from '../../lib/date'
import { cn } from '../../lib/utils'

const STAGES = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'review', label: 'HOD review', icon: FileSearch },
  { key: 'decision', label: 'Decision', icon: CheckCircle2 },
  { key: 'tutor', label: 'Tutor update', icon: BadgeCheck },
]

function stageState(status, index) {
  if (status === 'approved') return 'done'
  if (status === 'rejected') return index < 3 ? 'done' : 'muted'
  if (status === 'reopened') {
    if (index < 2) return 'done'
    if (index === 2) return 'current'
    return 'upcoming'
  }
  if (index === 0) return 'done'
  if (index === 1) return 'current'
  return 'upcoming'
}

function statusNote(leave) {
  if (leave.status === 'pending') {
    return 'The Head of Department has the application in the review queue.'
  }
  if (leave.status === 'reopened') {
    return leave.reopenReason
      ? `Correction requested: ${leave.reopenReason}`
      : 'The HOD requested a correction before a fresh review.'
  }
  if (leave.status === 'approved') {
    return 'Approved leave has been forwarded to the class tutor. The PDF letter is ready.'
  }
  return leave.rejectionReason
    ? `Rejected: ${leave.rejectionReason}`
    : 'Rejected by the HOD. The reason is recorded in the application.'
}

export default function ParentApplicationStatus() {
  const { user } = useAuth()
  const { db } = useData()
  const download = useLeavePdf()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [childFilter, setChildFilter] = useState(searchParams.get('child') || '')
  const [statusFilter, setStatusFilter] = useState('')

  const children = useMemo(
    () => childrenForParent(db, user?.id),
    [db, user?.id],
  )
  const leaves = useMemo(() => leavesForParent(db, user?.id), [db, user?.id])
  const stats = useMemo(() => parentStats(db, user?.id), [db, user?.id])

  useEffect(() => {
    setChildFilter(searchParams.get('child') || '')
  }, [searchParams])

  const updateChild = (value) => {
    setChildFilter(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('child', value)
    else next.delete('child')
    setSearchParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return leaves.filter((leave) => {
      if (childFilter && leave.studentId !== childFilter) return false
      if (statusFilter && leave.status !== statusFilter) return false
      if (!query) return true
      return `${leave.id} ${leave.studentName} ${leave.registerNumber} ${leave.leaveType} ${leave.className}`
        .toLowerCase()
        .includes(query)
    })
  }, [leaves, search, childFilter, statusFilter])

  const pagination = usePagination(filtered, 6)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, childFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader
        eyebrow="Leave applications"
        title="Application status"
        description="Follow each request through submission, HOD review and the final decision. Correction requests appear as soon as the HOD reopens an application."
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

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="All applications"
          value={stats.total}
          icon={FileSearch}
          tone="navy"
          helper="Across your linked children"
        />
        <StatCard
          label="Awaiting HOD"
          value={stats.pending + stats.reopened}
          icon={Clock3}
          tone="amber"
          helper={`${stats.pending} pending · ${stats.reopened} reopened`}
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={BadgeCheck}
          tone="green"
          helper="Letters ready to download"
        />
        <StatCard
          label="Needs correction"
          value={stats.reopened}
          icon={RefreshCcw}
          tone="blue"
          helper="Reopened applications to resubmit"
        />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by application ID or student…"
          />
          <FilterDropdown
            id="parent-status-child"
            label="Child"
            value={childFilter}
            onChange={updateChild}
            allLabel="All my children"
            options={children.map((child) => ({
              value: child.id,
              label: `${child.name} · ${child.registerNumber}`,
            }))}
          />
          <FilterDropdown
            id="parent-status-filter"
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="All statuses"
            options={[
              { value: 'pending', label: 'Pending review' },
              { value: 'reopened', label: 'Reopened for correction' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filtered.length} of {leaves.length} applications
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No matching applications"
            description="Try a different application ID, child or status, or submit a new leave request."
            action={
              <Button as={Link} to="/parent/apply-leave" size="sm">
                Apply for leave
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {pagination.pageItems.map((leave) => {
              const lastUpdate =
                leave.reopenedAt || leave.decisionAt || leave.submittedAt
              return (
                <li key={leave.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar name={leave.studentName} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/parent/application/${leave.id}`}
                            className="font-display text-[14px] font-semibold text-navy-900 hover:text-maroon-800"
                          >
                            {leave.id}
                          </Link>
                          <StatusBadge status={leave.status} />
                        </div>
                        <p className="mt-0.5 truncate text-[12px] font-medium text-slate-700">
                          {leave.studentName} · {leave.leaveType}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formatDateRange(leave.fromDate, leave.toDate)} ·{' '}
                          {leave.duration} day{leave.duration === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 pl-[44px] sm:pl-0">
                      {leave.status === 'approved' && (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => download(leave)}
                        >
                          <Download className="h-3 w-3" />
                          Letter
                        </Button>
                      )}
                      {leave.status === 'reopened' && (
                        <Button
                          as={Link}
                          to={`/parent/application/${leave.id}`}
                          size="xs"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Correct now
                        </Button>
                      )}
                      <Button
                        as={Link}
                        to={`/parent/application/${leave.id}`}
                        size="xs"
                        variant="ghost"
                      >
                        View details
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-1.5 sm:grid-cols-4">
                    {STAGES.map((stage, index) => {
                      const state = stageState(leave.status, index)
                      const Icon = stage.icon
                      return (
                        <div key={stage.key} className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                              state === 'done' && 'bg-emerald-600 text-white',
                              state === 'current' && 'bg-amber-500 text-white',
                              state === 'upcoming' && 'bg-slate-200 text-slate-500',
                              state === 'muted' && 'bg-slate-200 text-slate-500',
                            )}
                          >
                            {state === 'done' ? (
                              <Check className="h-3 w-3" aria-hidden="true" />
                            ) : state === 'muted' ? (
                              <X className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <Icon className="h-3 w-3" aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'truncate text-[10.5px] font-semibold',
                                state === 'upcoming' || state === 'muted'
                                  ? 'text-slate-400'
                                  : 'text-slate-700',
                              )}
                            >
                              {stage.label}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              {state === 'done'
                                ? 'Complete'
                                : state === 'current'
                                  ? 'In progress'
                                  : state === 'muted'
                                    ? 'Not forwarded'
                                    : 'Waiting'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div
                    className={cn(
                      'mt-3 flex flex-col gap-1 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
                      leave.status === 'approved' &&
                        'border-emerald-200 bg-emerald-50/50',
                      leave.status === 'rejected' && 'border-rose-200 bg-rose-50/50',
                      leave.status === 'reopened' && 'border-sky-200 bg-sky-50/50',
                      leave.status === 'pending' && 'border-amber-200 bg-amber-50/50',
                    )}
                  >
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {statusNote(leave)}
                    </p>
                    <p className="shrink-0 text-[10px] text-slate-400">
                      Updated {formatDateTime(lastUpdate)}
                      {leave.decisionAt ? ` · ${formatDate(leave.decisionAt)}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onChange={pagination.setPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
        />
      </section>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-navy-100 bg-navy-50/60 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" aria-hidden="true" />
        <p className="text-[11.5px] leading-relaxed text-navy-800">
          This tracker reflects the latest record in the demo database. Approved leave is
          forwarded to the class tutor; rejected and reopened applications remain private
          to you and the HOD.
        </p>
      </div>
    </div>
  )
}
