import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEV_PARENT_PASSWORD,
  DEV_TUTOR_PASSWORD,
  seedAcademicData,
} from '../scripts/seedAcademicData.js'
import { ROLES } from '../src/constants/index.js'
import { Class } from '../src/models/Class.js'
import { Department } from '../src/models/Department.js'
import { ParentStudent } from '../src/models/ParentStudent.js'
import { Student } from '../src/models/Student.js'
import { User } from '../src/models/User.js'
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './support/testDatabase.js'

before(connectTestDatabase)
after(disconnectTestDatabase)
beforeEach(clearTestDatabase)

const silentLogger = { log() {} }

test('Phase 4 demo seed is complete and idempotent', async () => {
  const first = await seedAcademicData({ logger: silentLogger })

  assert.equal(first.departments.created, 5)
  assert.equal(first.departments.skipped, 0)
  assert.equal(first.classes.created, 10)
  assert.equal(first.classes.skipped, 0)
  assert.equal(first.tutors.created, 10)
  assert.equal(first.tutors.skipped, 0)
  assert.equal(first.students.created, 20)
  assert.equal(first.students.skipped, 0)
  assert.equal(first.parents.created, 20)
  assert.equal(first.parents.skipped, 0)
  assert.equal(first.links.created, 20)
  assert.equal(first.links.skipped, 0)

  assert.equal(await Department.countDocuments(), 5)
  assert.equal(await Class.countDocuments(), 10)
  assert.equal(await User.countDocuments({ role: ROLES.TUTOR }), 10)
  assert.equal(await Student.countDocuments(), 20)
  assert.equal(await User.countDocuments({ role: ROLES.PARENT }), 20)
  assert.equal(await ParentStudent.countDocuments(), 20)

  const tutor = await User.findOne({
    email: 'tutor.cse.1@example.test',
  }).select('+password')
  assert.match(tutor.password, /^\$2[aby]\$/)
  assert.equal(await tutor.comparePassword(DEV_TUTOR_PASSWORD), true)

  const parent = await User.findOne({
    email: 'parent.cse.1@example.test',
  }).select('+password')
  assert.match(parent.password, /^\$2[aby]\$/)
  assert.equal(await parent.comparePassword(DEV_PARENT_PASSWORD), true)

  const tutorClasses = await Class.find({ assignedTutor: tutor._id })
  assert.equal(tutorClasses.length, 1)
  assert.equal(tutorClasses[0].className, 'CSE-A')

  await Department.updateOne(
    { code: 'CSE' },
    { $set: { description: 'Manually customized description' } },
  )
  await Student.updateOne(
    { registerNumber: 'CSE24001' },
    { $set: { phone: '+1 555 9999' } },
  )

  const second = await seedAcademicData({ logger: silentLogger })

  assert.equal(second.departments.created, 0)
  assert.equal(second.departments.skipped, 5)
  assert.equal(second.classes.created, 0)
  assert.equal(second.classes.skipped, 10)
  assert.equal(second.tutors.created, 0)
  assert.equal(second.tutors.skipped, 10)
  assert.equal(second.students.created, 0)
  assert.equal(second.students.skipped, 20)
  assert.equal(second.parents.created, 0)
  assert.equal(second.parents.skipped, 20)
  assert.equal(second.links.created, 0)
  assert.equal(second.links.skipped, 20)

  assert.equal(await Department.countDocuments(), 5)
  assert.equal(await Class.countDocuments(), 10)
  assert.equal(await User.countDocuments({ role: ROLES.TUTOR }), 10)
  assert.equal(await Student.countDocuments(), 20)
  assert.equal(await User.countDocuments({ role: ROLES.PARENT }), 20)
  assert.equal(await ParentStudent.countDocuments(), 20)

  const cse = await Department.findOne({ code: 'CSE' })
  assert.equal(cse.description, 'Manually customized description')
  const student = await Student.findOne({ registerNumber: 'CSE24001' })
  assert.equal(student.phone, '+1 555 9999')
})
