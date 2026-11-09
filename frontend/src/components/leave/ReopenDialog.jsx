import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RotateCcw } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormTextarea from '../forms/FormTextarea'

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(15, 'Please explain what needs correction (at least 15 characters).')
    .max(500, 'Reason must be 500 characters or fewer.'),
})

export default function ReopenDialog({ open, leave, onClose, onConfirm }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (open) reset({ reason: '' })
  }, [open, leave?.id, reset])

  if (!leave) return null
  const reason = watch('reason') || ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reopen leave application"
      description="Return a previously decided application to the HOD review queue."
      icon={RotateCcw}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="reopen-form">
            <RotateCcw className="h-4 w-4" />
            Reopen application
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
            Application
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {leave.applicationNumber || leave.id} · {leave.studentName}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {leave.leaveType} · {leave.fromDate} to {leave.toDate}
          </p>
          <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              Previous decision
            </p>
            <p className="mt-0.5 text-xs text-slate-700">
              <span className="font-semibold capitalize">
                {leave.previousDecision?.status || leave.status}
              </span>
              {leave.rejectionReason
                ? ` — ${leave.rejectionReason}`
                : leave.remarks
                  ? ` — ${leave.remarks}`
                  : ''}
            </p>
          </div>
        </div>

        <form id="reopen-form" onSubmit={handleSubmit((values) => onConfirm(values.reason))}>
          <FormTextarea
            label="Correction reason"
            name="reason"
            rows={4}
            required
            maxLength={500}
            valueLength={reason.length}
            placeholder="Explain what the parent needs to correct or provide…"
            error={errors.reason?.message}
            hint="The previous decision is preserved in the demo application history."
            {...register('reason')}
          />
        </form>

        <p className="rounded-lg bg-sky-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-sky-800">
          Reopening notifies the parent and returns the item to the pending review
          queue. The class tutor is not notified until the application is approved.
        </p>
      </div>
    </Modal>
  )
}
