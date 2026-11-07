import {
  CheckCircle2,
  Download,
  FilePenLine,
  FileSearch,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import LeaveSummary from './LeaveSummary'
import LeaveTimeline from './LeaveTimeline'
import { formatDateTime } from '../../lib/date'

export default function LeaveDetailsModal({
  open,
  leave,
  onClose,
  onApprove,
  onReject,
  onReopen,
  onCorrect,
  onDownload,
  title = 'Leave application details',
}) {
  if (!leave) return null

  const canDecide = ['pending', 'reopened'].includes(leave.status)
  const canReopen = ['approved', 'rejected'].includes(leave.status)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={`${leave.id} · Submitted ${formatDateTime(leave.submittedAt)}`}
      icon={FileSearch}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {leave.status === 'approved' && onDownload && (
            <Button variant="outline" onClick={() => onDownload(leave)}>
              <Download className="h-4 w-4" />
              Download letter
            </Button>
          )}
          {leave.status === 'reopened' && onCorrect && (
            <Button variant="outline" onClick={() => onCorrect(leave)}>
              <FilePenLine className="h-4 w-4" />
              Correct &amp; resubmit
            </Button>
          )}
          {canReopen && onReopen && (
            <Button variant="outline" onClick={() => onReopen(leave)}>
              <RotateCcw className="h-4 w-4" />
              Reopen application
            </Button>
          )}
          {canDecide && onReject && (
            <Button
              variant="secondary"
              className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
              onClick={() => onReject(leave)}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          )}
          {canDecide && onApprove && (
            <Button variant="success" onClick={() => onApprove(leave)}>
              <CheckCircle2 className="h-4 w-4" />
              Approve leave
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <LeaveSummary leave={leave} />

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Application timeline
            </h3>
            <div className="mt-3">
              <LeaveTimeline events={leave.history} />
            </div>
          </div>

          {(leave.remarks || leave.rejectionReason || leave.reopenReason) && (
            <div className="space-y-2.5">
              {leave.remarks && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-emerald-700">
                    HOD remarks
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                    {leave.remarks}
                  </p>
                  {leave.decisionAt && (
                    <p className="mt-1.5 text-[10px] text-emerald-700/70">
                      Decided {formatDateTime(leave.decisionAt)}
                    </p>
                  )}
                </div>
              )}
              {leave.rejectionReason && (
                <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-rose-700">
                    Rejection reason
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-rose-900">
                    {leave.rejectionReason}
                  </p>
                </div>
              )}
              {leave.reopenReason && (
                <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-sky-700">
                    Reopened for correction
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
            </div>
          )}

          {leave.previousDecision && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-700">
                Previous decision preserved
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                <span className="font-semibold capitalize">
                  {leave.previousDecision.status}
                </span>
                {leave.previousDecision.note ? ` — ${leave.previousDecision.note}` : ''}
              </p>
              {leave.previousDecision.at && (
                <p className="mt-1.5 text-[10px] text-amber-700/70">
                  {formatDateTime(leave.previousDecision.at)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
