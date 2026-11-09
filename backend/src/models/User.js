import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_VALUES,
  BCRYPT_SALT_ROUNDS,
  ROLES,
  ROLE_VALUES,
} from '../constants/index.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name must be 120 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email must be 254 characters or fewer'],
      match: [EMAIL_PATTERN, 'A valid email address is required'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: [8, 'Password must be at least 8 characters'],
      maxlength: [128, 'Password must be 128 characters or fewer'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ROLE_VALUES,
        message: 'Role must be one of: ADMIN, HOD, TUTOR, PARENT',
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number must be 30 characters or fewer'],
    },
    employeeId: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [50, 'Employee ID must be 50 characters or fewer'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUS_VALUES,
      default: ACCOUNT_STATUS.ACTIVE,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

// ADMIN is college-wide, HOD is department-scoped, and only tutors hold class
// assignments. These rules are enforced in the data layer, never by the client.
userSchema.pre('validate', function normalizeUserScope() {
  if (this.role === ROLES.ADMIN) {
    this.department = null
  }

  if (this.role !== ROLES.TUTOR) {
    this.assignedClasses = []
  }

  if (this.role === ROLES.HOD && !this.department) {
    this.invalidate('department', 'HOD accounts require a department')
  }
})

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS)
})

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return Promise.resolve(false)
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.index({ role: 1, accountStatus: 1 })
userSchema.index({ department: 1, role: 1, accountStatus: 1 })
// Only real employee ids participate in the unique index, so any number of
// accounts without an employee id (parents, for example) remain valid.
userSchema.index(
  { employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: { employeeId: { $type: 'string' } },
  },
)

// A department may have at most one ACTIVE HOD. The partial unique index makes
// this invariant atomic, so concurrent replacement requests cannot leave two
// active HODs in the same department.
userSchema.index(
  { department: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: ROLES.HOD,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    },
  },
)

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    delete ret.password
    return ret
  },
})

export const User = mongoose.models.User || mongoose.model('User', userSchema)
