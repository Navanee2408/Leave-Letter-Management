import mongoose from 'mongoose'
import {
  RELATIONSHIP_TYPES,
  RELATIONSHIP_TYPE_VALUES,
} from '../constants/index.js'

const parentStudentSchema = new mongoose.Schema(
  {
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
    relationship: {
      type: String,
      enum: RELATIONSHIP_TYPE_VALUES,
      required: [true, 'Relationship is required'],
      default: RELATIONSHIP_TYPES.GUARDIAN,
    },
  },
  { timestamps: true },
)

// A parent/student pair can only be linked once.
parentStudentSchema.index({ parent: 1, student: 1 }, { unique: true })
parentStudentSchema.index({ student: 1 })
parentStudentSchema.index({ parent: 1, createdAt: -1 })

parentStudentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

export const ParentStudent =
  mongoose.models.ParentStudent ||
  mongoose.model('ParentStudent', parentStudentSchema)
