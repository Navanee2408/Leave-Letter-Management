import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarCheck2, FileText, Info, UserRound } from 'lucide-react'
import FormSelect from '../forms/FormSelect'
import DateInput from '../forms/DateInput'
import FormTextarea from '../forms/FormTextarea'
import FileUpload from '../forms/FileUpload'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import { LEAVE_TYPES } from '../../constants'
import { daysBetween, formatDate, todayISO } from '../../lib/date'
import { leaveApplicationSchema } from '../../services/leaveValidation'

export default function LeaveApplicationForm({
  children = [],
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel = 'Submit leave application',
  formId = 'leave-application-form',
  showActions = true,
  onCancel,
}) {
  const today = todayISO()
  const defaults = useMemo(
    () => ({
      studentId: initialValues?.studentId || '',
      leaveType: initialValues?.leaveType || '',
      fromDate: initialValues?.fromDate || '',
      toDate: initialValues?.toDate || '',
      reason: initialValues?.reason || '',
    }),
    [initialValues],
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leaveApplicationSchema),
    defaultValues: defaults,
  })

  const [documentFile, setDocumentFile] = useState(initialValues?.document || null)
  const [documentError, setDocumentError] = useState('')

  const selectedId = watch('studentId')
  const fromDate = watch('fromDate')
  const toDate = watch('toDate')
  const reason = watch('reason') || ''
  const selectedChild = children.find((child) => child.id === selectedId)
  const duration = daysBetween(fromDate, toDate)

  const submit = (values) => {
    if (!documentFile && documentError) return
    onSubmit?.({
      ...values,
      document: documentFile
        ? {
            name: documentFile.name,
            type: documentFile.type,
            size: documentFile.size,
            file: documentFile,
          }
        : null,
    })
  }

  const childOptions = children.map((child) => ({
    value: child.id,
    label: `${child.name} · ${child.registerNumber} · ${child.classItem ? child.className : 'Class not assigned'}`,
  }))

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <form
        id={formId}
        onSubmit={handleSubmit(submit)}
        className="space-y-5"
        noValidate
      >
        {children.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              No linked children found
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              A leave application requires a linked student record. Contact the
              department office in a real deployment to update the guardian link.
            </p>
          </div>
        )}

        <FormSelect
          label="Child"
          name="studentId"
          required
          placeholder="Select a child"
          options={childOptions}
          error={errors.studentId?.message}
          hint="Only students linked to your parent account are available."
          {...register('studentId')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            label="Leave type"
            name="leaveType"
            required
            placeholder="Select leave type"
            options={LEAVE_TYPES.map((type) => ({ value: type, label: type }))}
            error={errors.leaveType?.message}
            {...register('leaveType')}
          />
          <div>
            <span className="label">Requested duration</span>
            <div className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-600">
              <CalendarCheck2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {duration ? `${duration} day${duration === 1 ? '' : 's'}` : 'Select dates'}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DateInput
            label="From date"
            name="fromDate"
            required
            min={today}
            error={errors.fromDate?.message}
            {...register('fromDate')}
          />
          <DateInput
            label="To date"
            name="toDate"
            required
            min={fromDate || today}
            error={errors.toDate?.message}
            {...register('toDate')}
          />
        </div>

        <FormTextarea
          label="Reason for leave"
          name="reason"
          required
          rows={5}
          maxLength={500}
          valueLength={reason.length}
          placeholder="Describe why the leave is required, including any relevant context for the department…"
          error={errors.reason?.message}
          hint="Minimum 20 characters. This reason is visible to the HOD and, after approval, the class tutor."
          {...register('reason')}
        />

        <div>
          <FileUpload
            label="Supporting document (optional)"
            file={documentFile}
            onChange={(file) => {
              setDocumentFile(file)
              setDocumentError('')
            }}
            error={documentError}
            hint="A medical certificate, prescription or other supporting evidence. PDF, JPG or PNG up to 5 MB."
            id={`${formId}-document`}
          />
          {documentError && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{documentError}</p>
          )}
          <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-slate-400">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Demo mode stores only the file name and size — the file itself is not
            uploaded to a server.
          </p>
        </div>

        {showActions && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={submitting} disabled={children.length === 0}>
              <FileText className="h-4 w-4" />
              {submitLabel}
            </Button>
          </div>
        )}
      </form>

      <aside className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Application preview
          </p>
          {selectedChild ? (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <Avatar name={selectedChild.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedChild.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedChild.registerNumber} · {selectedChild.department?.code}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-2.5 border-t border-slate-200 pt-3 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Class</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {selectedChild.className}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Department</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {selectedChild.department?.name || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Class tutor</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {selectedChild.tutor?.name || '—'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2.5 text-xs leading-relaxed text-slate-500">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              Select a child to preview the class, department and tutor who will
              receive the approved leave.
            </div>
          )}

          {(fromDate || toDate) && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Requested period
              </p>
              <p className="mt-1 text-[13px] font-semibold text-slate-700">
                {formatDate(fromDate)} → {formatDate(toDate)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {duration ? `${duration} day${duration === 1 ? '' : 's'}` : 'Choose both dates'}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-700">
            What happens next
          </p>
          <ol className="mt-3 space-y-2.5">
            {[
              'Your application enters the HOD review queue.',
              'The HOD approves, rejects with a reason, or reopens it for correction.',
              'Approved leave is shared with the class tutor and a PDF letter becomes available.',
            ].map((step, index) => (
              <li key={step} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-navy-800">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-bold text-navy-800 ring-1 ring-navy-200">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  )
}
