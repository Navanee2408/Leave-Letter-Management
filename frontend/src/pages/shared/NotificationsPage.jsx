import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import NotificationIcon from '../../components/notifications/NotificationIcon'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import {
  notificationsFor,
  recipientKeyForUser,
} from '../../services/demoStore'
import {
  NOTIFICATIONS_PATH,
  notificationTarget,
} from '../../constants/navigation'
import { NOTIFICATION_META, ROLE_LABELS, ROLES } from '../../constants'
import { formatDateTime, formatTimeAgo } from '../../lib/date'
import { cn } from '../../lib/utils'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { db, markNotificationRead, markAllNotificationsRead } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [readFilter, setReadFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const key = recipientKeyForUser(user)
  const role = user?.role
  const roleLabel = ROLE_LABELS[role] || 'Account'
  const notifications = useMemo(
    () => notificationsFor(db, user),
    [db, user],
  )

  const unreadCount = notifications.filter(
    (notification) => !(notification.readBy || []).includes(key),
  ).length

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return notifications.filter((notification) => {
      const isUnread = !(notification.readBy || []).includes(key)
      if (readFilter === 'unread' && !isUnread) return false
      if (readFilter === 'read' && isUnread) return false
      if (typeFilter && notification.type !== typeFilter) return false
      if (!query) return true
      return `${notification.title} ${notification.message} ${notification.applicationId || ''}`
        .toLowerCase()
        .includes(query)
    })
  }, [notifications, search, readFilter, typeFilter, key])

  const pagination = usePagination(filtered, 8)

  const openNotification = (notification) => {
    markNotificationRead(notification.id, key)
    const leave = db.leaves.find((item) => item.id === notification.applicationId)
    navigate(notificationTarget(role, notification, leave?.status))
  }

  const markAll = () => {
    if (!unreadCount) {
      toast.success('All notifications are already read.')
      return
    }
    markAllNotificationsRead(user)
    toast.success('All notifications marked as read.')
  }

  return (
    <div>
      <PageHeader
        eyebrow={roleLabel}
        title="Notifications"
        description={`Updates relevant to your ${roleLabel.toLowerCase()} account. Notifications are kept in the browser for this demo.`}
        actions={
          <Button variant="secondary" onClick={markAll} disabled={!notifications.length}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Total
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-navy-900">
            {notifications.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Unread
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-maroon-800">
            {unreadCount}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Inbox policy
          </p>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
            {role === ROLES.ADMIN
              ? 'College administration notices and oversight updates.'
              : role === ROLES.HOD
                ? 'New applications and corrections for your department only.'
                : role === ROLES.CLASS_TUTOR
                  ? 'Only approved leave updates are sent to tutors.'
                  : 'Decision and correction updates for your children.'}
          </p>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value)
              pagination.setPage(1)
            }}
            placeholder="Search notifications…"
          />
          <FilterDropdown
            id="notification-read-filter"
            label="Read status"
            value={readFilter}
            onChange={(value) => {
              setReadFilter(value)
              pagination.setPage(1)
            }}
            allLabel="All notifications"
            options={[
              { value: 'unread', label: 'Unread only' },
              { value: 'read', label: 'Read only' },
            ]}
          />
          <FilterDropdown
            id="notification-type-filter"
            label="Notification type"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value)
              pagination.setPage(1)
            }}
            allLabel="All types"
            options={Object.entries(NOTIFICATION_META).map(([value, meta]) => ({
              value,
              label: meta.label,
            }))}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={notifications.length ? 'No matching notifications' : 'No notifications yet'}
            description={notifications.length ? 'Try a different search term or clear the filters.' : 'Leave updates for this account will appear here.'}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {pagination.pageItems.map((notification) => {
              const isUnread = !(notification.readBy || []).includes(key)
              const meta = NOTIFICATION_META[notification.type]
              return (
                <li
                  key={notification.id}
                  className={cn(
                    'flex flex-col gap-3 px-4 py-4 transition sm:flex-row sm:items-start',
                    isUnread ? 'bg-navy-50/35' : 'bg-white',
                  )}
                >
                  <NotificationIcon type={notification.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13.5px] font-semibold text-slate-800">
                        {notification.title}
                      </h3>
                      {meta && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                          {meta.label}
                        </span>
                      )}
                      {isUnread && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-maroon-50 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-maroon-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-maroon-700" />
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {notification.message}
                    </p>
                    <p className="mt-1.5 text-[10.5px] text-slate-400">
                      {formatTimeAgo(notification.createdAt)} ·{' '}
                      {formatDateTime(notification.createdAt)}
                      {notification.applicationId ? ` · ${notification.applicationId}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 sm:flex-col sm:items-end">
                    {isUnread && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          markNotificationRead(notification.id, key)
                          toast.success('Notification marked as read.')
                        }}
                      >
                        <Check className="h-3 w-3" />
                        Mark read
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => openNotification(notification)}
                    >
                      Open
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onChange={pagination.setPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
        />
      </section>

      <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-slate-400">
        <Bell className="h-3 w-3" aria-hidden="true" />
        {NOTIFICATIONS_PATH[role] || '/'} · Simulated notification centre
      </p>
    </div>
  )
}
