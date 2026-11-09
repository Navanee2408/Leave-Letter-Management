import mongoose from 'mongoose'

const refreshSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      unique: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

// MongoDB removes expired sessions automatically.
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
refreshSessionSchema.index({ user: 1, revokedAt: 1 })

refreshSessionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    delete ret.tokenHash
    return ret
  },
})

export const RefreshSession =
  mongoose.models.RefreshSession ||
  mongoose.model('RefreshSession', refreshSessionSchema)
