import mongoose from 'mongoose'
import { Class } from '../../src/models/Class.js'
import { Department } from '../../src/models/Department.js'
import { LeaveApplication } from '../../src/models/LeaveApplication.js'
import { LeaveApplicationHistory } from '../../src/models/LeaveApplicationHistory.js'
import { Notification } from '../../src/models/Notification.js'
import { ParentStudent } from '../../src/models/ParentStudent.js'
import { RefreshSession } from '../../src/models/RefreshSession.js'
import { Student } from '../../src/models/Student.js'
import { User } from '../../src/models/User.js'

const defaultTestUri = `mongodb://127.0.0.1:27017/clms_test_${process.pid}_${Date.now()}`
const testUri = process.env.MONGODB_URI_TEST || defaultTestUri

export async function connectTestDatabase() {
  if (mongoose.connection.readyState !== 0) return

  try {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 })
  } catch {
    throw new Error(
      'Unable to connect to the isolated test MongoDB. Start a local MongoDB instance or set MONGODB_URI_TEST to a disposable test database.',
    )
  }

  await Promise.all([
    User.init(),
    Department.init(),
    RefreshSession.init(),
    Class.init(),
    Student.init(),
    ParentStudent.init(),
    LeaveApplication.init(),
    LeaveApplicationHistory.init(),
    Notification.init(),
  ])
}

export async function clearTestDatabase() {
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
}

export async function disconnectTestDatabase() {
  if (mongoose.connection.readyState === 0) return

  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
}
