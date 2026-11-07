const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function toISODate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function parseISODate(value) {
  if (!value) return null
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value, options = {}) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatDateShort(value) {
  return formatDate(value, { year: undefined })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatTimeAgo(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  if (days < 30) return `${Math.floor(days / 7)} wk ago`
  return formatDate(date, { year: undefined })
}

export function daysBetween(from, to) {
  const start = parseISODate(from)
  const end = parseISODate(to)
  if (!start || !end) return 0
  return Math.max(0, Math.round((end - start) / 86400000) + 1)
}

export function isFutureDate(value) {
  const date = parseISODate(value)
  if (!date) return false
  const today = parseISODate(todayISO())
  return date >= today
}

export function isToday(value) {
  return String(value).slice(0, 10) === todayISO()
}

export function monthKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthShort(index) {
  return MONTHS_SHORT[index] || ''
}

export function dateInMonth(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function shiftDate(days, base = new Date()) {
  const date = new Date(base)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function timestampDaysAgo(days, hour = 10, minute = 15) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export function timestampInMonth(monthIndex, day, hour = 11) {
  const date = new Date(new Date().getFullYear(), monthIndex, day, hour, 20, 0)
  return date.toISOString()
}

export function formatDateRange(from, to) {
  if (!from && !to) return '—'
  if (!to || from === to) return formatDate(from)
  return `${formatDate(from)} – ${formatDate(to)}`
}

export { MONTHS_SHORT }
