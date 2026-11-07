import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react'
import {
  ACCEPTED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from '../../constants'
import { cn } from '../../lib/utils'

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file) {
  if (!file) return null
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) {
    return 'Only PDF, JPG or PNG files are accepted.'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'File must be 5 MB or smaller.'
  }
  return null
}

export default function FileUpload({
  label = 'Supporting document',
  file,
  onChange,
  error,
  hint,
  accept = '.pdf,.jpg,.jpeg,.png',
  id = 'supporting-document',
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleFile = (selected) => {
    if (!selected) return
    const validationError = validateFile(selected)
    if (validationError) {
      setLocalError(validationError)
      onChange?.(null)
      return
    }
    setLocalError('')
    onChange?.(selected)
  }

  const remove = () => {
    setLocalError('')
    onChange?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const shownError = localError || error
  const isImage = file?.type?.startsWith('image/')

  return (
    <div className="w-full">
      <span className="label">{label}</span>
      {file ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3',
            shownError && 'border-rose-300 bg-rose-50/40',
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-navy-700 ring-1 ring-slate-200">
            {isImage ? (
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <FileText className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
            <p className="text-xs text-slate-500">
              {formatBytes(file.size)} · Ready to upload
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
            aria-label="Remove attached document"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            handleFile(event.dataTransfer.files?.[0])
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center transition hover:border-navy-400 hover:bg-navy-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2',
            dragging && 'border-navy-500 bg-navy-50',
            shownError && 'border-rose-300',
          )}
        >
          <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy-700 shadow-sm ring-1 ring-slate-200">
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-medium text-slate-700">
            Click to attach or drag a file here
          </span>
          <span className="mt-1 text-xs text-slate-500">PDF, JPG or PNG · max 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {shownError && <p className="mt-1.5 text-xs font-medium text-rose-600">{shownError}</p>}
      {!shownError && hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
