import {
  BadgeCheck,
  Building2,
  Clock3,
  GraduationCap,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { useData } from '../../hooks/useData'
import { adminStats } from '../../services/selectors'

export default function AdminDashboard() {
  const { db } = useData()
  const stats = adminStats(db)
  const cards = [
    { label: 'Departments', value: stats.departments, icon: Building2, tone: 'navy' },
    { label: 'Heads of department', value: stats.hods, icon: UsersRound, tone: 'maroon' },
    { label: 'Class tutors', value: stats.tutors, icon: GraduationCap, tone: 'blue' },
    { label: 'Students', value: stats.students, icon: Users, tone: 'green' },
    { label: 'Parents', value: stats.parents, icon: UsersRound, tone: 'slate' },
    { label: 'Pending requests', value: stats.pending, icon: Clock3, tone: 'amber' },
    { label: 'Approved requests', value: stats.approved, icon: BadgeCheck, tone: 'green' },
    { label: 'Rejected requests', value: stats.rejected, icon: XCircle, tone: 'red' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="College administration"
        title="Admin dashboard"
        description="College-wide people, department and leave totals."
        actions={
          <>
            <Button as={Link} to="/admin/leave-requests" variant="secondary">
              Leave oversight
            </Button>
            <Button as={Link} to="/admin/reports" variant="outline">
              Department reports
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="College statistics">
        {cards.map((card) => <StatCard key={card.label} {...card} />)}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <h2 className="font-display text-sm font-bold text-navy-900">Administration</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ['Departments', '/admin/departments'],
              ['Heads of Department', '/admin/hods'],
              ['Classes', '/admin/classes'],
              ['Class tutors', '/admin/tutors'],
              ['Students', '/admin/students'],
              ['Parents', '/admin/parents'],
              ['Account status', '/admin/accounts'],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="flex min-h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-navy-300 hover:bg-navy-50"
              >
                {label}
                <span aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="card border-l-4 border-l-navy-800 p-5">
          <h2 className="font-display text-sm font-bold text-navy-900">Leave authority</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            HODs own decisions for their assigned departments. Admin oversight is read-only;
            approvals, rejections and correction history remain unchanged here.
          </p>
          <Link
            to="/admin/leave-requests"
            className="mt-4 inline-flex text-xs font-semibold text-navy-800 hover:text-maroon-800"
          >
            Review all applications
          </Link>
        </div>
      </section>
    </div>
  )
}