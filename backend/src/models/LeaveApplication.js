import crypto from 'node:crypto'
import mongoose from 'mongoose'
import {
  LEAVE_STATUS,
  LEAVE_STATUS_VALUES,
  LEAVE_TYPE_VALUES,
} from '../constants/index.js'

const DAY_MS = 24 * 60 * 60 * 1000

function generateApplicationNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `LA-${date}-${random}`
}

function startOfUtcDay(value) {
  const date = new Date(value)
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

const supportingDocumentSchema = new mongoose.Schema(
  {
    // Client-facing metadata only. The original filename is never used to build
    // a storage path; it is sanitized for display and download headers.
    fileName: {
      type: String,
      trim: true,
      maxlength: [255, 'File name must be 255 characters or fewer'],
    },
    // Server-generated name inside the private storage directory. Hidden from
    // normal responses; only the download service selects it.
    storedName: {
      type: String,
      select: false,
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: [100, 'MIME type must be 100 characters or fewer'],
    },
    size: {
      type: Number,
      min: [1, 'File size must be greater than zero'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const leaveApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: [true, 'Application number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [40, 'Application number must be 40 characters or fewer'],
      default: generateApplicationNumber,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    leaveType: {
      type: String,
      required: [true, 'Leave type is required'],
      enum: {
        values: LEAVE_TYPE_VALUES,
        message: 'Invalid leave type',
      },
    },
    fromDate: {
      type: Date,
      required: [true, 'From date is required'],
    },
    toDate: {
      type: Date,
      required: [true, 'To date is required'],
    },
    totalDays: {
      type: Number,
      required: [true, 'Total days is required'],
      min: [1, 'Total days must be at least 1'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
      maxlength: [1000, 'Reason must be 1000 characters or fewer'],
    },
    supportingDocument: {
      type: supportingDocumentSchema,
      default: null,
    },
    status: {
      type: String,
      enum: LEAVE_STATUS_VALUES,
      default: LEAVE_STATUS.PENDING,
    },
    // Latest decision deliberately lives on the application for quick reads.
    // Earlier decisions are preserved in the append-only history collection.
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    decisionComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Decision comment must be 1000 characters or fewer'],
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Rejection reason must be 1000 characters or fewer'],
      default: null,
    },
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
    reopenReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reopen reason must be 1000 characters or fewer'],
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

leaveApplicationSchema.pre('validate', function normalizeApplication() {
  if (this.fromDate && this.toDate) {
    const from = startOfUtcDay(this.fromDate)
    const to = startOfUtcDay(this.toDate)

    this.fromDate = from
    this.toDate = to

    if (to < from) {
      this.invalidate('toDate', 'To date must be on or after from date')
    } else {
      this.totalDays = Math.floor((to.getTime() - from.getTime()) / DAY_MS) + 1
    }
  }

  if (this.applicationNumber) {
    this.applicationNumber = this.applicationNumber.trim().toUpperCase()
  }

  if (!this.status) this.status = LEAVE_STATUS.PENDING
  if (!this.submittedAt) this.submittedAt = new Date()
})

leaveApplicationSchema.index({ parent: 1, submittedAt: -1 })
leaveApplicationSchema.index({ department: 1, status: 1, submittedAt: -1 })
leaveApplicationSchema.index({ student: 1, submittedAt: -1 })
leaveApplicationSchema.index({ class: 1, submittedAt: -1 })
leaveApplicationSchema.index({ fromDate: 1, toDate: 1 })
leaveApplicationSchema.index({ decidedBy: 1, decidedAt: -1 })

leaveApplicationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id

    if (ret.supportingDocument?.storedName) {
      delete ret.supportingDocument.storedName
    }

    return ret
  },
})

export const LeaveApplication =
  mongoose.models.LeaveApplication ||
  mongoose.model('LeaveApplication', leaveApplicationSchema)
