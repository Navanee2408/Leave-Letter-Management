import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, Check, BellOff, ArrowRight } from 'lucide-react'
import { useData } from '../../hooks/useData'
import { useClickOutside } from '../../hooks/useClickOutside'
import {
  notificationsFor,
  recipientKeyForUser,
} from '../../services/demoStore'
import { formatTimeAgo } from '../../lib/date'
import {
  NOTIFICATIONS_PATH,
  notificationTarget,
} from '../../constants/navigation'
import NotificationIcon from './NotificationIcon'
import { cn } from '../../lib/utils'

export default function NotificationPanel({ open, onClose, user }) {
  const ref = useRef(null)
  const navigate = useNavigate()
  const {
    db,
    markNotificationRead,
    markAllNotificationsRead,
  } = useData()

  useClickOutside(ref, onClose, open)

  const notifications = useMemo(
    () =>
      (user?.isBackend ? db.notifications || [] : notificationsFor(db, user)).slice(
        0,
        6,
      ),
    [db, user],
  )
  const unread = useMemo(() => {
    const key = recipientKeyForUser(user)
    const list = user?.isBackend ? db.notifications || [] : notificationsFor(db, user)
    return list.filter((item) => !(item.readBy || []).includes(key)).length
  }, [db, user])

  const openNotification = (notification) => {
    markNotificationRead(notification.id, recipientKeyForUser(user))
    const leave = db.leaves.find(
      (item) => item.id === notification.applicationId,
    )
    navigate(notificationTarget(user.role, notification, leave?.status))
    onClose()
  }

  if (!open) return null

  return (
    <div
      ref={ref}
      className="fixed left-3 right-3 top-[64px] z-50 animate-slideUp overflow-hidden rounded-xl border border-slate-200 bg-white shadow-dropdown sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[390px]"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-navy-900">
            Notifications
          </h3>
          <p className="text-[11px] text-slate-500">
            {unread ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllNotificationsRead(user)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-navy-700 transition hover:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <BellOff className="mb-2 h-6 w-6 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700">No notifications yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Portal updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const isUnread = !(notification.readBy || []).includes(
                recipientKeyForUser(user),
              )
              return (
                <li key={notification.id} className="relative">
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50',
                      isUnread && 'bg-navy-50/40',
                    )}
                  >
                    <NotificationIcon type={notification.type} />
                    <span className="min-w-0 flex-1 pr-5">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-slate-800">
                          {notification.title}
                        </span>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-maroon-700" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-relaxed text-slate-500">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10.5px] font-medium uppercase tracking-wide text-slate-400">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                  {isUnread && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        markNotificationRead(
                          notification.id,
                          recipientKeyForUser(user),
                        )
                      }}
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-white hover:text-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
                      aria-label="Mark notification as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          navigate(NOTIFICATIONS_PATH[user.role])
          onClose()
        }}
        className="flex w-full items-center justify-center gap-1.5 border-t border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-navy-800 transition hover:bg-slate-100"
      >
        View all notifications
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
