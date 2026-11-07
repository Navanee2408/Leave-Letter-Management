import { cn } from '../../lib/utils'

export default function SectionCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
  footer,
}) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-50 text-navy-800">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
            <div>
              {title && (
                <h2 className="font-display text-[15px] font-semibold text-navy-900">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
      {footer && (
        <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3">
          {footer}
        </div>
      )}
    </section>
  )
}
