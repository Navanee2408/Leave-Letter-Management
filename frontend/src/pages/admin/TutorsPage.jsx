import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import CrudPage from '../../components/admin/CrudPage'
import CreatedCredentialsModal from '../../components/admin/CreatedCredentialsModal'
import Avatar from '../../components/ui/Avatar'
import { useData } from '../../hooks/useData'
import {
  classTitle,
  departmentById,
  tutorClasses,
} from '../../services/selectors'
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

export default function TutorsPage() {
  const {
    db,
    addTutor,
    updateTutor,
    deleteTutor,
  } = useData()
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [status, setStatus] = useState('')
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const rows = useMemo(
    () =>
      db.tutors
        .map((tutor) => {
          const classes = tutorClasses(db, tutor.id)
          return {
            ...tutor,
            classes,
            studentCount: classes.reduce(
              (total, classItem) => total + classItem.studentCount,
              0,
            ),
          }
        })
        .filter(
          (tutor) =>
            (!departmentFilter || tutor.departmentId === departmentFilter) &&
            (!status || tutor.status === status),
        ),
    [db, departmentFilter, status],
  )

  const fields = [
    {
      name: 'name',
      label: 'Tutor name',
      required: true,
      placeholder: 'Full name with title',
    },
    {
      label: 'Email address',
      name: 'email',
      type: 'email',
      required: true,
      placeholder: 'tutor@example.com',
    },
    {
      name: 'phone',
      label: 'Phone number',
      required: true,
      placeholder: '+1-202-555-0100',
    },
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      required: true,
      options: (values) =>
        db.departments
          .filter(
            (department) =>
              department.status === 'active' ||
              department.id === values?.departmentId,
          )
          .map((department) => ({
            value: department.id,
            label: `${department.code} · ${department.name}${department.status === 'inactive' ? ' · inactive (existing)' : ''}`,
          })),
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      required: true,
      options: [
        'Class Tutor',
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'Lecturer',
        'Visiting Faculty',
      ].map((designation) => ({
        value: designation,
        label: designation,
      })),
    },
    {
      name: 'status',
      label: 'Account status',
      type: 'select',
      required: true,
      options: ACCOUNT_STATUS_OPTIONS,
    },
    {
      name: 'password',
      label: 'Temporary password',
      type: 'password',
      requiredWhenCreating: true,
      hiddenWhenEditing: true,
      full: true,
      placeholder: 'Enter temporary password (minimum 8 characters)',
      hint: 'Tutor will be required to change this temporary password on first login.',
    },
    {
      name: 'classIds',
      label: 'Assigned classes',
      type: 'checkbox-group',
      full: true,
      columns: 2,
      emptyText: 'Select a department first to view classes in that department.',
      options: (values) =>
        db.classes
          .filter((classItem) => {
            if (values?.classIds?.includes(classItem.id)) return true
            if (!values?.departmentId) return false
            return (
              classItem.departmentId === values.departmentId &&
              classItem.status === 'active'
            )
          })
          .map((classItem) => {
            const tutor = db.tutors.find((item) => item.id === classItem.tutorId)
            return {
              value: classItem.id,
              label: `${classTitle(db, classItem)}${classItem.status === 'inactive' ? ' · inactive (existing)' : ''}`,
              description: tutor
                ? `Currently assigned to ${tutor.name}`
                : 'Unassigned class',
            }
          }),
      hint: 'Only classes from the selected department can be assigned.',
    },
  ]

  const columns = [
    {
      key: 'tutor',
      header: 'Class tutor',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{row.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {row.designation} · {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <div className="min-w-[130px]">
          <p className="text-[12.5px] font-medium text-slate-700">
            {departmentById(db, row.departmentId)?.code || '—'}
          </p>
          <p className="mt-0.5 text-[10.5px] text-slate-400">
            {departmentById(db, row.departmentId)?.name || 'No department'}
          </p>
        </div>
      ),
    },
    {
      key: 'classes',
      header: 'Assigned classes',
      render: (row) =>
        row.classes.length ? (
          <div className="flex flex-wrap gap-1">
            {row.classes.map((classItem) => (
              <span
                key={classItem.id}
                className="inline-flex whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10.5px] font-medium text-slate-600"
              >
                {classItem.label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11.5px] font-medium text-amber-600">
            No classes assigned
          </span>
        ),
    },
    {
      key: 'students',
      header: 'Students',
      render: (row) => (
        <span className="inline-flex min-w-7 justify-center rounded-md bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-slate-600">
          {row.studentCount}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <span className="whitespace-nowrap text-[12px] text-slate-600">
          {row.phone}
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
        title="Class tutors"
        description="Manage faculty accounts, department links, and class assignments. Tutors only receive approved leave updates for their assigned classes."
        entityLabel="Tutor"
        rows={rows}
        columns={columns}
        fields={fields}
        searchText={(row) =>
          `${row.name} ${row.email} ${row.phone} ${row.designation} ${row.classes
            .map((classItem) => classItem.label)
            .join(' ')}`
        }
        searchPlaceholder="Search tutors…"
        filters={[
          {
            id: 'tutor-department-filter',
            label: 'Department',
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: db.departments.map((department) => ({
              value: department.id,
              label: department.code,
            })),
            allLabel: 'All departments',
          },
          {
            id: 'tutor-status-filter',
            label: 'Account status',
            value: status,
            onChange: setStatus,
            options: ACCOUNT_STATUS_OPTIONS,
            allLabel: 'All statuses',
          },
        ]}
        filterKey={`${departmentFilter}-${status}`}
        initialValues={(row) => ({
          name: row?.name || '',
          email: row?.email || '',
          phone: row?.phone || '',
          departmentId: row?.departmentId || '',
          designation: row?.designation || 'Assistant Professor',
          status: row?.status || 'active',
          password: '',
          classIds: row?.classes?.map((classItem) => classItem.id) || [],
        })}
        validate={(values, editing) => {
          const errors = {}
          if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
          ) {
            errors.email = 'Enter a valid email address.'
          }
          if (
            db.tutors.some(
              (tutor) =>
                tutor.id !== editing?.id &&
                tutor.email.toLowerCase() === values.email.trim().toLowerCase(),
            )
          ) {
            errors.email = 'This tutor email is already in use.'
          }
          if (values.phone.trim().replace(/\D/g, '').length < 10) {
            errors.phone = 'Enter a phone number with at least 10 digits.'
          }
          if (!editing?.id && (!values.password || values.password.length < 8)) {
            errors.password = 'Temporary password must be at least 8 characters.'
          }
          const wrongDeptClass = (values.classIds || []).find((classId) => {
            const cls = db.classes.find((item) => item.id === classId)
            return cls && values.departmentId && cls.departmentId !== values.departmentId
          })
          if (wrongDeptClass) {
            errors.classIds =
              'Assigned classes must belong to the selected department.'
          }
          return errors
        }}
        onCreate={async (values) => {
          const filteredClassIds = (values.classIds || []).filter((classId) => {
            const cls = db.classes.find((item) => item.id === classId)
            return cls && cls.departmentId === values.departmentId
          })
          const created = await addTutor({
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            departmentId: values.departmentId,
            designation: values.designation,
            status: values.status,
            password: values.password,
            classIds: filteredClassIds,
          })
          setCreatedCredentials({
            roleLabel: 'Class Tutor',
            name: created?.fullName || created?.name || values.name.trim(),
            email: created?.email || values.email.trim(),
            temporaryPassword: values.password,
          })
        }}
        onUpdate={(id, values) =>
          updateTutor(id, {
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            departmentId: values.departmentId,
            designation: values.designation,
            status: values.status,
            classIds: values.classIds || [],
          })
        }
        onDelete={deleteTutor}
        deleteGuard={(row) => {
          if (row.classes.length) {
            return 'Reassign this tutor’s classes before deleting the tutor record.'
          }
          return null
        }}
        extraActions={
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-500 sm:inline-flex">
            <GraduationCap className="h-3 w-3" aria-hidden="true" />
            {db.tutors.length} tutors
          </span>
        }
        emptyTitle="No class tutors found"
        emptyDescription="Add a tutor, or adjust the department and status filters."
      />
      <CreatedCredentialsModal
        credentials={createdCredentials}
        onClose={() => setCreatedCredentials(null)}
      />
    </>
  )
}
