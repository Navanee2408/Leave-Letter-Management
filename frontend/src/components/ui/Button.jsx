import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const VARIANTS = {
  primary:
    'bg-navy-900 text-white shadow-sm hover:bg-navy-800 focus-visible:ring-navy-500',
  accent:
    'bg-maroon-800 text-white shadow-sm hover:bg-maroon-700 focus-visible:ring-maroon-500',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-navy-400',
  outline:
    'border border-navy-200 bg-transparent text-navy-800 hover:bg-navy-50 focus-visible:ring-navy-400',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-400',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-400',
  white:
    'bg-white text-navy-900 shadow-sm hover:bg-navy-50 focus-visible:ring-white',
}

const SIZES = {
  xs: 'h-8 px-2.5 text-xs gap-1.5',
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
}

const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className,
    children,
    type,
    ...props
  },
  ref,
) {
  const isNativeButton = Component === 'button'
  return (
    <Component
      ref={ref}
      type={isNativeButton ? type || 'button' : undefined}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-disabled={!isNativeButton ? disabled || loading || undefined : undefined}
      className={cn(
        'inline-flex select-none items-center rounded-lg font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Component>
  )
})

export default Button
