import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const FormTextarea = forwardRef(function FormTextarea(
  {
    label,
    name,
    error,
    hint,
    required,
    rows = 4,
    className,
    maxLength,
    valueLength,
    ...props
  },
  ref,
) {
  const inputId = name
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(
          'input-base resize-y leading-relaxed',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
        )}
        {...props}
      />
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div>
          {error && (
            <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600">
              {error}
            </p>
          )}
          {!error && hint && (
            <p id={`${inputId}-hint`} className="text-xs text-slate-500">
              {hint}
            </p>
          )}
        </div>
        {maxLength && (
          <p className="shrink-0 text-[11px] tabular-nums text-slate-400">
            {valueLength || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
})

export default FormTextarea
