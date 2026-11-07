import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormTextarea from '../forms/FormTextarea'
import LeaveSummary from './LeaveSummary'

const schema = z.object({
  remarks: z
    .string()
    .max(500, 'Remarks must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
})

export default function ApprovalDialog({ open, leave, onClose, onConfirm }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { remarks: '' },
  })

  useEffect(() => {
    if (open) reset({ remarks: '' })
  }, [open, leave?.id, reset])

  const submit = (values) => {
    onConfirm(values.remarks || '')
  }

  if (!leave) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Approve leave request"
      description="Review the application carefully before confirming. The parent and class tutor will be notified."
      icon={CheckCircle2}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            type="submit"
            form="approval-form"
            className="sm:min-w-[150px]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm approval
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {leave.status === 'reopened' && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-800">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reopened application
            </p>
            <p className="mt-1 text-xs leading-relaxed text-sky-700">
              Previous decision: {leave.previousDecision?.status || 'corrected'}.{' '}
              {leave.reopenReason}
            </p>
          </div>
        )}
        <LeaveSummary leave={leave} />
        <form id="approval-form" onSubmit={handleSubmit(submit)}>
          <FormTextarea
            label="HOD remarks (optional)"
            name="remarks"
            rows={3}
            maxLength={500}
            placeholder="Add an approval note for the parent and tutor…"
            error={errors.remarks?.message}
            hint="Visible to the parent and class tutor in this demo."
            {...register('remarks')}
          />
        </form>
        <p className="rounded-lg bg-emerald-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-800">
          On approval, the leave is added to the tutor's approved leave list and a
          downloadable leave letter becomes available to the parent.
        </p>
      </div>
    </Modal>
  )
}
