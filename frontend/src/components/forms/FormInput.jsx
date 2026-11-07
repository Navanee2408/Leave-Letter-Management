import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const FormInput = forwardRef(function FormInput(
  {
    label,
    name,
    error,
    hint,
    required,
    leftIcon: LeftIcon,
    rightElement,
    className,
    inputClassName,
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
        {LeftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <LeftIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'input-base',
            LeftIcon && 'pl-9',
            rightElement && 'pr-10',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
            inputClassName,
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </span>
        )}
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

export default FormInput
