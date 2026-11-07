import { useMemo, useState } from 'react'
import { School } from 'lucide-react'
import CrudPage from '../../components/admin/CrudPage'
import { useData } from '../../hooks/useData'
import {
  classTitle,
  departmentById,
  studentCountForClass,
  tutorById,
} from '../../services/selectors'
import {
  ACADEMIC_YEARS,
  ACCOUNT_STATUS_OPTIONS,
  SECTION_OPTIONS,
  YEAR_OPTIONS,
} from '../../constants'

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

export default function ClassesPage() {
  const {
    db,
    addClass,
    updateClass,
    deleteClass,
  } = useData()
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(
    () =>
      db.classes
        .map((classItem) => ({
          ...classItem,
          department: departmentById(db, classItem.departmentId),
          tutor: tutorById(db, classItem.tutorId),
          studentCount: studentCountForClass(db, classItem.id),
          leaveCount: db.leaves.filter((leave) =>
            db.students.some(
              (student) =>
                student.id === leave.studentId && student.classId === classItem.id,
            ),
          ).length,
          title: classTitle(db, classItem),
        }))
        .filter(
          (classItem) =>
            (!departmentFilter || classItem.departmentId === departmentFilter) &&
            (!status || classItem.status === status),
        ),
    [db, departmentFilter, status],
  )

  const fields = [
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
      name: 'academicYear',
      label: 'Academic year',
      type: 'select',
      required: true,
      options: ACADEMIC_YEARS.map((year) => ({ value: year, label: year })),
    },
    {
      name: 'year',
      label: 'Year of study',
      type: 'select',
      required: true,
      options: YEAR_OPTIONS,
    },
    {
      name: 'section',
      label: 'Section',
      type: 'select',
      required: true,
      options: SECTION_OPTIONS,
    },
    {
      name: 'tutorId',
      label: 'Class tutor',
      type: 'select',
      placeholder: 'Unassigned',
      options: (values) =>
        db.tutors
          .filter(
            (tutor) =>
              (tutor.status === 'active' &&
                db.departments.some(
                  (department) =>
                    department.id === tutor.departmentId &&
                    department.status === 'active',
                )) ||
              tutor.id === values?.tutorId,
          )
          .map((tutor) => ({
            value: tutor.id,
            label: `${tutor.name} · ${departmentById(db, tutor.departmentId)?.code || '—'}${tutor.status === 'inactive' ? ' · inactive (existing)' : ''}`,
          })),
      hint: 'A tutor can be assigned to more than one class.',
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
      key: 'class',
      header: 'Class',
      render: (row) => (
        <div className="min-w-[170px]">
          <p className="font-semibold text-slate-800">{row.title}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {row.department?.name || 'No department'}
          </p>
        </div>
      ),
    },
    {
      key: 'year',
      header: 'Academic year',
      render: (row) => (
        <span className="whitespace-nowrap text-[12.5px] text-slate-600">
          {row.academicYear}
        </span>
      ),
    },
    {
      key: 'tutor',
      header: 'Class tutor',
      render: (row) =>
        row.tutor ? (
          <div>
            <p className="text-[13px] font-medium text-slate-700">{row.tutor.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{row.tutor.email}</p>
          </div>
        ) : (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10.5px] font-semibold text-amber-700">
            Unassigned
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
      key: 'status',
      header: 'Status',
      render: (row) => statusBadge(row.status),
    },
  ]

  return (
    <CrudPage
      eyebrow="College administration"
      title="Classes"
      description="Create class groups, assign a class tutor and keep the academic year structure consistent."
      entityLabel="Class"
      rows={rows}
      columns={columns}
      fields={fields}
      searchText={(row) =>
        `${row.title} ${row.department?.name} ${row.tutor?.name || ''} ${row.academicYear}`
      }
      searchPlaceholder="Search classes…"
      filters={[
        {
          id: 'class-department-filter',
          label: 'Department',
          value: departmentFilter,
          onChange: setDepartmentFilter,
          options: db.departments.map((department) => ({
            value: department.id,
            label: `${department.code}${department.status === 'inactive' ? ' · inactive' : ''}`,
          })),
          allLabel: 'All departments',
        },
        {
          id: 'class-status-filter',
          label: 'Class status',
          value: status,
          onChange: setStatus,
          options: ACCOUNT_STATUS_OPTIONS,
          allLabel: 'All statuses',
        },
      ]}
      filterKey={`${departmentFilter}-${status}`}
      initialValues={(row) => ({
        departmentId: row?.departmentId || '',
        academicYear: row?.academicYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1],
        year: row?.year || '',
        section: row?.section || '',
        tutorId: row?.tutorId || '',
        status: row?.status || 'active',
      })}
      validate={(values, editing) => {
        const errors = {}
        const department = db.departments.find(
          (item) => item.id === values.departmentId,
        )
        const original = db.classes.find((item) => item.id === editing?.id)
        if (
          !department ||
          (department.status !== 'active' &&
            (!original || original.departmentId !== department.id))
        ) {
          errors.departmentId = 'Select an active department for new class assignments.'
        }
        const duplicate = db.classes.some(
          (classItem) =>
            classItem.id !== editing?.id &&
            classItem.departmentId === values.departmentId &&
            classItem.year === values.year &&
            classItem.section === values.section &&
            classItem.academicYear === values.academicYear,
        )
        if (duplicate) {
          errors.section = 'A class with this department, year, section and academic year already exists.'
        }
        if (
          values.tutorId &&
          !db.tutors.some(
            (tutor) => tutor.id === values.tutorId && tutor.status === 'active',
          )
        ) {
          errors.tutorId = 'Select an active tutor.'
        }
        return errors
      }}
      onCreate={addClass}
      onUpdate={updateClass}
      onDelete={deleteClass}
      deleteGuard={(row) => {
        if (row.studentCount || row.leaveCount) {
          return 'This class has linked students or leave history. Keep it to preserve the existing records.'
        }
        return null
      }}
      extraActions={
        <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-medium text-slate-500 sm:inline-flex">
          <School className="h-3 w-3" aria-hidden="true" />
          {db.classes.length} classes
        </span>
      }
      emptyTitle="No classes found"
      emptyDescription="Add a class or clear the department and status filters."
    />
  )
}
