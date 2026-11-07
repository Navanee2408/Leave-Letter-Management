import { useMemo } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import CrudPage from '../../components/admin/CrudPage'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import FormInput from '../../components/forms/FormInput'
import FormSelect from '../../components/forms/FormSelect'
import Modal from '../../components/ui/Modal'
import { useData } from '../../hooks/useData'
import { ACCOUNT_STATUS_OPTIONS } from '../../constants'

const NEW_HOD_OPTION = '__add_new_hod__'

const createSchema = z.object({
  name: z.string().trim().min(2, 'Enter the HOD full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  employeeId: z.string().trim().min(1, 'Enter the employee ID.'),
  phone: z.string().trim().optional(),
  departmentId: z.string().min(1, 'Select a department.'),
  password: z.string().min(8, 'Demo password must be at least 8 characters.'),
  status: z.enum(['active', 'inactive']),
})

export default function HodsPage() {
  const { db, addHod, updateHod, assignHod } = useData()
  const [createOpen, setCreateOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      email: '',
      employeeId: '',
      phone: '',
      departmentId: '',
      password: '',
      status: 'active',
    },
  })
  const rows = useMemo(
    () =>
      db.hods.map((hod) => ({
        ...hod,
        department: db.departments.find((department) => department.id === hod.departmentId),
      })),
    [db],
  )
  const assignments = useMemo(
    () =>
      db.departments.map((department) => {
        const assignedHod = db.hods.find(
          (hod) =>
            hod.departmentId === department.id && hod.status === 'active',
        )
        return { ...department, assignedHod }
      }),
    [db],
  )

  const fields = [
    { name: 'name', label: 'HOD name', required: true },
    { name: 'email', label: 'Email address', type: 'email', required: true },
    { name: 'employeeId', label: 'Employee ID', required: true },
    { name: 'phone', label: 'Phone number' },
    { name: 'designation', label: 'Designation', required: true },
  ]

  const columns = [
    {
      key: 'name',
      header: 'Head of Department',
      render: (hod) => (
        <div>
          <p className="font-semibold text-slate-800">{hod.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{hod.email}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (hod) => (
        <span className="font-semibold text-navy-800">
          {hod.department?.code} · {hod.department?.name}
        </span>
      ),
    },
    { key: 'employeeId', header: 'Employee ID' },
    { key: 'designation', header: 'Designation' },
    {
      key: 'status',
      header: 'Status',
      render: (hod) => <StatusBadge status={hod.status} />,
    },
  ]

  const validate = (values, editing) => {
    const errors = {}
    if (
      db.hods.some(
        (hod) => hod.id !== editing?.id && hod.email.toLowerCase() === values.email.trim().toLowerCase(),
      )
    ) {
      errors.email = 'This email is already assigned to an HOD account.'
    }
    return errors
  }

  const openCreate = (departmentId = '') => {
    reset({
      name: '',
      email: '',
      employeeId: '',
      phone: '',
      departmentId,
      password: '',
      status: 'active',
    })
    setCreateOpen(true)
  }

  const createHod = (values) => {
    const duplicateEmail = db.hods.some(
      (hod) => hod.email.toLowerCase() === values.email.trim().toLowerCase(),
    )
    const duplicateEmployeeId = db.hods.some(
      (hod) =>
        hod.employeeId?.toLowerCase() === values.employeeId.trim().toLowerCase(),
    )
    if (duplicateEmail) {
      setError('email', { message: 'This email is already assigned to an HOD account.' })
      return
    }
    if (duplicateEmployeeId) {
      setError('employeeId', { message: 'This employee ID is already assigned to an HOD account.' })
      return
    }
    addHod(values)
    setCreateOpen(false)
    toast.success('HOD account created and department assignment updated.')
  }

  const handleAssign = (department, hodId) => {
    if (department.status !== 'active') {
      toast.error('Activate this department before assigning an HOD.')
      return
    }
    if (hodId === NEW_HOD_OPTION) {
      openCreate(department.id)
      return
    }
    if (hodId === department.assignedHod?.id) return
    assignHod(department.id, hodId)
    toast.success('Department HOD assignments updated.')
  }

  return (
    <div>
      <CrudPage
        eyebrow="College administration"
        title="Heads of Department"
        description="Review HOD details and assign active HODs to any active department. Departments may remain unassigned."
        entityLabel="HOD account"
        rows={rows}
        columns={columns}
        fields={fields}
        searchText={(hod) => `${hod.name} ${hod.email} ${hod.department?.code || ''}`}
        searchPlaceholder="Search HODs or departments…"
        initialValues={(hod) => ({
          name: hod.name,
          email: hod.email,
          phone: hod.phone,
          employeeId: hod.employeeId,
          designation: hod.designation,
        })}
        validate={validate}
        onUpdate={updateHod}
        allowCreate={false}
        allowDelete={false}
        emptyTitle="No HOD accounts found"
        emptyDescription="Create HOD accounts from the department assignment workflow."
      />

      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-navy-900">Department assignments</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Reassigning moves the HOD; an occupied target assignment is swapped atomically.
            </p>
          </div>
          <Button size="sm" onClick={() => openCreate()}>
            <UserPlus className="h-4 w-4" />
            Add New HOD
          </Button>
        </div>
        <DataTable
          rows={assignments}
          columns={[
            {
              key: 'department',
              header: 'Department',
              render: (department) => (
                <div>
                  <p className="font-semibold text-slate-800">{department.code}</p>
                  <p className="text-[11px] text-slate-400">{department.name}</p>
                </div>
              ),
            },
            {
              key: 'assignedHod',
              header: 'Assigned HOD',
              render: (department) => (
                <div>
                  <p className="font-medium text-slate-700">
                    {department.assignedHod?.name || 'Not assigned'}
                  </p>
                  {department.assignedHod && (
                    <StatusBadge status={department.assignedHod.status} />
                  )}
                </div>
              ),
            },
            {
              key: 'assignment',
              header: 'Change assignment',
              render: (department) => (
                <select
                  aria-label={`Assign HOD to ${department.code}`}
                  value={department.assignedHod?.id || ''}
                  onChange={(event) => handleAssign(department, event.target.value)}
                  disabled={department.status !== 'active'}
                  className="h-9 w-full min-w-[190px] rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                >
                  <option value="">Not assigned</option>
                  {db.hods.filter((hod) => hod.status === 'active').map((hod) => (
                    <option
                      key={hod.id}
                      value={hod.id}
                    >
                      {hod.name} · {db.departments.find((item) => item.id === hod.departmentId)?.code || '—'}
                    </option>
                  ))}
                  <option value={NEW_HOD_OPTION}>Add New HOD…</option>
                </select>
              ),
            },
          ]}
        />
      </section>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add New HOD"
        description="Create a demo HOD account and assign it to any active department."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="new-hod-form" loading={isSubmitting}>
              Create HOD account
            </Button>
          </>
        }
      >
        <form
          id="new-hod-form"
          onSubmit={handleSubmit(createHod)}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <FormInput
            label="Full name"
            name="name"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <FormInput
            label="Email address"
            name="email"
            type="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <FormInput
            label="Employee ID"
            name="employeeId"
            required
            error={errors.employeeId?.message}
            {...register('employeeId')}
          />
          <FormInput
            label="Phone number"
            name="phone"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <FormSelect
            label="Department assignment"
            name="departmentId"
            required
            placeholder="Select department"
            options={db.departments.filter((department) => department.status === 'active').map((department) => ({
              value: department.id,
              label: `${department.code} · ${department.name}`,
            }))}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />
          <FormSelect
            label="Account status"
            name="status"
            required
            options={ACCOUNT_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
          <FormInput
            label="Demo password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            error={errors.password?.message}
            hint="Stored locally for this frontend demo only."
            className="sm:col-span-2"
            {...register('password')}
          />
        </form>
      </Modal>
    </div>
  )
}