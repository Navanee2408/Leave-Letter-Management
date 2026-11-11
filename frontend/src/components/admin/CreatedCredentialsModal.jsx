import { useEffect, useState } from 'react'
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function CreatedCredentialsModal({
  credentials,
  onClose,
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [credentials])

  const loginText = credentials
    ? [
        `Role: ${credentials.roleLabel}`,
        `Name: ${credentials.name}`,
        `Email: ${credentials.email}`,
        `Temporary Password: ${credentials.temporaryPassword}`,
        'Note: You will be required to change this temporary password on first login.',
      ].join('\n')
    : ''

  const handleCopy = async () => {
    if (!loginText) return
    try {
      await navigator.clipboard.writeText(loginText)
      setCopied(true)
      toast.success('Login details copied to clipboard.')
    } catch {
      toast.error('Unable to copy automatically. Please copy manually.')
    }
  }

  return (
    <Modal
      open={Boolean(credentials)}
      onClose={onClose}
      title="Account Created — Share Login Details"
      description="This temporary password is displayed only once and is not stored in readable form."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Login Details
              </>
            )}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      {credentials && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              Save or copy these credentials now
            </p>
            <p className="mt-1 leading-relaxed text-amber-800">
              For security, passwords are hashed in the database and cannot be
              viewed again once you close this dialog. The user will be prompted
              to set a new password upon first login.
            </p>
          </div>

          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 text-sm">
            <div className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-xs font-medium text-slate-500">Account Role</span>
              <span className="font-semibold text-slate-900">
                {credentials.roleLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-xs font-medium text-slate-500">Full Name</span>
              <span className="font-medium text-slate-900">{credentials.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-xs font-medium text-slate-500">Email</span>
              <span className="font-mono text-xs font-semibold text-slate-900">
                {credentials.email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <KeyRound className="h-3.5 w-3.5 text-navy-700" aria-hidden="true" />
                Temporary Password
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-navy-900 select-all">
                {credentials.temporaryPassword}
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
