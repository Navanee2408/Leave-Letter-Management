import { cn, initials } from '../../lib/utils'

const PALETTES = [
  'bg-navy-100 text-navy-800',
  'bg-maroon-100 text-maroon-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-800',
  'bg-slate-200 text-slate-700',
]

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
}

function paletteFor(name = '') {
  const index = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
  return PALETTES[index % PALETTES.length]
}

export default function Avatar({
  name = '',
  size = 'md',
  className,
  image,
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-2 ring-white',
        SIZES[size] || SIZES.md,
        paletteFor(name),
        className,
      )}
      aria-hidden={!name ? 'true' : undefined}
      title={name}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name) || '?'
      )}
    </span>
  )
}
