import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BadgeCheck,
  FilePlus2,
  FileText,
  RefreshCcw,
  XCircle,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Pagination from '../../components/ui/Pagination'
import LeaveTable from '../../components/leave/LeaveTable'
import LeaveDetailsModal from '../../components/leave/LeaveDetailsModal'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useLeavePdf } from '../../hooks/useLeavePdf'
import { usePagination } from '../../hooks/usePagination'
import { childrenForParent, leavesForParent } from '../../services/selectors'
import { LEAVE_TYPE_SHORT, LEAVE_TYPES } from '../../constants'

export default function ParentApplications() {
  const { user } = useAuth()
  const { db } = useData()
  const download = useLeavePdf()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [childFilter, setChildFilter] = useState(searchParams.get('child') || '')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [details, setDetails] = useState(null)

  const children = useMemo(
    () => childrenForParent(db, user?.id),
    [db, user?.id],
  )
  const leaves = useMemo(() => leavesForParent(db, user?.id), [db, user?.id])

  useEffect(() => {
    setChildFilter(searchParams.get('child') || '')
  }, [searchParams])

  const updateChild = (value) => {
    setChildFilter(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('child', value)
    else next.delete('child')
    setSearchParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return leaves.filter((leave) => {
      if (childFilter && leave.studentId !== childFilter) return false
      if (statusFilter && leave.status !== statusFilter) return false
      if (typeFilter && leave.leaveType !== typeFilter) return false
      if (!query) return true
      return `${leave.id} ${leave.studentName} ${leave.registerNumber} ${leave.className} ${leave.leaveType} ${leave.reason} ${leave.remarks} ${leave.rejectionReason} ${leave.reopenReason}`
        .toLowerCase()
        .includes(query)
    })
  }, [leaves, search, childFilter, statusFilter, typeFilter])

  const pagination = usePagination(filtered, 8)

  useEffect(() => {
    pagination.setPage(1)
  }, [search, childFilter, statusFilter, typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentChild = children.find((child) => child.id === childFilter)
  const reopened = leaves.filter((leave) => leave.status === 'reopened').length
  const pending = leaves.filter((leave) => leave.status === 'pending').length
  const approved = leaves.filter((leave) => leave.status === 'approved').length
  const rejected = leaves.filter((leave) => leave.status === 'rejected').length

  return (
    <div>
      <PageHeader
        eyebrow="Leave applications"
        title="My applications"
        description="Every leave request submitted for your children, with its decision, HOD reason and download option where approved."
        actions={
          <>
            <Button as={Link} to="/parent/application-status" variant="secondary">
              <FileText className="h-4 w-4" />
              Application status
            </Button>
            <Button as={Link} to="/parent/apply-leave">
              <FilePlus2 className="h-4 w-4" />
              New application
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Pending
          </p>
          <p className="mt-1 font-display text-lg font-bold text-amber-600">{pending}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <RefreshCcw className="h-3 w-3" aria-hidden="true" />
            Reopened
          </p>
          <p className="mt-1 font-display text-lg font-bold text-sky-600">{reopened}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            Approved
          </p>
          <p className="mt-1 font-display text-lg font-bold text-emerald-700">{approved}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <XCircle className="h-3 w-3" aria-hidden="true" />
            Rejected
          </p>
          <p className="mt-1 font-display text-lg font-bold text-rose-600">{rejected}</p>
        </div>
      </div>

      {reopened > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] leading-relaxed text-sky-900">
            <span className="font-semibold">
              {reopened} application{reopened === 1 ? '' : 's'} reopened by the HOD.
            </span>{' '}
            Open the application, read the correction request and resubmit.
          </p>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setStatusFilter('reopened')}
            className="shrink-0"
          >
            Show reopened
          </Button>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by application ID, leave type or reason…"
          />
          <FilterDropdown
            id="parent-applications-child"
            label="Child"
            value={childFilter}
            onChange={updateChild}
            allLabel="All my children"
            options={children.map((child) => ({
              value: child.id,
              label: `${child.name} · ${child.registerNumber}`,
            }))}
          />
          <FilterDropdown
            id="parent-applications-status"
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="All statuses"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'reopened', label: 'Reopened' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <FilterDropdown
            id="parent-applications-type"
            label="Leave type"
            value={typeFilter}
            onChange={setTypeFilter}
            allLabel="All leave types"
            options={LEAVE_TYPES.map((type) => ({
              value: type,
              label: LEAVE_TYPE_SHORT[type] || type,
            }))}
          />
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filtered.length} of {leaves.length} applications
          </span>
        </div>

        {currentChild && (
          <div className="flex flex-col gap-2 border-b border-navy-100 bg-navy-50/50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11.5px] font-medium text-navy-800">
              Showing applications for {currentChild.name} · {currentChild.className}
            </p>
            <button
              type="button"
              onClick={() => updateChild('')}
              className="self-start text-[11px] font-semibold text-navy-700 hover:text-maroon-800 sm:self-auto"
            >
              Clear child filter
            </button>
          </div>
        )}

        <LeaveTable
          leaves={pagination.pageItems}
          onView={setDetails}
          onDownload={download}
          emptyTitle="No matching applications"
          emptyDescription="Try a different search term, child or status. New applications can be submitted from the apply page."
        />

        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onChange={pagination.setPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
        />
      </section>

      <p className="mt-3 text-[10.5px] leading-relaxed text-slate-400">
        Reopened applications can be corrected and resubmitted from their detail page.
        The previous decision is preserved in the application timeline for auditability.
      </p>

      <LeaveDetailsModal
        open={Boolean(details)}
        leave={details}
        onClose={() => setDetails(null)}
        onDownload={download}
        onCorrect={(leave) => {
          setDetails(null)
          navigate(`/parent/application/${leave.id}`)
        }}
        title="My leave application"
      />
    </div>
  )
}
