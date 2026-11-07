import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { XCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormTextarea from '../forms/FormTextarea'
import LeaveSummary from './LeaveSummary'

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(15, 'Please provide a clear rejection reason (at least 15 characters).')
    .max(500, 'Reason must be 500 characters or fewer.'),
})

export default function RejectionDialog({ open, leave, onClose, onConfirm }) {
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
      title="Reject leave request"
      description="A rejection reason is required. The parent will see this reason in their portal."
      icon={XCircle}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="submit"
            form="rejection-form"
            className="sm:min-w-[150px]"
          >
            <XCircle className="h-4 w-4" />
            Confirm rejection
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <LeaveSummary leave={leave} />
        <form id="rejection-form" onSubmit={handleSubmit((values) => onConfirm(values.reason))}>
          <FormTextarea
            label="Rejection reason"
            name="reason"
            rows={4}
            required
            maxLength={500}
            valueLength={reason.length}
            placeholder="Explain why this leave request cannot be approved…"
            error={errors.reason?.message}
            hint="Be specific so the parent can correct and resubmit if appropriate."
            {...register('reason')}
          />
        </form>
        <p className="rounded-lg bg-rose-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-rose-800">
          No approval notification will be sent to the class tutor. The parent will
          receive the rejection reason immediately in demo mode.
        </p>
      </div>
    </Modal>
  )
}
