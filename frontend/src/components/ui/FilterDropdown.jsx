import { ChevronDown, ListFilter } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function FilterDropdown({
  label,
  value,
  onChange,
  options,
  allLabel,
  className,
  id,
  icon = true,
}) {
  return (
    <div className={cn('w-full sm:w-auto', className)}>
      {label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <ListFilter
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white py-0 pl-3 pr-9 text-[13px] font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 sm:min-w-[150px]',
            icon && 'pl-8',
          )}
        >
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
