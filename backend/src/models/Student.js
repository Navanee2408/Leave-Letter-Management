import mongoose from 'mongoose'
import { ACCOUNT_STATUS, ACCOUNT_STATUS_VALUES } from '../constants/index.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name must be 120 characters or fewer'],
    },
    registerNumber: {
      type: String,
      required: [true, 'Register number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [50, 'Register number must be 50 characters or fewer'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email must be 254 characters or fewer'],
      match: [EMAIL_PATTERN, 'A valid email address is required'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number must be 30 characters or fewer'],
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
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUS_VALUES,
      default: ACCOUNT_STATUS.ACTIVE,
    },
  },
  { timestamps: true },
)

studentSchema.pre('validate', function normalizeStudent() {
  if (this.fullName) {
    this.fullName = this.fullName.trim().replace(/\s+/g, ' ')
  }

  if (this.registerNumber) {
    this.registerNumber = this.registerNumber.trim().toUpperCase()
  }
})

studentSchema.index({ department: 1, accountStatus: 1 })
studentSchema.index({ class: 1, accountStatus: 1 })
studentSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } },
  },
)

studentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

export const Student =
  mongoose.models.Student || mongoose.model('Student', studentSchema)
