import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { generateApprovedLeavePDF } from '../lib/pdf'

export function useLeavePdf() {
  return useCallback(async (leave) => {
    if (!leave) return
    const toastId = toast.loading('Generating approved leave letter…')
    try {
      await generateApprovedLeavePDF({
        leave,
        student: leave.student,
        department: leave.department,
        classItem: leave.classItem,
        tutor: leave.tutor,
        parent: leave.parent,
      })
      toast.success('Approved leave letter downloaded.', { id: toastId })
    } catch (error) {
      toast.error(
        error?.message || 'The PDF could not be generated in this browser.',
        { id: toastId },
      )
    }
  }, [])
}
