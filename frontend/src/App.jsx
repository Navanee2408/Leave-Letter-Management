import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute, {
  PasswordChangeRoute,
} from './components/routing/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import { ROLES } from './constants'

import LandingPage from './pages/public/LandingPage'
import NotFoundPage from './pages/public/NotFoundPage'
import LoginChooserPage from './pages/auth/LoginChooserPage'
import LoginPage from './pages/auth/LoginPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'

import HodDashboard from './pages/hod/HodDashboard'
import HodLeaveRequests from './pages/hod/HodLeaveRequests'
import HodLeaveHistory from './pages/hod/HodLeaveHistory'

import DepartmentsPage from './pages/admin/DepartmentsPage'
import ClassesPage from './pages/admin/ClassesPage'
import StudentsPage from './pages/admin/StudentsPage'
import ParentsPage from './pages/admin/ParentsPage'
import TutorsPage from './pages/admin/TutorsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import HodsPage from './pages/admin/HodsPage'
import AccountsPage from './pages/admin/AccountsPage'
import AdminLeaveRequests from './pages/admin/AdminLeaveRequests'
import DepartmentReportsPage from './pages/admin/DepartmentReportsPage'

import TutorDashboard from './pages/tutor/TutorDashboard'
import TutorClasses from './pages/tutor/TutorClasses'
import TutorStudents from './pages/tutor/TutorStudents'
import TutorApprovedLeaves from './pages/tutor/TutorApprovedLeaves'
import TutorLeaveHistory from './pages/tutor/TutorLeaveHistory'

import ParentDashboard from './pages/parent/ParentDashboard'
import ParentChildren from './pages/parent/ParentChildren'
import ParentApplyLeave from './pages/parent/ParentApplyLeave'
import ParentApplications from './pages/parent/ParentApplications'
import ParentApplicationDetails from './pages/parent/ParentApplicationDetails'
import ParentApplicationStatus from './pages/parent/ParentApplicationStatus'

import NotificationsPage from './pages/shared/NotificationsPage'
import ProfilePage from './pages/shared/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginChooserPage />} />
      <Route path="/login/hod" element={<LoginPage role="hod" />} />
      <Route path="/login/tutor" element={<LoginPage role="tutor" />} />
      <Route path="/login/parent" element={<LoginPage role="parent" />} />
      <Route path="/admin/login" element={<LoginPage role="admin" />} />

      <Route element={<PasswordChangeRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute role={ROLES.ADMIN} />}>
        <Route element={<DashboardLayout role={ROLES.ADMIN} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="hods" element={<HodsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="tutors" element={<TutorsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="leave-requests" element={<AdminLeaveRequests />} />
          <Route path="reports" element={<DepartmentReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage role={ROLES.ADMIN} />} />
        </Route>
      </Route>

      <Route path="/hod" element={<ProtectedRoute role={ROLES.HOD} />}>
        <Route element={<DashboardLayout role={ROLES.HOD} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<HodDashboard />} />
          <Route path="leave-requests" element={<HodLeaveRequests />} />
          <Route path="leave-history" element={<HodLeaveHistory />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage role={ROLES.HOD} />} />
        </Route>
      </Route>

      <Route path="/tutor" element={<ProtectedRoute role={ROLES.CLASS_TUTOR} />}>
        <Route element={<DashboardLayout role={ROLES.CLASS_TUTOR} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TutorDashboard />} />
          <Route path="classes" element={<TutorClasses />} />
          <Route path="students" element={<TutorStudents />} />
          <Route path="approved-leaves" element={<TutorApprovedLeaves />} />
          <Route path="leave-history" element={<TutorLeaveHistory />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage role={ROLES.CLASS_TUTOR} />} />
        </Route>
      </Route>

      <Route path="/parent" element={<ProtectedRoute role={ROLES.PARENT} />}>
        <Route element={<DashboardLayout role={ROLES.PARENT} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="children" element={<ParentChildren />} />
          <Route path="apply-leave" element={<ParentApplyLeave />} />
          <Route path="applications" element={<ParentApplications />} />
          <Route path="application/:id" element={<ParentApplicationDetails />} />
          <Route path="application-status" element={<ParentApplicationStatus />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage role={ROLES.PARENT} />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
