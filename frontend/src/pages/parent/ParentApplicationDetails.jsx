import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FilePenLine,
  FileSearch,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LeaveSummary from '../../components/leave/LeaveSummary'
import LeaveTimeline from '../../components/leave/LeaveTimeline'
import LeaveApplicationForm from '../../components/leave/LeaveApplicationForm'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useLeavePdf } from '../../hooks/useLeavePdf'
import {
  childrenForParent,
  leavesForParent,
} from '../../services/selectors'
import { formatDateTime } from '../../lib/date'
import { cn } from '../../lib/utils'

const PROGRESS = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'review', label: 'HOD review', icon: FileSearch },
  { key: 'decision', label: 'Decision', icon: CheckCircle2 },
  { key: 'tutor', label: 'Tutor informed', icon: BadgeCheck },
]

function progressState(status, index) {
  if (status === 'approved') return 'done'
  if (status === 'rejected') {
    if (index < 3) return 'done'
    return 'muted'
  }
  if (status === 'reopened') {
    if (index < 2) return 'done'
    if (index === 2) return 'current'
    return 'upcoming'
  }
  if (index === 0) return 'done'
  if (index === 1) return 'current'
  return 'upcoming'
}

export default function ParentApplicationDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const { db, resubmitLeave } = useData()
  const download = useLeavePdf()
  const navigate = useNavigate()

  const leaves = useMemo(() => leavesForParent(db, user?.id), [db, user?.id])
  const children = useMemo(
    () => childrenForParent(db, user?.id),
    [db, user?.id],
  )
  const leave = leaves.find(
    (item) =>
      item.id.toLowerCase() === String(id || '').toLowerCase() ||
      (item.applicationNumber &&
        item.applicationNumber.toLowerCase() === String(id || '').toLowerCase()),
  )

  if (!leave) {
    return (
      <div>
        <PageHeader
          eyebrow="Leave applications"
          title="Application not found"
          description="This application does not exist for your guardian account."
          actions={
            <Button as={Link} to="/parent/applications" variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              My applications
            </Button>
          }
        />
        <div className="card">
          <EmptyState
            icon={FileSearch}
            title="No matching application"
            description="The application ID may be incorrect, or the record may belong to another parent account."
            action={
              <Button as={Link} to="/parent/applications">
                Back to my applications
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const canCorrect = leave.status === 'reopened'
  const child = children.find((item) => item.id === leave.studentId)

  const handleResubmit = (values) => {
    resubmitLeave(leave.id, values)
    toast.success(
      `Application ${leave.id} corrected and resubmitted for HOD review.`,
    )
    navigate('/parent/applications')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Leave applications"
        title={leave.id}
        description={`${leave.studentName} · ${leave.className} · submitted ${formatDateTime(leave.submittedAt)}`}
        actions={
          <>
            <Button as={Link} to="/parent/applications" variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              All applications
            </Button>
            {leave.status === 'approved' && (
              <Button onClick={() => download(leave)}>
                <Download className="h-4 w-4" />
                Download letter
              </Button>
            )}
            <Button as={Link} to="/parent/notifications" variant="outline">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
          </>
        }
      />

      {canCorrect && (
        <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 ring-1 ring-sky-200">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-sky-900">
                Correction requested by the HOD
              </p>
              <p className="mt-1 text-xs leading-relaxed text-sky-800">
                {leave.reopenReason || 'The HOD has asked for a correction.'}
              </p>
              <p className="mt-1 text-[10.5px] text-sky-700">
                Update the application below and resubmit. The previous decision is
                preserved in the timeline.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={leave.status} />
            <p className="text-[11.5px] text-slate-500">
              {leave.status === 'pending' && 'Waiting for the Head of Department.'}
              {leave.status === 'reopened' && 'Returned to you for correction.'}
              {leave.status === 'approved' &&
                'Approved by the HOD and shared with the class tutor.'}
              {leave.status === 'rejected' &&
                'Rejected by the HOD. See the recorded reason below.'}
            </p>
          </div>
          {leave.status === 'approved' && (
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Approved leave letter available
            </span>
          )}
        </div>

        <ol className="mt-4 grid gap-2 sm:grid-cols-4">
          {PROGRESS.map((step, index) => {
            const state = progressState(leave.status, index)
            const Icon = step.icon
            return (
              <li
                key={step.key}
                className={cn(
                  'rounded-lg border px-3 py-2.5',
                  state === 'done' && 'border-emerald-200 bg-emerald-50/60',
                  state === 'current' && 'border-amber-200 bg-amber-50/60',
                  state === 'upcoming' && 'border-slate-200 bg-slate-50/50',
                  state === 'muted' && 'border-slate-200 bg-slate-50/50',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-white',
                      state === 'done' && 'bg-emerald-600',
                      state === 'current' && 'bg-amber-500',
                      state === 'upcoming' && 'bg-slate-300',
                      state === 'muted' && 'bg-slate-300',
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
                    <p className="truncate text-[11.5px] font-semibold text-slate-700">
                      {step.label}
                    </p>
                    <p className="text-[9.5px] text-slate-400">
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
              </li>
            )
          })}
        </ol>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-5">
          <SectionCard
            title="Application summary"
            subtitle="Submitted details for this leave request"
            icon={FileSearch}
          >
            <LeaveSummary leave={leave} />
          </SectionCard>

          {canCorrect && (
            <SectionCard
              title="Correct and resubmit"
              subtitle="Update the request using the HOD's correction note"
              icon={FilePenLine}
              bodyClassName="p-5 sm:p-6"
            >
              <LeaveApplicationForm
                key={`${leave.id}-${leave.status}`}
                children={child ? [child] : []}
                initialValues={{
                  studentId: leave.studentId,
                  leaveType: leave.leaveType,
                  fromDate: leave.fromDate,
                  toDate: leave.toDate,
                  reason: leave.reason,
                  document: leave.document,
                }}
                onSubmit={handleResubmit}
                submitLabel="Resubmit corrected application"
                formId={`correct-${leave.id}`}
                onCancel={() => navigate('/parent/applications')}
              />
            </SectionCard>
          )}

          <SectionCard
            title="Application timeline"
            subtitle="Every recorded event for this application"
            icon={Clock3}
          >
            <LeaveTimeline events={leave.history} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            title="Decision record"
            subtitle="HOD outcome and recorded notes"
            icon={CheckCircle2}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Current status
                </span>
                <StatusBadge status={leave.status} />
              </div>
              <div className="text-xs leading-relaxed text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Decision date:</span>{' '}
                  {leave.decisionAt ? formatDateTime(leave.decisionAt) : 'Not decided yet'}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-slate-800">Recorded by:</span>{' '}
                  {leave.decidedBy || 'Pending HOD review'}
                </p>
              </div>

              {leave.remarks && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    HOD remarks
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                    {leave.remarks}
                  </p>
                </div>
              )}

              {leave.rejectionReason && (
                <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                    <XCircle className="h-3 w-3" aria-hidden="true" />
                    Rejection reason
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-rose-900">
                    {leave.rejectionReason}
                  </p>
                </div>
              )}

              {leave.reopenReason && (
                <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Correction request
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-sky-900">
                    {leave.reopenReason}
                  </p>
                  {leave.reopenedAt && (
                    <p className="mt-1.5 text-[10px] text-sky-700/70">
                      Reopened {formatDateTime(leave.reopenedAt)}
                    </p>
                  )}
                </div>
              )}

              {['pending', 'reopened'].includes(leave.status) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Next step
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-900">
                    {leave.status === 'reopened'
                      ? 'Correct the application and resubmit it for a fresh HOD review.'
                      : 'The Head of Department will approve, reject or request a correction.'}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {leave.previousDecision && (
            <SectionCard
              title="Previous decision preserved"
              subtitle="Retained for an auditable correction trail"
              icon={Clock3}
            >
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold capitalize text-slate-800">
                  {leave.previousDecision.status}
                </span>
                {leave.previousDecision.note
                  ? ` — ${leave.previousDecision.note}`
                  : ''}
              </p>
              {leave.previousDecision.at && (
                <p className="mt-1.5 text-[10.5px] text-slate-400">
                  {formatDateTime(leave.previousDecision.at)}
                  {leave.previousDecision.by
                    ? ` · ${leave.previousDecision.by}`
                    : ''}
                </p>
              )}
            </SectionCard>
          )}

          <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-navy-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Who can see this?
            </p>
            <ul className="mt-2.5 space-y-2 text-[11.5px] leading-relaxed text-navy-800">
              <li>You and the Head of Department can view this application.</li>
              <li>
                The class tutor sees the approved leave only after the HOD forwards it.
              </li>
              <li>
                Reopened or rejected applications are never shared with the class tutor.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
