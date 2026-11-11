import { useMemo, useState } from 'react'
import { UsersRound } from 'lucide-react'
import CrudPage from '../../components/admin/CrudPage'
import CreatedCredentialsModal from '../../components/admin/CreatedCredentialsModal'
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
  const [createdCredentials, setCreatedCredentials] = useState(null)

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
      label: 'Parent full name',
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
      placeholder: '+1-202-555-0100',
    },
    {
      name: 'relationship',
      label: 'Relationship',
      type: 'select',
      required: true,
      defaultValue: 'Guardian',
      options: ['Father', 'Mother', 'Guardian'].map((item) => ({
        value: item,
        label: item,
      })),
    },
    {
      name: 'studentId',
      label: 'Linked student',
      type: 'select',
      hiddenWhenEditing: true,
      placeholder: 'Select student (or enter admission number)',
      options: childOptions.map((item) => ({
        value: item.value,
        label: item.label,
      })),
      hint: 'Select an existing student record.',
    },
    {
      name: 'registerNumber',
      label: 'Student admission number',
      hiddenWhenEditing: true,
      placeholder: 'e.g. REG202601',
      hint: 'Required if no student is selected from the dropdown.',
    },
    {
      name: 'status',
      label: 'Account status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: ACCOUNT_STATUS_OPTIONS,
    },
    {
      name: 'password',
      label: 'Temporary password',
      type: 'password',
      requiredWhenCreating: true,
      hiddenWhenEditing: true,
      placeholder: 'Enter temporary password (minimum 8 characters)',
      hint: 'Parent will be required to change this temporary password on first login.',
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
      hidden: (_values, editing) => !editing?.id,
      full: true,
      columns: 2,
      options: childOptions,
      hint: 'Only linked children can be selected by this parent/guardian when submitting leave applications.',
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
    <>
      <CrudPage
        eyebrow="College administration"
        title="Parents & guardians"
        description="Maintain parent/guardian accounts and student links that control who can submit leave applications."
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
          relationship: row?.relationship || 'Guardian',
          studentId: '',
          registerNumber: '',
          status: row?.status || 'active',
          password: '',
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
          if (!editing?.id) {
            if (!values.password || values.password.length < 8) {
              errors.password = 'Temporary password must be at least 8 characters.'
            }
            const hasStudent = Boolean(values.studentId)
            const trimmedReg = (values.registerNumber || '').trim()
            if (!hasStudent && !trimmedReg) {
              errors.registerNumber =
                'Select a linked student or enter the student admission number.'
            } else if (hasStudent && trimmedReg) {
              const selectedStudent = db.students.find(
                (student) => student.id === values.studentId,
              )
              if (
                selectedStudent &&
                selectedStudent.registerNumber.toUpperCase() !==
                  trimmedReg.toUpperCase()
              ) {
                errors.registerNumber =
                  'Admission number does not match the selected student.'
              }
            }
          }
          return errors
        }}
        onCreate={async (values) => {
          const created = await addParent({
            name: values.name.trim(),
            email: values.email.trim(),
            phone: (values.phone || '').trim(),
            relationship: values.relationship || 'Guardian',
            studentId: values.studentId || undefined,
            registerNumber: (values.registerNumber || '').trim() || undefined,
            status: values.status || 'active',
            password: values.password,
            address: (values.address || '').trim(),
          })
          setCreatedCredentials({
            roleLabel: 'Parent / Guardian',
            name: created?.fullName || created?.name || values.name.trim(),
            email: created?.email || values.email.trim(),
            temporaryPassword: values.password,
          })
        }}
        onUpdate={(id, values) =>
          updateParent(id, {
            name: values.name.trim(),
            email: values.email.trim(),
            phone: (values.phone || '').trim(),
            relationship: values.relationship || 'Guardian',
            status: values.status,
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
      <CreatedCredentialsModal
        credentials={createdCredentials}
        onClose={() => setCreatedCredentials(null)}
      />
    </>
  )
}
