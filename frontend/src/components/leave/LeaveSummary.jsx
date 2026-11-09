import { CalendarDays, Clock3, Download, FileText, GraduationCap, Hash, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusBadge from '../ui/StatusBadge'
import Avatar from '../ui/Avatar'
import { formatDate, formatDateTime } from '../../lib/date'
import { LEAVE_TYPE_SHORT } from '../../constants'
import { leaveApi } from '../../services/api'

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 break-words text-[13px] font-medium leading-snug text-slate-700">
          {value}
        </p>
      </div>
    </div>
  )
}

export default function LeaveSummary({
  leave,
  showReason = true,
  showDocument = true,
  showParent = true,
}) {
  if (!leave) return null
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
        <Avatar name={leave.studentName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {leave.studentName}
            </h3>
            <StatusBadge status={leave.status} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {leave.registerNumber} · {leave.department?.code || '—'} · {leave.className}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-maroon-800">
            <Hash className="h-3 w-3" aria-hidden="true" />
            {leave.applicationNumber || leave.id}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Detail
          icon={CalendarDays}
          label="Leave type"
          value={leave.leaveType}
        />
        <Detail
          icon={Clock3}
          label="Duration"
          value={`${leave.duration} day${leave.duration === 1 ? '' : 's'}`}
        />
        <Detail
          icon={CalendarDays}
          label="From date"
          value={formatDate(leave.fromDate)}
        />
        <Detail
          icon={CalendarDays}
          label="To date"
          value={formatDate(leave.toDate)}
        />
        <Detail
          icon={GraduationCap}
          label="Class"
          value={leave.className}
        />
        <Detail
          icon={Clock3}
          label="Submitted"
          value={formatDateTime(leave.submittedAt)}
        />
        {showParent && (
          <Detail
            icon={UserRound}
            label="Parent / guardian"
            value={
              leave.parent
                ? `${leave.parent.name}${leave.parent.phone ? ` · ${leave.parent.phone}` : ''}`
                : '—'
            }
          />
        )}
      </div>

      {showReason && (
        <div className="rounded-lg border border-slate-200 p-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Parent's reason
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">
            {leave.reason}
          </p>
        </div>
      )}

      {showDocument && (leave.document || leave.hasDocument) && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-navy-700 ring-1 ring-slate-200">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700">
              {leave.document?.fileName || leave.document?.name || 'Supporting Document'}
            </p>
            <p className="text-[10.5px] text-slate-400">
              {leave.document?.size ? `${(leave.document.size / 1024).toFixed(0)} KB · ` : ''}
              {LEAVE_TYPE_SHORT[leave.leaveType] || 'Supporting'} document
            </p>
          </div>
          {leave.hasDocument ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  const blob = await leaveApi.getDocumentBlob(leave.id)
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download =
                    leave.document?.fileName ||
                    leave.document?.name ||
                    `Supporting_Doc_${leave.applicationNumber || leave.id}`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch {
                  toast.error('Could not download supporting document')
                }
              }}
              className="inline-flex items-center gap-1 rounded bg-navy-50 hover:bg-navy-100 px-2 py-1 text-[11px] font-semibold text-navy-800 ring-1 ring-navy-200 transition"
              title="Download supporting document"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          ) : (
            <span className="rounded bg-white px-2 py-1 text-[9.5px] font-semibold uppercase tracking-wide text-slate-400 ring-1 ring-slate-200">
              Demo metadata
            </span>
          )}
        </div>
      )}
    </div>
  )
}
