import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  FileClock,
  FilePlus2,
  Files,
  GraduationCap,
  History,
  LayoutDashboard,
  School,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import { ROLES } from './index'

export const ADMIN_NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'College administration',
    items: [
      { to: '/admin/departments', label: 'Departments', icon: Building2 },
      { to: '/admin/hods', label: 'Heads of Department', icon: ShieldCheck },
      { to: '/admin/classes', label: 'Classes', icon: School },
      { to: '/admin/tutors', label: 'Class Tutors', icon: GraduationCap },
      { to: '/admin/students', label: 'Students', icon: Users },
      { to: '/admin/parents', label: 'Parents', icon: UsersRound },
      { to: '/admin/accounts', label: 'Account Status', icon: UserCog },
    ],
  },
  {
    label: 'Leave oversight',
    items: [
      { to: '/admin/leave-requests', label: 'All Leave Requests', icon: FileClock, badgeKey: 'pending' },
      { to: '/admin/reports', label: 'Department Reports', icon: BarChart3 },
      {
        to: '/admin/notifications',
        label: 'Notifications',
        icon: Bell,
        badgeKey: 'notifications',
      },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/admin/profile', label: 'Profile', icon: UserCog }],
  },
]

export const HOD_NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/hod/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Leave management',
    items: [
      {
        to: '/hod/leave-requests',
        label: 'Leave Requests',
        icon: FileClock,
        badgeKey: 'pending',
      },
      { to: '/hod/leave-history', label: 'Leave History', icon: History },
      {
        to: '/hod/notifications',
        label: 'Notifications',
        icon: Bell,
        badgeKey: 'notifications',
      },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/hod/profile', label: 'Profile', icon: UserCog }],
  },
]

export const TUTOR_NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/tutor/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'My classroom',
    items: [
      { to: '/tutor/classes', label: 'My Classes', icon: School },
      { to: '/tutor/students', label: 'My Students', icon: Users },
      {
        to: '/tutor/approved-leaves',
        label: 'Approved Leaves',
        icon: BadgeCheck,
        badgeKey: 'upcoming',
      },
      { to: '/tutor/leave-history', label: 'Leave History', icon: History },
    ],
  },
  {
    label: 'Updates',
    items: [
      {
        to: '/tutor/notifications',
        label: 'Notifications',
        icon: Bell,
        badgeKey: 'notifications',
      },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/tutor/profile', label: 'Profile', icon: UserCog }],
  },
]

export const PARENT_NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/parent/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'My family',
    items: [
      { to: '/parent/children', label: 'My Children', icon: UsersRound },
      { to: '/parent/apply-leave', label: 'Apply for Leave', icon: FilePlus2 },
    ],
  },
  {
    label: 'Leave applications',
    items: [
      { to: '/parent/applications', label: 'My Applications', icon: Files },
      {
        to: '/parent/notifications',
        label: 'Notifications',
        icon: Bell,
        badgeKey: 'notifications',
      },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/parent/profile', label: 'Profile', icon: UserRound }],
  },
]

export const NAV_BY_ROLE = {
  [ROLES.ADMIN]: ADMIN_NAV,
  [ROLES.HOD]: HOD_NAV,
  [ROLES.CLASS_TUTOR]: TUTOR_NAV,
  [ROLES.PARENT]: PARENT_NAV,
}

export const NOTIFICATIONS_PATH = {
  [ROLES.ADMIN]: '/admin/notifications',
  [ROLES.HOD]: '/hod/notifications',
  [ROLES.CLASS_TUTOR]: '/tutor/notifications',
  [ROLES.PARENT]: '/parent/notifications',
}

export function notificationTarget(role, notification, leaveStatus) {
  if (!notification) return NOTIFICATIONS_PATH[role] || '/'
  if (role === ROLES.PARENT) {
    return `/parent/application/${notification.applicationId}`
  }
  if (role === ROLES.CLASS_TUTOR) return '/tutor/approved-leaves'
  if (role === ROLES.ADMIN) {
    if (notification.type === 'administration_notice') {
      return '/admin/notifications'
    }
    return '/admin/leave-requests'
  }
  if (
    notification.type === 'new_application' ||
    notification.type === 'application_reopened'
  ) {
    return '/hod/leave-requests'
  }
  if (
    ['leave_approved', 'leave_rejected', 'forwarded_to_tutor'].includes(
      notification.type,
    )
  ) {
    return '/hod/leave-history'
  }
  if (leaveStatus === 'pending' || leaveStatus === 'reopened') {
    return '/hod/leave-requests'
  }
  return '/hod/leave-history'
}

export const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/departments': 'Departments',
  '/admin/hods': 'Heads of Department',
  '/admin/classes': 'Classes',
  '/admin/tutors': 'Class Tutors',
  '/admin/students': 'Students',
  '/admin/parents': 'Parents',
  '/admin/accounts': 'Account Status',
  '/admin/leave-requests': 'All Leave Requests',
  '/admin/reports': 'Department Reports',
  '/admin/notifications': 'Notifications',
  '/admin/profile': 'Profile',
  '/hod/dashboard': 'Dashboard',
  '/hod/leave-requests': 'Leave Requests',
  '/hod/leave-history': 'Leave History',
  '/hod/notifications': 'Notifications',
  '/hod/profile': 'Profile',
  '/tutor/dashboard': 'Dashboard',
  '/tutor/classes': 'My Classes',
  '/tutor/students': 'My Students',
  '/tutor/approved-leaves': 'Approved Leaves',
  '/tutor/leave-history': 'Leave History',
  '/tutor/notifications': 'Notifications',
  '/tutor/profile': 'Profile',
  '/parent/dashboard': 'Dashboard',
  '/parent/children': 'My Children',
  '/parent/apply-leave': 'Apply for Leave',
  '/parent/applications': 'My Applications',
  '/parent/application-status': 'Application Status',
  '/parent/notifications': 'Notifications',
  '/parent/profile': 'Profile',
}

export { CalendarCheck2 }
