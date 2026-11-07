import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CalendarCheck2,
  FileClock,
  FilePlus2,
  Info,
  ShieldCheck,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LeaveApplicationForm from '../../components/leave/LeaveApplicationForm'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { childrenForParent, leavesForParent } from '../../services/selectors'
import { formatDateRange } from '../../lib/date'

export default function ParentApplyLeave() {
  const { user } = useAuth()
  const { db, submitLeave } = useData()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const children = useMemo(
    () => childrenForParent(db, user?.id),
    [db, user?.id],
  )
  const leaves = useMemo(() => leavesForParent(db, user?.id), [db, user?.id])

  const requestedChild = searchParams.get('child') || ''
  const initialChildId = children.some((child) => child.id === requestedChild)
    ? requestedChild
    : ''

  const handleSubmit = (values) => {
    const conflict = leaves.find(
      (leave) =>
        leave.studentId === values.studentId &&
        ['pending', 'approved', 'reopened'].includes(leave.status) &&
        leave.fromDate <= values.toDate &&
        leave.toDate >= values.fromDate,
    )

    if (conflict) {
      toast.error(
        `${conflict.studentName} already has ${conflict.status} leave covering ${formatDateRange(
          conflict.fromDate,
          conflict.toDate,
        )} (${conflict.id}). Choose different dates or review that application.`,
        { duration: 6500 },
      )
      return
    }

    submitLeave(values)
    toast.success('Leave application submitted for HOD review.')
    navigate('/parent/applications')
  }

  return (
    <div>
      <PageHeader
        eyebrow="My family"
        title="Apply for leave"
        description="Choose your child, the leave type and the exact dates. The HOD will review the request before it reaches the class tutor."
        actions={
          <Button as={Link} to="/parent/applications" variant="secondary">
            <FileClock className="h-4 w-4" />
            My applications
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
            <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[12.5px] font-semibold text-slate-800">
              New leave application
            </p>
            <p className="text-[10.5px] text-slate-400">
              Only linked children can be selected. Dates cannot overlap an active or
              approved request.
            </p>
          </div>
        </div>
        <Link
          to="/parent/children"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 transition hover:text-maroon-800"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          Back to my children
        </Link>
      </div>

      <section className="card p-5 sm:p-6">
        <LeaveApplicationForm
          key={initialChildId || 'new-application'}
          children={children}
          initialValues={{ studentId: initialChildId }}
          onSubmit={handleSubmit}
          submitLabel="Submit for HOD review"
          formId="parent-apply-leave"
          showActions
          onCancel={() => navigate('/parent/dashboard')}
        />
      </section>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
          <FilePlus2 className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" aria-hidden="true" />
          <p className="text-[11.5px] leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">One child per form.</span>{' '}
            Submit a separate application for each child so dates and reasons stay
            accurate.
          </p>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-[11.5px] leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">Uploads stay local.</span>{' '}
            A PDF, JPG or PNG up to 5 MB can be attached, but this demo stores only the
            file metadata in the browser.
          </p>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="text-[11.5px] leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">Approved only reaches tutors.</span>{' '}
            Pending and rejected applications stay between you and the HOD.
          </p>
        </div>
      </div>
    </div>
  )
}
