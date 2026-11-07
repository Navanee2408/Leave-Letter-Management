import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  Clock3,
  RefreshCcw,
  Users,
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
import ApprovalDialog from '../../components/leave/ApprovalDialog'
import RejectionDialog from '../../components/leave/RejectionDialog'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import {
  departmentForHod,
  pendingReviewLeaves,
} from '../../services/selectors'
import { LEAVE_TYPES, LEAVE_TYPE_SHORT } from '../../constants'

export default function HodLeaveRequests() {
  const { user } = useAuth()
  const { db, approveLeave, rejectLeave } = useData()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [details, setDetails] = useState(null)
  const [approvalTarget, setApprovalTarget] = useState(null)
  const [rejectionTarget, setRejectionTarget] = useState(null)

  // The HOD only ever reviews applications from their own department.
  const department = useMemo(
    () => departmentForHod(db, user?.id),
    [db, user?.id],
  )
  const departmentId = department?.id || null

  const pending = useMemo(
    () => (departmentId ? pendingReviewLeaves(db, departmentId) : []),
    [db, departmentId],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return pending.filter((leave) => {
      if (typeFilter && leave.leaveType !== typeFilter) return false
      if (statusFilter && leave.status !== statusFilter) return false
      if (!query) return true
      return `${leave.id} ${leave.studentName} ${leave.registerNumber} ${leave.className} ${leave.leaveType} ${leave.reason} ${leave.parent?.name || ''}`
        .toLowerCase()
        .includes(query)
    })
  }, [pending, search, typeFilter, statusFilter])

  const pagination = usePagination(filtered, 7)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, typeFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = (remarks) => {
    if (!approvalTarget) return
    approveLeave(approvalTarget.id, remarks)
    toast.success(`Application ${approvalTarget.id} approved and forwarded to the tutor.`)
    setApprovalTarget(null)
  }

  const handleReject = (reason) => {
    if (!rejectionTarget) return
    rejectLeave(rejectionTarget.id, reason)
    toast.success(`Application ${rejectionTarget.id} rejected.`)
    setRejectionTarget(null)
  }

  const openApproval = (leave) => {
    setDetails(null)
    setApprovalTarget(leave)
  }

  const openRejection = (leave) => {
    setDetails(null)
    setRejectionTarget(leave)
  }

  const pendingCount = pending.filter((leave) => leave.status === 'pending').length
  const reopenedCount = pending.filter((leave) => leave.status === 'reopened').length
  const studentCount = new Set(pending.map((leave) => leave.studentId)).size

  return (
    <div>
      <PageHeader
        eyebrow={department ? `${department.code} · Leave management` : 'Leave management'}
        title="Leave requests"
        description={`Review new and reopened applications for ${department?.name || 'your department'}. Every rejection needs a reason, and reopening asks the parent for a correction.`}
        actions={
          <Button as={Link} to="/hod/leave-history" variant="secondary">
            <Clock3 className="h-4 w-4" />
            Decision history
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="New requests"
          value={pendingCount}
          icon={Clock3}
          tone="amber"
          helper="Awaiting first review"
        />
        <StatCard
          label="Reopened"
          value={reopenedCount}
          icon={RefreshCcw}
          tone="blue"
          helper="Returned for parent correction"
        />
        <StatCard
          label="Students affected"
          value={studentCount}
          icon={Users}
          tone="navy"
          helper="Distinct students in the review queue"
        />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search queue by student, class or ID…"
          />
          <FilterDropdown
            id="hod-request-type"
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
            id="hod-request-status"
            label="Queue status"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="New & reopened"
            options={[
              { value: 'pending', label: 'New requests' },
              { value: 'reopened', label: 'Reopened only' },
            ]}
          />
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filtered.length} of {pending.length} in queue
          </span>
        </div>

        <LeaveTable
          leaves={pagination.pageItems}
          onView={setDetails}
          onApprove={setApprovalTarget}
          onReject={setRejectionTarget}
          emptyTitle="No applications in this queue"
          emptyDescription="Try clearing the search or filters. New parent submissions appear here automatically."
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

      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="text-[11.5px] leading-relaxed text-slate-500">
            Approving an application makes a PDF leave letter available to the parent
            and sends an approved-leave update to the class tutor. Rejecting never
            notifies the tutor.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10.5px] text-slate-400">
          <XCircle className="h-3 w-3 text-rose-400" aria-hidden="true" />
          Rejection reasons are mandatory
        </div>
      </div>

      <LeaveDetailsModal
        open={Boolean(details)}
        leave={details}
        onClose={() => setDetails(null)}
        onApprove={openApproval}
        onReject={openRejection}
      />
      <ApprovalDialog
        open={Boolean(approvalTarget)}
        leave={approvalTarget}
        onClose={() => setApprovalTarget(null)}
        onConfirm={handleApprove}
      />
      <RejectionDialog
        open={Boolean(rejectionTarget)}
        leave={rejectionTarget}
        onClose={() => setRejectionTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  )
}
