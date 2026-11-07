import { useMemo, useState } from 'react'
import { UsersRound } from 'lucide-react'
import CrudPage from '../../components/admin/CrudPage'
import Avatar from '../../components/ui/Avatar'
import { useData } from '../../hooks/useData'
import { childrenForParent, classTitle } from '../../services/selectors'
import { ACCOUNT_STATUS_OPTIONS } from '../../constants'

const statusBadge = (status) => (
  <span
    className={
      status === 'active'
        ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10.5px] font-semibold text-emerald-700'
        : 'inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10.5px] font-semibold text-slate-500'
    }
  >
    {status === 'active' ? 'Active' : 'Inactive'}
  </span>
)

export default function ParentsPage() {
  const {
    db,
    addParent,
    updateParent,
    deleteParent,
  } = useData()
  const [status, setStatus] = useState('')
  const [childFilter, setChildFilter] = useState('')

  const rows = useMemo(
    () =>
      db.parents
        .map((parent) => {
          const children = childrenForParent(db, parent.id)
          return {
            ...parent,
            children,
            leaveCount: db.leaves.filter((leave) => leave.parentId === parent.id)
              .length,
          }
        })
        .filter((parent) => {
          if (status && parent.status !== status) return false
          if (
            childFilter &&
            !parent.children.some((child) => child.id === childFilter)
          ) {
            return false
          }
          return true
        }),
    [db, status, childFilter],
  )

  const childOptions = useMemo(
    () =>
      db.students.map((student) => {
        const classItem = db.classes.find((item) => item.id === student.classId)
        const currentParent = db.parents.find(
          (parent) => parent.id === student.parentId,
        )
        return {
          value: student.id,
          label: `${student.name} · ${student.registerNumber}`,
          description: `${classItem ? classTitle(db, classItem) : 'No class'}${
            currentParent ? ` · Linked to ${currentParent.name}` : ' · Not linked'
          }`,
        }
      }),
    [db],
  )

  const fields = [
    {
      name: 'name',
      label: 'Parent / guardian name',
      required: true,
      placeholder: 'Full name',
    },
    {
      name: 'email',
      label: 'Email address',
      type: 'email',
      required: true,
      placeholder: 'parent@example.com',
    },
    {
      name: 'phone',
      label: 'Phone number',
      required: true,
      placeholder: '+1-202-555-0100',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: ACCOUNT_STATUS_OPTIONS,
    },
    {
      name: 'address',
      label: 'Postal address',
      type: 'textarea',
      full: true,
      rows: 2,
      maxLength: 300,
      placeholder: 'Street, area, city and PIN code',
    },
    {
      name: 'childIds',
      label: 'Linked children',
      type: 'checkbox-group',
      full: true,
      columns: 2,
      options: childOptions,
      hint: 'Only linked children can be selected by this guardian when applying for leave. Linking a student here moves them from any previous guardian link.',
    },
  ]

  const columns = [
    {
      key: 'parent',
      header: 'Parent / guardian',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{row.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <p className="text-[12.5px] text-slate-600">{row.phone}</p>
          <p className="mt-0.5 max-w-[210px] truncate text-[11px] text-slate-400">
            {row.address || 'No address recorded'}
          </p>
        </div>
      ),
    },
    {
      key: 'children',
      header: 'Linked children',
      render: (row) =>
        row.children.length ? (
          <div className="space-y-1">
            {row.children.map((child) => (
              <div key={child.id} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />
                <span className="whitespace-nowrap text-[12px] font-medium text-slate-700">
                  {child.name}
                </span>
                <span className="whitespace-nowrap text-[10.5px] text-slate-400">
                  {child.registerNumber}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[11.5px] font-medium text-amber-600">
            No children linked
          </span>
        ),
    },
    {
      key: 'leaves',
      header: 'Applications',
      render: (row) => (
        <span className="inline-flex min-w-7 justify-center rounded-md bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-slate-600">
          {row.leaveCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => statusBadge(row.status),
    },
  ]

  return (
    <CrudPage
      eyebrow="College administration"
      title="Parents & guardians"
      description="Maintain guardian contact details and the child links that control who can submit leave applications."
      entityLabel="Parent"
      rows={rows}
      columns={columns}
      fields={fields}
      searchText={(row) =>
        `${row.name} ${row.email} ${row.phone} ${row.children
          .map((child) => `${child.name} ${child.registerNumber}`)
          .join(' ')}`
      }
      searchPlaceholder="Search parents or children…"
      filters={[
        {
          id: 'parent-status-filter',
          label: 'Account status',
          value: status,
          onChange: setStatus,
          options: ACCOUNT_STATUS_OPTIONS,
          allLabel: 'All statuses',
        },
        {
          id: 'parent-child-filter',
          label: 'Linked child',
          value: childFilter,
          onChange: setChildFilter,
          options: db.students.map((student) => ({
            value: student.id,
            label: student.name,
          })),
          allLabel: 'All children',
        },
      ]}
      filterKey={`${status}-${childFilter}`}
      initialValues={(row) => ({
        name: row?.name || '',
        email: row?.email || '',
        phone: row?.phone || '',
        status: row?.status || 'active',
        address: row?.address || '',
        childIds: row?.childIds || [],
      })}
      validate={(values, editing) => {
        const errors = {}
        const email = values.email.trim().toLowerCase()
        if (
          db.parents.some(
            (parent) =>
              parent.id !== editing?.id && parent.email.toLowerCase() === email,
          )
        ) {
          errors.email = 'This parent email is already in use.'
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
          errors.email = 'Enter a valid email address.'
        }
        const clash = (values.childIds || []).find((childId) => {
          const student = db.students.find((item) => item.id === childId)
          if (!student) return false
          if (!student.parentId || student.parentId === editing?.id) return false
          return (
            student.parentId !== editing?.id &&
            db.parents.some(
              (item) =>
                item.id !== editing?.id &&
                (item.childIds || []).includes(student.id),
            )
          )
        })
        if (clash) {
          const student = db.students.find((item) => item.id === clash)
          const owner = db.parents.find(
            (item) => item.id === student?.parentId,
          )
          errors.childIds = `${student?.name || 'This student'} is already linked to ${
            owner?.name || 'another guardian'
          }. Unlink the student from that guardian first.`
        }
        return errors
      }}
      onCreate={(values) =>
        addParent({
          ...values,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: (values.address || '').trim(),
          childIds: values.childIds || [],
        })
      }
      onUpdate={(id, values) =>
        updateParent(id, {
          ...values,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          address: (values.address || '').trim(),
          childIds: values.childIds || [],
        })
      }
      onDelete={deleteParent}
      deleteGuard={(row) => {
        if (row.children.length) {
          return 'Unlink this guardian from their children before deleting the parent record.'
        }
        if (row.leaveCount) {
          return 'This parent has leave applications. Keep the record to preserve application history.'
        }
        return null
      }}
      extraActions={
        <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-500 sm:inline-flex">
          <UsersRound className="h-3 w-3" aria-hidden="true" />
          {db.parents.length} guardians
        </span>
      }
      emptyTitle="No parents found"
      emptyDescription="Add a guardian, or adjust the status and linked-child filters."
    />
  )
}
