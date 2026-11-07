import {
  BellRing,
  CheckCircle2,
  FilePlus2,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const META = {
  new_application: {
    icon: FilePlus2,
    classes: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  leave_approved: {
    icon: CheckCircle2,
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  leave_rejected: {
    icon: XCircle,
    classes: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
  application_reopened: {
    icon: RotateCcw,
    classes: 'bg-sky-50 text-sky-700 ring-sky-100',
  },
  forwarded_to_tutor: {
    icon: Send,
    classes: 'bg-navy-50 text-navy-800 ring-navy-100',
  },
  default: {
    icon: BellRing,
    classes: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
}

export default function NotificationIcon({ type, className }) {
  const meta = META[type] || META.default
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1',
        meta.classes,
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}
