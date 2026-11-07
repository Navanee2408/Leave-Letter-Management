import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileClock,
  GraduationCap,
  RefreshCcw,
  Users,
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
import LeaveTrendChart from '../../components/charts/LeaveTrendChart'
import LeaveStatusChart from '../../components/charts/LeaveStatusChart'
import ApprovalDialog from '../../components/leave/ApprovalDialog'
import RejectionDialog from '../../components/leave/RejectionDialog'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import {
  currentMonthLabel,
  decideLeaves,
  departmentForHod,
  hodStats,
  monthlyLeaveSeries,
  pendingReviewLeaves,
  statusDistribution,
} from '../../services/selectors'
import { formatDate, formatDateRange, formatTimeAgo } from '../../lib/date'

export default function HodDashboard() {
  const { user } = useAuth()
  const { db, approveLeave, rejectLeave } = useData()
  const [approvalTarget, setApprovalTarget] = useState(null)
  const [rejectionTarget, setRejectionTarget] = useState(null)

  const department = useMemo(
    () => departmentForHod(db, user?.id),
    [db, user?.id],
  )
  const departmentId = department?.id || null

  const stats = useMemo(() => hodStats(db, user?.id), [db, user?.id])
  const pending = useMemo(
    () => (departmentId ? pendingReviewLeaves(db, departmentId) : []),
    [db, departmentId],
  )
  const decisions = useMemo(
    () => (departmentId ? decideLeaves(db, departmentId) : []),
    [db, departmentId],
  )
  const trend = useMemo(
    () => monthlyLeaveSeries(db, new Date().getFullYear(), departmentId),
    [db, departmentId],
  )
  const distribution = useMemo(
    () => statusDistribution(db, departmentId),
    [db, departmentId],
  )

  const pendingPreview = pending.slice(0, 5)
  const recentDecisions = decisions.slice(0, 5)

  const handleApprove = (remarks) => {
    if (!approvalTarget) return
    approveLeave(approvalTarget.id, remarks)
    toast.success(`Application ${approvalTarget.id} approved.`)
    setApprovalTarget(null)
  }

  const handleReject = (reason) => {
    if (!rejectionTarget) return
    rejectLeave(rejectionTarget.id, reason)
    toast.success(`Application ${rejectionTarget.id} rejected.`)
    setRejectionTarget(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow={department ? `${department.code} · Head of Department` : 'Head of Department'}
        title={stats.departmentName}
        description={`Signed in as ${stats.hodName}. Review the leave workflow and decision activity for ${currentMonthLabel()}.`}
        actions={
          <>
            <Button as={Link} to="/hod/leave-history" variant="secondary">
              <FileClock className="h-4 w-4" />
              Leave history
            </Button>
            <Button as={Link} to="/hod/leave-requests">
              <Clock3 className="h-4 w-4" />
              Review requests
              {stats.pendingWithReopened > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  {stats.pendingWithReopened}
                </span>
              )}
            </Button>
          </>
        }
      />

      {stats.pendingWithReopened > 0 && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 ring-1 ring-amber-200">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-amber-900">
                {stats.pendingWithReopened} application
                {stats.pendingWithReopened === 1 ? '' : 's'} awaiting a decision
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                {stats.reopened > 0
                  ? `${stats.pending} new and ${stats.reopened} reopened application${stats.reopened === 1 ? '' : 's'} need review in ${stats.departmentCode}.`
                  : 'Approve, reject with a reason, or reopen for correction.'}
              </p>
            </div>
          </div>
          <Button
            as={Link}
            to="/hod/leave-requests"
            size="sm"
            variant="accent"
            className="shrink-0"
          >
            Open review queue
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="mb-5 grid gap-3 rounded-xl border border-navy-100 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Department
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-slate-800">
              {stats.departmentName}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Head of Department
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-slate-800">
              {stats.hodName}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Department students
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-slate-800">
              {stats.students} students · {stats.classes} classes
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
            <UsersRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Faculty & guardians
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-slate-800">
              {stats.tutors} tutors · {stats.parents} parents
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending review"
          value={stats.pendingWithReopened}
          icon={Clock3}
          tone="amber"
          helper={`${stats.reopened} reopened for correction`}
        />
        <StatCard
          label="Approved leaves"
          value={stats.approved}
          icon={BadgeCheck}
          tone="green"
          helper="Approved letters available"
        />
        <StatCard
          label="Rejected leaves"
          value={stats.rejected}
          icon={XCircle}
          tone="red"
          helper="Parent notified with the reason"
        />
        <StatCard
          label="Total applications"
          value={stats.total}
          icon={FileClock}
          tone="navy"
          helper="All applications in this department"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard
          title="Leave requests by month"
          subtitle={`${stats.departmentCode} applications in ${new Date().getFullYear()}`}
          icon={FileClock}
        >
          <LeaveTrendChart data={trend} />
        </SectionCard>
        <SectionCard
          title="Status distribution"
          subtitle="Department applications by current status"
          icon={RefreshCcw}
        >
          <LeaveStatusChart data={distribution} />
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Total applications
              </p>
              <p className="mt-1 font-display text-lg font-bold text-navy-900">
                {stats.total}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Approval rate
              </p>
              <p className="mt-1 font-display text-lg font-bold text-emerald-700">
                {stats.total
                  ? `${Math.round((stats.approved / stats.total) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <SectionCard
          title="Awaiting your decision"
          subtitle="Oldest applications are shown first"
          icon={Clock3}
          actions={
            <Button as={Link} to="/hod/leave-requests" size="sm" variant="ghost">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
          bodyClassName="p-0"
        >
          {pendingPreview.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending applications"
              description="Every submitted application has been reviewed."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingPreview.map((leave) => (
                <li
                  key={leave.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar name={leave.studentName} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/hod/leave-requests"
                          className="truncate text-[13px] font-semibold text-slate-800 hover:text-navy-800"
                        >
                          {leave.studentName}
                        </Link>
                        <StatusBadge status={leave.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {leave.id} · {leave.registerNumber} · {leave.className}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {leave.leaveType} · {formatDateRange(leave.fromDate, leave.toDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pl-[44px] sm:pl-0">
                    <Button
                      size="xs"
                      variant="secondary"
                      className="border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                      onClick={() => setApprovalTarget(leave)}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                      onClick={() => setRejectionTarget(leave)}
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent decisions"
          subtitle="Latest decisions recorded by you"
          icon={BadgeCheck}
          actions={
            <Button as={Link} to="/hod/leave-history" size="sm" variant="ghost">
              History
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
          bodyClassName="p-0"
        >
          {recentDecisions.length === 0 ? (
            <EmptyState
              title="No decisions yet"
              description="Reviewed applications will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentDecisions.map((leave) => (
                <li key={leave.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    {leave.status === 'approved' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : leave.status === 'rejected' ? (
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                    ) : (
                      <RefreshCcw className="h-3.5 w-3.5 text-sky-600" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">
                        {leave.studentName}
                      </p>
                      <StatusBadge status={leave.status} />
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-slate-400">
                      {leave.id} · {formatTimeAgo(leave.decisionAt)}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

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
