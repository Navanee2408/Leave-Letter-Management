import { STATUS_META, STATUS_TONES } from '../../constants'
import { cn } from '../../lib/utils'

export default function StatusBadge({ status, className, showDot = true }) {
  const meta = STATUS_META[status] || {
    label: status ? String(status) : 'Unknown',
    tone: 'slate',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-semibold leading-none',
        STATUS_TONES[meta.tone] || STATUS_TONES.slate,
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            status === 'pending' && 'bg-amber-500',
            status === 'approved' && 'bg-emerald-500',
            status === 'rejected' && 'bg-rose-500',
            status === 'reopened' && 'bg-sky-500',
            !['pending', 'approved', 'rejected', 'reopened'].includes(status) &&
              'bg-slate-400',
          )}
        />
      )}
      {meta.label}
    </span>
  )
}
