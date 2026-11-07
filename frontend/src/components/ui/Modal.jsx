import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  icon: Icon,
  className,
}) {
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => closeOnOverlay && onClose?.()}
        className="absolute inset-0 h-full w-full cursor-default bg-navy-950/50 backdrop-blur-[2px]"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'relative max-h-[92vh] w-full animate-slideUp overflow-hidden rounded-t-2xl bg-white shadow-dropdown sm:rounded-xl',
          SIZES[size] || SIZES.md,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h2
                id="modal-title"
                className="font-display text-base font-semibold text-navy-900 sm:text-lg"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-[13px] leading-relaxed text-slate-500"
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-9rem)] overflow-y-auto px-5 py-5 scrollbar-thin sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
