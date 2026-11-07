import { cn } from '../../lib/utils'

export default function CheckboxGroup({
  label,
  options,
  value = [],
  onChange,
  error,
  hint,
  columns = 2,
  emptyText = 'No options available.',
}) {
  const toggle = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange?.(value.filter((item) => item !== optionValue))
    } else {
      onChange?.([...value, optionValue])
    }
  }

  return (
    <div className="w-full">
      {label && <span className="label">{label}</span>}
      {options.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <div
          className={cn(
            'grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3 scrollbar-thin',
            columns === 1 ? 'grid-cols-1' : 'sm:grid-cols-2',
          )}
        >
          {options.map((option) => {
            const checked = value.includes(option.value)
            return (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-md border bg-white px-3 py-2.5 transition',
                  checked
                    ? 'border-navy-300 ring-1 ring-navy-200'
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-800 accent-navy-800"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-snug text-slate-800">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
