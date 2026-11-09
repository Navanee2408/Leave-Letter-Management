import mongoose from 'mongoose'
import { ACCOUNT_STATUS, ACCOUNT_STATUS_VALUES } from '../constants/index.js'

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [120, 'Department name must be 120 characters or fewer'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Department code must be at least 2 characters'],
      maxlength: [20, 'Department code must be 20 characters or fewer'],
      match: [
        /^[A-Z0-9_-]+$/,
        'Department code may only contain letters, numbers, hyphens, and underscores',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be 500 characters or fewer'],
    },
    status: {
      type: String,
      enum: ACCOUNT_STATUS_VALUES,
      default: ACCOUNT_STATUS.ACTIVE,
    },
    // Internal normalized lookup key so department names are unique regardless
    // of letter case or repeated whitespace.
    nameKey: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
)

departmentSchema.pre('validate', function normalizeDepartment() {
  if (this.name) {
    this.name = this.name.trim().replace(/\s+/g, ' ')
  }

  if (this.code) {
    this.code = this.code.trim().toUpperCase()
  }

  this.nameKey = this.name ? this.name.toLowerCase() : undefined
})

departmentSchema.index({ nameKey: 1 }, { unique: true })
departmentSchema.index({ code: 1 }, { unique: true })
departmentSchema.index({ status: 1 })

departmentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    delete ret.nameKey
    return ret
  },
})

export const Department =
  mongoose.models.Department || mongoose.model('Department', departmentSchema)
