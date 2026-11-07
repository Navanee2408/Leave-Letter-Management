import { useEffect, useMemo, useState } from 'react'
import { Download, RotateCcw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import LeaveDetailsModal from '../../components/leave/LeaveDetailsModal'
import LeaveTable from '../../components/leave/LeaveTable'
import Pagination from '../../components/ui/Pagination'
import SearchBar from '../../components/ui/SearchBar'
import { useData } from '../../hooks/useData'
import { usePagination } from '../../hooks/usePagination'
import { downloadCsv } from '../../lib/csv'
import { filterAdminLeaves } from '../../services/selectors'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'reopened', label: 'Reopened' },
]

const EXPORT_COLUMNS = [
  { key: 'id', header: 'Application ID' },
  { value: (leave) => leave.department?.code, header: 'Department' },
  { key: 'studentName', header: 'Student' },
  { key: 'registerNumber', header: 'Register number' },
  { key: 'leaveType', header: 'Leave type' },
  { key: 'fromDate', header: 'From' },
  { key: 'toDate', header: 'To' },
  { key: 'status', header: 'Status' },
  { key: 'decidedBy', header: 'Decision recorded by' },
  { value: (leave) => (leave.history || []).map((event) => `${event.label}: ${event.note || ''}`).join(' | '), header: 'Decision history' },
]

export default function AdminLeaveRequests() {
  const { db } = useData()
  const [query, setQuery] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [details, setDetails] = useState(null)

  const filtered = useMemo(
    () => filterAdminLeaves(db, { query, departmentId, status, fromDate, toDate }),
    [db, query, departmentId, status, fromDate, toDate],
  )
  const pagination = usePagination(filtered, 10)

  useEffect(() => {
    pagination.setPage(1)
  }, [query, departmentId, status, fromDate, toDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setQuery('')
    setDepartmentId('')
    setStatus('')
    setFromDate('')
    setToDate('')
  }

  return (
    <div>
      <PageHeader
        eyebrow="College-wide oversight"
        title="All leave applications"
        description="Inspect department applications and their decision history. HOD decisions are read-only here."
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadCsv('college-leave-applications.csv', filtered, EXPORT_COLUMNS)}
          >
            <Download className="h-4 w-4" />
            Export filtered
          </Button>
        }
      />

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <SearchBar value={query} onChange={setQuery} placeholder="Search student, register number or application…" />
            <FilterDropdown
              id="admin-leave-department"
              label="Department"
              value={departmentId}
              onChange={setDepartmentId}
              allLabel="All departments"
              options={db.departments.map((department) => ({
                value: department.id,
                label: department.code,
              }))}
            />
            <FilterDropdown
              id="admin-leave-status"
              label="Status"
              value={status}
              onChange={setStatus}
              allLabel="All statuses"
              options={STATUS_OPTIONS}
            />
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase text-slate-500">
              From
              <input
                type="date"
                aria-label="Filter leave dates from"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-xs font-normal text-slate-700 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              />
            </label>
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase text-slate-500">
              To
              <input
                type="date"
                aria-label="Filter leave dates to"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-xs font-normal text-slate-700 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              />
            </label>
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <RotateCcw className="h-3.5 w-3.5" />
              Clear filters
            </Button>
            <span className="text-xs text-slate-400 lg:ml-auto">
              {filtered.length} applications
            </span>
          </div>
          {fromDate && toDate && fromDate > toDate && (
            <p className="text-xs text-rose-700" role="alert">The start date must be on or before the end date.</p>
          )}
        </div>

        <LeaveTable
          leaves={pagination.pageItems}
          onView={setDetails}
          emptyTitle="No applications match these filters"
          emptyDescription="Adjust the department, status, student or leave-date range."
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

      <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
        This view does not expose approve, reject or reopen actions. Original HOD remarks, reasons and timeline events are preserved.
      </div>

      <LeaveDetailsModal
        open={Boolean(details)}
        leave={details}
        onClose={() => setDetails(null)}
        title="Leave application record"
      />
    </div>
  )
}