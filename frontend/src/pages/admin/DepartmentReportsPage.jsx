import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import FilterDropdown from '../../components/ui/FilterDropdown'
import PageHeader from '../../components/ui/PageHeader'
import DepartmentLeaveChart from '../../components/charts/DepartmentLeaveChart'
import LeaveStatusChart from '../../components/charts/LeaveStatusChart'
import LeaveTrendChart from '../../components/charts/LeaveTrendChart'
import Button from '../../components/ui/Button'
import { useData } from '../../hooks/useData'
import { downloadCsv } from '../../lib/csv'
import {
  departmentLeaveStats,
  monthlyLeaveSeries,
  statusDistribution,
} from '../../services/selectors'

export default function DepartmentReportsPage() {
  const { db } = useData()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [departmentId, setDepartmentId] = useState('')
  const departmentStats = useMemo(() => departmentLeaveStats(db), [db])
  const monthlyStats = useMemo(
    () => monthlyLeaveSeries(db, Number(year), departmentId || null),
    [db, year, departmentId],
  )
  const distribution = useMemo(
    () => statusDistribution(db, departmentId || null),
    [db, departmentId],
  )
  const exportRows = [
    ...departmentStats.map((item) => ({
      period: 'Department',
      name: item.code,
      approved: item.approved,
      pending: item.pending,
      reopened: item.reopened,
      rejected: item.rejected,
      total: item.total,
    })),
    ...monthlyStats.map((item) => ({
      period: year,
      name: item.month,
      approved: item.approved,
      pending: item.pending,
      reopened: item.reopened,
      rejected: item.rejected,
      total: item.requests,
    })),
  ]
  const exportColumns = [
    { key: 'period', header: 'Scope' },
    { key: 'name', header: 'Department / month' },
    { key: 'approved', header: 'Approved' },
    { key: 'pending', header: 'Pending' },
    { key: 'reopened', header: 'Reopened' },
    { key: 'rejected', header: 'Rejected' },
    { key: 'total', header: 'Total requests' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="College-wide oversight"
        title="Department reports"
        description="Leave outcomes by department and month. Reopened applications are shown separately from pending requests."
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadCsv(`department-leave-report-${year}.csv`, exportRows, exportColumns)}
          >
            <Download className="h-4 w-4" />
            Export report
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterDropdown
          id="report-department"
          label="Department"
          value={departmentId}
          onChange={setDepartmentId}
          allLabel="All departments"
          options={db.departments.map((department) => ({
            value: department.id,
            label: `${department.code} · ${department.name}`,
          }))}
        />
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600">
          Reporting year
          <select
            aria-label="Reporting year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 outline-none"
          >
            {Array.from({ length: 5 }, (_, index) => currentYear - index).map((optionYear) => (
              <option key={optionYear} value={optionYear}>{optionYear}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-sm font-bold text-navy-900">Department comparison</h2>
          <p className="mt-1 text-[11px] text-slate-500">Applications by current student department.</p>
          <div className="mt-3 h-[310px]">
            <DepartmentLeaveChart data={departmentStats} />
          </div>
        </section>
        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-sm font-bold text-navy-900">Status distribution</h2>
          <p className="mt-1 text-[11px] text-slate-500">{departmentId ? 'Selected department' : 'All departments'}</p>
          <LeaveStatusChart data={distribution} />
        </section>
      </div>

      <section className="card mt-4 p-4 sm:p-5">
        <h2 className="font-display text-sm font-bold text-navy-900">Monthly applications · {year}</h2>
        <div className="mt-3 h-[300px]">
          <LeaveTrendChart data={monthlyStats} />
        </div>
      </section>

      <section className="card mt-4 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3.5">
          <h2 className="font-display text-sm font-bold text-navy-900">Department totals</h2>
        </div>
        <DataTable
          rows={departmentStats}
          columns={[
            { key: 'code', header: 'Department' },
            { key: 'approved', header: 'Approved' },
            { key: 'pending', header: 'Pending' },
            { key: 'reopened', header: 'Reopened' },
            { key: 'rejected', header: 'Rejected' },
            { key: 'total', header: 'Total' },
          ]}
        />
      </section>
    </div>
  )
}