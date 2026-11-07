import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

const FormSelect = forwardRef(function FormSelect(
  {
    label,
    name,
    error,
    hint,
    required,
    options = [],
    placeholder,
    children,
    className,
    id,
    ...props
  },
  ref,
) {
  const inputId = id || name
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'input-base appearance-none pr-9',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children ||
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
})

export default FormSelect
