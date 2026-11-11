import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import CrudPage from '../../components/admin/CrudPage'
import Avatar from '../../components/ui/Avatar'
import { useData } from '../../hooks/useData'
import { classTitle, getStudentProfile } from '../../services/selectors'
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

export default function StudentsPage() {
  const {
    db,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useData()
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(
    () =>
      db.students
        .map((student) => ({
          ...getStudentProfile(db, student),
          leaveCount: db.leaves.filter((leave) => leave.studentId === student.id).length,
        }))
        .filter(
          (student) =>
            (!departmentFilter || student.departmentId === departmentFilter) &&
            (!classFilter || student.classId === classFilter) &&
            (!status || student.status === status),
        ),
    [db, departmentFilter, classFilter, status],
  )

  const classOptions = useMemo(
    () =>
      db.classes
        .filter(
          (classItem) =>
            (!departmentFilter || classItem.departmentId === departmentFilter) &&
            (classItem.status === 'active' ||
              db.students.some((student) => student.classId === classItem.id)),
        )
        .map((classItem) => ({
          value: classItem.id,
          label: classTitle(db, classItem),
        })),
    [db, departmentFilter],
  )

  const fields = [
    {
      name: 'name',
      label: 'Student name',
      required: true,
      placeholder: 'Full name as in college records',
    },
    {
      name: 'registerNumber',
      label: 'Register number',
      required: true,
      placeholder: 'e.g. REG202601',
      maxLength: 16,
    },
    {
      name: 'email',
      label: 'Student email',
      type: 'email',
      required: true,
      placeholder: 'student01@example.com',
    },
    {
      name: 'phone',
      label: 'Phone number',
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
      name: 'classId',
      label: 'Class',
      type: 'select',
      required: true,
      options: (values) =>
        db.classes
          .filter(
            (classItem) =>
              classItem.departmentId === values?.departmentId &&
              ((classItem.status === 'active' &&
                db.departments.some(
                  (department) =>
                    department.id === classItem.departmentId &&
                    department.status === 'active',
                )) ||
                classItem.id === values?.classId),
          )
          .map((classItem) => ({
            value: classItem.id,
            label: `${classTitle(db, classItem)}${classItem.status === 'inactive' ? ' · inactive (existing)' : ''}`,
          })),
      dependsOn: 'departmentId',
      resetWhen: (currentValues, nextDepartmentId) =>
        Boolean(currentValues.classId) &&
        !db.classes.some(
          (classItem) =>
            classItem.id === currentValues.classId &&
            classItem.departmentId === nextDepartmentId,
        ),
    },
    {
      name: 'parentId',
      label: 'Linked parent / guardian (optional)',
      type: 'select',
      placeholder: 'No parent linked (you can link later)',
      options: db.parents.map((parent) => ({
        value: parent.id,
        label: `${parent.name} · ${parent.email}`,
      })),
      hint: 'Optional. You can link this record later by editing the student or parent.',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: ACCOUNT_STATUS_OPTIONS,
    },
  ]

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{row.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{row.registerNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (row) => (
        <div className="min-w-[150px]">
          <p className="text-[12.5px] font-medium text-slate-700">{row.className}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {row.department?.name || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Parent / guardian',
      render: (row) =>
        row.parent ? (
          <div>
            <p className="text-[12.5px] font-medium text-slate-700">{row.parent.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{row.parent.phone}</p>
          </div>
        ) : (
          <span className="text-[11.5px] font-medium text-amber-600">Not linked</span>
        ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <p className="text-[12px] text-slate-600">{row.email}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'leaves',
      header: 'Leaves',
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
      title="Students"
      description="Manage student records, class placements and the parent link used by the leave application workflow."
      entityLabel="Student"
      rows={rows}
      columns={columns}
      fields={fields}
      searchText={(row) =>
        `${row.name} ${row.registerNumber} ${row.email} ${row.className} ${row.parent?.name || ''}`
      }
      searchPlaceholder="Search students…"
      filters={[
        {
          id: 'student-department-filter',
          label: 'Department',
          value: departmentFilter,
          onChange: (value) => {
            setDepartmentFilter(value)
            setClassFilter('')
          },
          options: db.departments.map((department) => ({
            value: department.id,
            label: `${department.code}${department.status === 'inactive' ? ' · inactive' : ''}`,
          })),
          allLabel: 'All departments',
        },
        {
          id: 'student-class-filter',
          label: 'Class',
          value: classFilter,
          onChange: setClassFilter,
          options: classOptions,
          allLabel: 'All classes',
        },
        {
          id: 'student-status-filter',
          label: 'Student status',
          value: status,
          onChange: setStatus,
          options: ACCOUNT_STATUS_OPTIONS,
          allLabel: 'All statuses',
        },
      ]}
      filterKey={`${departmentFilter}-${classFilter}-${status}`}
      initialValues={(row) => ({
        name: row?.name || '',
        registerNumber: row?.registerNumber || '',
        email: row?.email || '',
        phone: row?.phone || '',
        departmentId: row?.departmentId || '',
        classId: row?.classId || '',
        parentId: row?.parentId || '',
        status: row?.status || 'active',
      })}
      validate={(values, editing) => {
        const errors = {}
        const department = db.departments.find(
          (item) => item.id === values.departmentId,
        )
        const classItem = db.classes.find((item) => item.id === values.classId)
        const original = db.students.find((student) => student.id === editing?.id)
        const isMoving =
          !original ||
          original.departmentId !== values.departmentId ||
          original.classId !== values.classId
        if (!classItem || classItem.departmentId !== values.departmentId) {
          errors.classId = 'Choose a class belonging to the selected department.'
        } else if (
          isMoving &&
          (department?.status !== 'active' || classItem.status !== 'active')
        ) {
          errors.classId = 'New students must be assigned to an active department and class.'
        }
        if (
          db.students.some(
            (student) =>
              student.id !== editing?.id &&
              student.registerNumber.toLowerCase() ===
                values.registerNumber.trim().toLowerCase(),
          )
        ) {
          errors.registerNumber = 'This register number is already in use.'
        }
        if (
          db.students.some(
            (student) =>
              student.id !== editing?.id &&
              student.email.toLowerCase() === values.email.trim().toLowerCase(),
          )
        ) {
          errors.email = 'This student email is already in use.'
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
          errors.email = 'Enter a valid student email address.'
        }
        if (
          values.parentId &&
          !db.parents.some((parent) => parent.id === values.parentId)
        ) {
          errors.parentId = 'Select a valid parent or guardian.'
        }
        return errors
      }}
      onCreate={(values) =>
        addStudent({
          ...values,
          name: values.name.trim(),
          registerNumber: values.registerNumber.trim().toUpperCase(),
          email: values.email.trim(),
          phone: values.phone.trim(),
        })
      }
      onUpdate={(id, values) =>
        updateStudent(id, {
          ...values,
          name: values.name.trim(),
          registerNumber: values.registerNumber.trim().toUpperCase(),
          email: values.email.trim(),
          phone: values.phone.trim(),
        })
      }
      onDelete={deleteStudent}
      deleteGuard={(row) => {
        if (row.leaveCount) {
          return 'This student has leave records. Keep the student record to preserve application history.'
        }
        return null
      }}
      extraActions={
        <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-500 sm:inline-flex">
          <Users className="h-3 w-3" aria-hidden="true" />
          {db.students.length} students
        </span>
      }
      emptyTitle="No students found"
      emptyDescription="Add a student or adjust the department, class and status filters."
    />
  )
}
