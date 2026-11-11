import { useMemo, useState } from 'react'
import { Building2, Power } from 'lucide-react'
import CrudPage from '../../components/admin/CrudPage'
import { useData } from '../../hooks/useData'
import { ACCOUNT_STATUS_OPTIONS } from '../../constants'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

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

export default function DepartmentsPage() {
  const {
    db,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useData()
  const [status, setStatus] = useState('')
  const [statusTarget, setStatusTarget] = useState(null)

  const rows = useMemo(
    () =>
      db.departments
        .map((department) => {
          const classes = db.classes.filter(
            (classItem) => classItem.departmentId === department.id,
          )
            const classIds = new Set(classes.map((classItem) => classItem.id))
          const students = db.students.filter(
              (student) =>
                student.departmentId === department.id || classIds.has(student.classId),
          )
          const studentIds = new Set(students.map((student) => student.id))
          const leaveCount = db.leaves.filter((leave) =>
            studentIds.has(leave.studentId),
          ).length
          const tutorIds = new Set([
            ...db.tutors
              .filter((tutor) => tutor.departmentId === department.id)
              .map((tutor) => tutor.id),
            ...classes.map((classItem) => classItem.tutorId).filter(Boolean),
          ])
          const tutors = db.tutors.filter((tutor) => tutorIds.has(tutor.id))
          const departmentHods = (db.hods || []).filter(
            (hod) => hod.departmentId === department.id,
          )
          const hod =
            departmentHods.find((item) => item.status === 'active') || null
          return {
            ...department,
            classCount: classes.length,
            studentCount: students.length,
            leaveCount,
            tutorCount: tutors.length,
            hodCount: departmentHods.length,
            hod,
          }
        })
        .filter((department) => !status || department.status === status),
    [db, status],
  )

  const fields = [
    {
      name: 'code',
      label: 'Department code',
      required: true,
      maxLength: 10,
      readOnlyWhenEditing: true,
      placeholder: 'e.g. AIDS, CIVIL',
    },
    {
      name: 'name',
      label: 'Department name',
      required: true,
      full: true,
      placeholder: 'e.g. Computer Science and Engineering',
    },
    {
      name: 'description',
      label: 'Description (optional)',
      type: 'textarea',
      rows: 3,
      maxLength: 300,
      full: true,
      placeholder: 'Add a short department description',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: ACCOUNT_STATUS_OPTIONS,
      disabledWhenEditing: true,
    },
  ]

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => (
        <span className="inline-flex rounded-md border border-navy-200 bg-navy-50 px-2 py-1 font-display text-[11px] font-bold tracking-wide text-navy-800">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Department',
      render: (row) => (
        <div className="max-w-[260px]">
          <p className="font-semibold text-slate-800">{row.name}</p>
              {row.description && (
                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                  {row.description}
                </p>
              )}
          <p className="mt-0.5 text-[11px] text-slate-400">
            {row.classCount} classes · {row.studentCount} students
          </p>
        </div>
      ),
    },
    {
      key: 'hod',
      header: 'Head of Department',
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium text-slate-700">
            {row.hod?.name || 'Not assigned'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {row.hod?.email || 'Assign an HOD from the HOD module'}
          </p>
        </div>
      ),
    },
    {
      key: 'tutors',
      header: 'Tutors',
      render: (row) => (
        <span className="text-[13px] text-slate-600">{row.tutorCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => statusBadge(row.status),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (row) => (
        <Button
          size="xs"
          variant={row.status === 'active' ? 'secondary' : 'success'}
          onClick={() =>
            setStatusTarget({
              ...row,
              nextStatus: row.status === 'active' ? 'inactive' : 'active',
            })
          }
        >
          <Power className="h-3 w-3" />
          {row.status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ]

  return (
    <>
      <CrudPage
      eyebrow="College administration"
      title="Departments"
      description="Maintain academic departments and keep their HOD contact details current."
      entityLabel="Department"
      rows={rows}
      columns={columns}
      fields={fields}
      searchText={(row) => `${row.code} ${row.name} ${row.hod?.name || ''} ${row.hod?.email || ''}`}
      searchPlaceholder="Search departments…"
      filters={[
        {
          id: 'department-status-filter',
          label: 'Department status',
          value: status,
          onChange: setStatus,
          options: ACCOUNT_STATUS_OPTIONS,
          allLabel: 'All statuses',
        },
      ]}
      filterKey={status}
      initialValues={(row) => ({
        code: row?.code || '',
        name: row?.name || '',
        description: row?.description || '',
        status: row?.status || 'active',
      })}
      validate={(values, editing) => {
        const errors = {}
        if (!/^[A-Za-z][A-Za-z0-9]{1,9}$/.test(values.code.trim())) {
          errors.code = 'Use 2–10 letters or numbers for the department code.'
        }
        if (
          db.departments.some(
            (department) =>
              department.id !== editing?.id &&
              department.code.toLowerCase() === values.code.trim().toLowerCase(),
          )
        ) {
          errors.code = 'This department code is already in use.'
        }
        if (
          db.departments.some(
            (department) =>
              department.id !== editing?.id &&
              department.name.trim().toLowerCase() === values.name.trim().toLowerCase(),
          )
        ) {
          errors.name = 'This department name is already in use.'
        }
        return errors
      }}
      onCreate={(values) =>
        addDepartment({
          ...values,
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          description: values.description.trim(),
        })
      }
      onUpdate={(id, values) =>
        updateDepartment(id, {
          ...values,
          name: values.name.trim(),
          description: values.description.trim(),
        })
      }
      onDelete={deleteDepartment}
      deleteGuard={(row) => {
        const linkedCount = row.hodCount
        if (
          linkedCount +
          row.classCount +
          row.studentCount +
          row.tutorCount +
          row.leaveCount
        ) {
          return 'This department has linked records. Deactivate it instead to preserve its HOD, class, tutor, student and leave history.'
        }
        return null
      }}
      extraActions={
        <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-500 sm:inline-flex">
          <Building2 className="h-3 w-3" aria-hidden="true" />
          {db.departments.length} departments
        </span>
      }
      emptyTitle="No departments found"
      emptyDescription="Add a department or clear the status filter."
      />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => {
          updateDepartment(statusTarget.id, { status: statusTarget.nextStatus })
          setStatusTarget(null)
        }}
        title={`${statusTarget?.nextStatus === 'inactive' ? 'Deactivate' : 'Activate'} department?`}
        description={
          statusTarget?.nextStatus === 'inactive' &&
          (statusTarget.hodCount || statusTarget.classCount || statusTarget.tutorCount || statusTarget.studentCount || statusTarget.leaveCount)
            ? `${statusTarget.name} has ${statusTarget.hodCount} HOD accounts, ${statusTarget.classCount} classes, ${statusTarget.tutorCount} tutors, ${statusTarget.studentCount} students and ${statusTarget.leaveCount} leave applications. Deactivation preserves all linked records but blocks new assignments.`
            : `${statusTarget?.name} will be ${statusTarget?.nextStatus}.`
        }
        confirmLabel={statusTarget?.nextStatus === 'inactive' ? 'Deactivate department' : 'Activate department'}
      >
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Existing HOD, class, tutor, student and leave records will not be deleted.
        </p>
      </ConfirmDialog>
    </>
  )
}
