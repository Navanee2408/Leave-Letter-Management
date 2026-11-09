import mongoose from 'mongoose'
import {
  NOTIFICATION_TYPE_VALUES,
  ROLE_VALUES,
} from '../constants/index.js'

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    recipientRole: {
      type: String,
      required: [true, 'Recipient role is required'],
      enum: ROLE_VALUES,
    },
    // Stored explicitly so department-scoped reads remain possible even if the
    // recipient or application is later reassigned.
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveApplication',
      required: [true, 'Application is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be 200 characters or fewer'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message must be 1000 characters or fewer'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: NOTIFICATION_TYPE_VALUES,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ application: 1, createdAt: -1 })
notificationSchema.index({ department: 1, createdAt: -1 })

notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

export const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema)
