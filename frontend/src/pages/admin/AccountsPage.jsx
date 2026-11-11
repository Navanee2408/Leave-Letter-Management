import { useMemo, useState } from 'react'
import { Ban, Check, UserRoundCheck, UserRoundX } from 'lucide-react'
import toast from 'react-hot-toast'
import { getDemoAccounts } from '../../data/demoAuth'
import { ROLE_LABELS, ROLE_VALUES } from '../../constants'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import FilterDropdown from '../../components/ui/FilterDropdown'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'

function accountCollection(db, role) {
  if (role === 'HOD') return db.hods
  if (role === 'CLASS_TUTOR') return db.tutors
  if (role === 'PARENT') return db.parents
  return []
}

export default function AccountsPage() {
  const { user } = useAuth()
  const { db, updateAccountStatus } = useData()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [target, setTarget] = useState(null)

  const accounts = useMemo(
    () =>
      (user?.isBackend
        ? [
            {
              id: user?.id || 'admin-1',
              name: user?.name || 'Administrator',
              email: user?.email || 'admin@example.com',
              role: 'ADMIN',
              status: db.adminStatus || user?.status || 'active',
              department: null,
              childCount: 0,
            },
            ...(db.hods || []).map((h) => ({
              ...h,
              role: 'HOD',
              status: h.status || 'active',
              department: (db.departments || []).find((d) => d.id === h.departmentId),
              childCount: 0,
            })),
            ...(db.tutors || []).map((t) => ({
              ...t,
              role: 'CLASS_TUTOR',
              status: t.status || 'active',
              department: (db.departments || []).find((d) => d.id === t.departmentId),
              childCount: 0,
            })),
            ...(db.parents || []).map((p) => ({
              ...p,
              role: 'PARENT',
              status: p.status || 'active',
              department: null,
              childCount: p.childIds?.length || 0,
            })),
          ]
        : getDemoAccounts(db)).map((credential) => {
        const { password: _password, ...safeCredential } = credential
        const entity =
          credential.role === 'ADMIN'
            ? null
            : accountCollection(db, credential.role).find(
                (record) => record.id === credential.id,
              )
        const account = { ...safeCredential, ...entity }
        return {
          ...account,
          status:
            credential.role === 'ADMIN'
              ? db.adminStatus || credential.status
              : entity?.status || credential.status,
          department: db.departments.find(
            (department) => department.id === account.departmentId,
          ),
          childCount: account.childIds?.length || 0,
        }
      }),
    [db, user],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return accounts.filter((account) => {
      if (roleFilter && account.role !== roleFilter) return false
      if (statusFilter && account.status !== statusFilter) return false
      return (
        !normalizedQuery ||
        `${account.name} ${account.email} ${account.department?.code || ''}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
    })
  }, [accounts, query, roleFilter, statusFilter])

  const columns = [
    {
      key: 'name',
      header: 'Account',
      render: (account) => (
        <div>
          <p className="font-semibold text-slate-800">{account.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{account.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (account) => ROLE_LABELS[account.role],
    },
    {
      key: 'scope',
      header: 'Assignment',
      render: (account) =>
        account.department?.code ||
        (account.role === 'PARENT'
          ? `${account.childCount} linked child${account.childCount === 1 ? '' : 'ren'}`
          : account.role === 'ADMIN'
            ? 'College-wide'
            : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (account) => <StatusBadge status={account.status} />,
    },
    {
      key: 'actions',
      header: 'Access',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (account) => {
        const isCurrentAdmin = account.role === user?.role && account.id === user?.id
        const nextStatus = account.status === 'active' ? 'inactive' : 'active'
        const Icon = nextStatus === 'active' ? UserRoundCheck : UserRoundX
        return (
          <div className="text-right">
            <Button
              size="sm"
              variant={nextStatus === 'active' ? 'success' : 'secondary'}
              disabled={isCurrentAdmin}
              onClick={() => setTarget({ ...account, nextStatus })}
              title={isCurrentAdmin ? 'You cannot deactivate your current account' : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              {nextStatus === 'active' ? 'Activate' : 'Deactivate'}
            </Button>
          </div>
        )
      },
    },
  ]

  const confirmStatusChange = async () => {
    if (!target) return
    try { await updateAccountStatus(target.role, target.id, target.nextStatus) } catch { return }
    toast.success(`${target.name}'s account is ${target.nextStatus}.`)
    setTarget(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="College administration"
        title="Account status"
        description="Search user accounts by role and control portal access. Departments may be left temporarily unassigned."
      />
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar value={query} onChange={setQuery} placeholder="Search name, email or department…" />
          <FilterDropdown
            id="account-role"
            label="Role"
            value={roleFilter}
            onChange={setRoleFilter}
            allLabel="All roles"
            options={ROLE_VALUES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
          />
          <FilterDropdown
            id="account-status"
            label="Account status"
            value={statusFilter}
            onChange={setStatusFilter}
            allLabel="All statuses"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filtered.length} of {accounts.length} accounts
          </span>
        </div>
        <DataTable columns={columns} rows={filtered} empty={<p className="py-8 text-center text-sm text-slate-500">No matching accounts.</p>} />
      </section>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-3 text-[11px] leading-relaxed text-amber-900">
        <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Inactive accounts are denied sign-in and protected portal routes. Existing decision history remains intact.
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirmStatusChange}
        title={`${target?.nextStatus === 'active' ? 'Activate' : 'Deactivate'} account?`}
        description={`${target?.name || 'This account'} will ${target?.nextStatus === 'active' ? 'regain' : 'lose'} access to the portal.`}
        confirmLabel={target?.nextStatus === 'active' ? 'Activate account' : 'Deactivate account'}
      >
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {ROLE_LABELS[target?.role] || 'Account'} · {target?.email}
        </p>
      </ConfirmDialog>
    </div>
  )
}