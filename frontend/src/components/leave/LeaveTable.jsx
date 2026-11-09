import {
  CheckCircle2,
  Download,
  Eye,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import DataTable from '../ui/DataTable'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import StatusBadge from '../ui/StatusBadge'
import { formatDate, formatDateRange } from '../../lib/date'
import { LEAVE_TYPE_SHORT } from '../../constants'

export default function LeaveTable({
  leaves,
  onView,
  onApprove,
  onReject,
  onReopen,
  onDownload,
  emptyTitle = 'No leave applications found',
  emptyDescription = 'Try adjusting the search terms or filters.',
}) {
  const columns = [
    {
      key: 'application',
      header: 'Application',
      render: (leave) => (
        <div>
          <p className="font-semibold text-navy-900">{leave.applicationNumber || leave.id}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Submitted {formatDate(leave.submittedAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      render: (leave) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={leave.studentName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-800">
              {leave.studentName}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {leave.registerNumber} · {leave.department?.code || '—'}
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-slate-400">
              {leave.className}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave type',
      render: (leave) => (
        <div>
          <p className="text-[13px] font-medium text-slate-700">{leave.leaveType}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {LEAVE_TYPE_SHORT[leave.leaveType] || 'Leave'} · {leave.duration}{' '}
            day{leave.duration === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Leave dates',
      render: (leave) => (
        <span className="whitespace-nowrap text-[12.5px] text-slate-600">
          {formatDateRange(leave.fromDate, leave.toDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (leave) => <StatusBadge status={leave.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (leave) => (
        <div className="flex items-center justify-end gap-0.5">
          {onView && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onView(leave)}
              aria-label={`View ${leave.id}`}
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDownload && leave.status === 'approved' && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-navy-700 hover:bg-navy-50"
              onClick={() => onDownload(leave)}
              aria-label={`Download approved letter for ${leave.id}`}
              title="Download approved leave letter"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          {onApprove && ['pending', 'reopened'].includes(leave.status) && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => onApprove(leave)}
              aria-label={`Approve ${leave.id}`}
              title="Approve"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onReject && ['pending', 'reopened'].includes(leave.status) && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onReject(leave)}
              aria-label={`Reject ${leave.id}`}
              title="Reject"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          {onReopen && ['approved', 'rejected'].includes(leave.status) && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-sky-600 hover:bg-sky-50 hover:text-sky-700"
              onClick={() => onReopen(leave)}
              aria-label={`Reopen ${leave.id}`}
              title="Reopen for correction"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={leaves}
      empty={
        <div className="py-4 text-center">
          <p className="font-display text-sm font-semibold text-slate-700">{emptyTitle}</p>
          <p className="mt-1 text-xs text-slate-500">{emptyDescription}</p>
        </div>
      }
    />
  )
}
