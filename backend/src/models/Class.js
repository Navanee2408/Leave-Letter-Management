import mongoose from 'mongoose'
import { ACCOUNT_STATUS, ACCOUNT_STATUS_VALUES } from '../constants/index.js'

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      maxlength: [120, 'Class name must be 120 characters or fewer'],
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      trim: true,
      maxlength: [20, 'Year must be 20 characters or fewer'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      maxlength: [20, 'Section must be 20 characters or fewer'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    // A class has at most one assigned tutor. Tutors may be assigned to many
    // classes, but every class points to a single active tutor.
    assignedTutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ACCOUNT_STATUS_VALUES,
      default: ACCOUNT_STATUS.ACTIVE,
    },
    // Internal normalized lookup key so class names are unique per department
    // regardless of letter case or repeated whitespace.
    classNameKey: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
)

classSchema.pre('validate', function normalizeClass() {
  if (this.className) {
    this.className = this.className.trim().replace(/\s+/g, ' ')
  }

  if (this.year) this.year = String(this.year).trim()
  if (this.section) this.section = String(this.section).trim()

  this.classNameKey = this.className ? this.className.toLowerCase() : undefined
})

classSchema.index({ department: 1, classNameKey: 1 }, { unique: true })
classSchema.index({ department: 1, status: 1 })
classSchema.index({ assignedTutor: 1 })
classSchema.index({ status: 1 })

classSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    delete ret.classNameKey
    return ret
  },
})

export const Class = mongoose.models.Class || mongoose.model('Class', classSchema)
