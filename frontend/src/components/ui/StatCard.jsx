import { cn } from '../../lib/utils'

const TONES = {
  navy: {
    icon: 'bg-navy-50 text-navy-800 ring-navy-100',
    accent: 'bg-navy-800',
  },
  maroon: {
    icon: 'bg-maroon-50 text-maroon-800 ring-maroon-100',
    accent: 'bg-maroon-800',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    accent: 'bg-amber-500',
  },
  green: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    accent: 'bg-emerald-600',
  },
  red: {
    icon: 'bg-rose-50 text-rose-700 ring-rose-100',
    accent: 'bg-rose-600',
  },
  blue: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    accent: 'bg-sky-600',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    accent: 'bg-slate-500',
  },
}

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'navy',
  className,
}) {
  const toneStyles = TONES[tone] || TONES.navy
  return (
    <div className={cn('card group relative overflow-hidden p-5', className)}>
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1 opacity-80',
          toneStyles.accent,
        )}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold leading-none text-navy-900">
            {value}
          </p>
        </div>
        {Icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-105',
              toneStyles.icon,
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
          </span>
        )}
      </div>
      {helper && <p className="mt-3 text-xs leading-relaxed text-slate-500">{helper}</p>}
    </div>
  )
}
