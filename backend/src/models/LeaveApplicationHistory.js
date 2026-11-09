import mongoose from 'mongoose'
import {
  LEAVE_HISTORY_ACTION_VALUES,
  LEAVE_STATUS_VALUES,
  ROLE_VALUES,
} from '../constants/index.js'

const leaveApplicationHistorySchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveApplication',
      required: [true, 'Application is required'],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor is required'],
    },
    // Snapshots keep the audit trail readable even if the account is later
    // renamed or deactivated. They are informational, not authorization data.
    actorName: {
      type: String,
      trim: true,
      maxlength: [120, 'Actor name must be 120 characters or fewer'],
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, 'Actor email must be 254 characters or fewer'],
    },
    actorRole: {
      type: String,
      required: [true, 'Actor role is required'],
      enum: ROLE_VALUES,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: LEAVE_HISTORY_ACTION_VALUES,
    },
    // Explicit transition data makes the audit trail self-contained for
    // Phase 6 decisions and later reporting.
    previousStatus: {
      type: String,
      enum: LEAVE_STATUS_VALUES,
      default: null,
    },
    newStatus: {
      type: String,
      enum: LEAVE_STATUS_VALUES,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reason must be 1000 characters or fewer'],
      default: null,
    },
    // Flexible details support action-specific data without changing the
    // history schema.
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

leaveApplicationHistorySchema.index({ application: 1, createdAt: 1 })
leaveApplicationHistorySchema.index({ actor: 1, createdAt: -1 })

leaveApplicationHistorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

export const LeaveApplicationHistory =
  mongoose.models.LeaveApplicationHistory ||
  mongoose.model('LeaveApplicationHistory', leaveApplicationHistorySchema)
