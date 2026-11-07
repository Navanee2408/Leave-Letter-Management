import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function LoadingState({
  message = 'Loading portal data…',
  className,
  fullScreen = false,
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 text-sm text-slate-500',
        fullScreen ? 'min-h-screen' : 'min-h-[320px]',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-navy-700" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
