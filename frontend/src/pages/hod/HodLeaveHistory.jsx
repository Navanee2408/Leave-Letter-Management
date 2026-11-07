import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BadgeCheck,
  CheckCircle2,
  FileClock,
  RefreshCcw,
  XCircle,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Pagination from '../../components/ui/Pagination'
import LeaveTable from '../../components/leave/LeaveTable'
import LeaveDetailsModal from '../../components/leave/LeaveDetailsModal'
import ReopenDialog from '../../components/leave/ReopenDialog'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import { useLeavePdf } from '../../hooks/useLeavePdf'
import {
  decideLeaves,
  departmentForHod,
} from '../../services/selectors'
import { LEAVE_TYPES, LEAVE_TYPE_SHORT } from '../../constants'

export default function HodLeaveHistory() {
  const { user } = useAuth()
  const { db, reopenLeave } = useData()
  const download = useLeavePdf()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [details, setDetails] = useState(null)
  const [reopenTarget, setReopenTarget] = useState(null)

  const department = useMemo(
    () => departmentForHod(db, user?.id),
    [db, user?.id],
  )
  const departmentId = department?.id || null

  const decided = useMemo(
    () => (departmentId ? decideLeaves(db, departmentId) : []),
    [db, departmentId],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return decided.filter((leave) => {
      if (statusFilter && leave.status !== statusFilter) return false
      if (typeFilter && leave.leaveType !== typeFilter) return false
      if (!query) return true
      return `${leave.id} ${leave.studentName} ${leave.registerNumber} ${leave.className} ${leave.leaveType} ${leave.reason} ${leave.remarks} ${leave.rejectionReason} ${leave.reopenReason}`
        .toLowerCase()
        .includes(query)
    })
  }, [decided, search, statusFilter, typeFilter])

  const pagination = usePagination(filtered, 7)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, statusFilter, typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReopen = (reason) => {
    if (!reopenTarget) return
    reopenLeave(reopenTarget.id, reason)
    toast.success(
      `Application ${reopenTarget.id} reopened. The parent can now correct and resubmit it.`,
    )
    setReopenTarget(null)
  }

  const approved = decided.filter((leave) => leave.status === 'approved').length
  const rejected = decided.filter((leave) => leave.status === 'rejected').length
  const reopened = decided.filter((leave) => leave.status === 'reopened').length

  return (
    <div>
      <PageHeader
        eyebrow={department ? `${department.code} · Leave management` : 'Leave management'}
        title="Leave history"
        description={`Every decision recorded in ${department?.name || 'your department'} with its reason. Approved applications can be downloaded as a PDF; decided applications can be reopened for correction.`}
        actions={
          <Button as={Link} to="/hod/leave-requests" variant="secondary">
            <FileClock className="h-4 w-4" />
            Review queue
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Approved"
          value={approved}
          icon={CheckCircle2}
          tone="green"
          helper="Approved leave letters available"
        />
        <StatCard
          label="Rejected"
          value={rejected}
          icon={XCircle}
          tone="red"
          helper="Parent notified with the reason"
        />
        <StatCard
          label="Reopened"
          value={reopened}
          icon={RefreshCcw}
          tone="blue"
          helper="Waiting for a parent correction"
        />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search decisions by student, ID or reason…"
          />
          <FilterDropdown
            id="hod-history-status"
            label="Decision status"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="All decisions"
            options={[
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'reopened', label: 'Reopened' },
            ]}
          />
          <FilterDropdown
            id="hod-history-type"
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
            {filtered.length} of {decided.length} decisions
          </span>
        </div>

        <LeaveTable
          leaves={pagination.pageItems}
          onView={setDetails}
          onReopen={setReopenTarget}
          onDownload={download}
          emptyTitle="No matching decisions"
          emptyDescription="Decisions appear here after an application is approved, rejected or reopened."
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

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
        <p className="text-[11.5px] leading-relaxed text-sky-900">
          Reopening preserves the previous decision in the application history and
          sends the application back to the parent for correction. Reopened items
          return to the review queue and are not shared with the tutor.
        </p>
      </div>

      <LeaveDetailsModal
        open={Boolean(details)}
        leave={details}
        onClose={() => setDetails(null)}
        onReopen={(leave) => {
          setDetails(null)
          setReopenTarget(leave)
        }}
        onDownload={download}
      />
      <ReopenDialog
        open={Boolean(reopenTarget)}
        leave={reopenTarget}
        onClose={() => setReopenTarget(null)}
        onConfirm={handleReopen}
      />
    </div>
  )
}
