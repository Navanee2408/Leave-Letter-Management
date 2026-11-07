import { Check, Clock3, RotateCcw, Send, X } from 'lucide-react'
import { formatDateTime } from '../../lib/date'
import { cn } from '../../lib/utils'

const EVENT_STYLE = {
  submitted: {
    icon: Send,
    ring: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
  pending: {
    icon: Clock3,
    ring: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  approved: {
    icon: Check,
    ring: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  rejected: {
    icon: X,
    ring: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  reopened: {
    icon: RotateCcw,
    ring: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
}

export default function LeaveTimeline({ events = [] }) {
  if (!events.length) return null
  return (
    <ol className="relative space-y-4 pl-1">
      {events.map((event, index) => {
        const style = EVENT_STYLE[event.status] || EVENT_STYLE.submitted
        const Icon = style.icon
        return (
          <li key={`${event.label}-${event.at}-${index}`} className="relative flex gap-3">
            {index < events.length - 1 && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%+2px)] w-px bg-slate-200"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1',
                style.ring,
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 pb-1">
              <p className="text-[13px] font-semibold text-slate-800">{event.label}</p>
              <p className="mt-0.5 text-[10.5px] text-slate-400">
                {formatDateTime(event.at)}
                {event.by ? ` · ${event.by}` : ''}
              </p>
              {event.note && (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{event.note}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
