import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { Department } from '../src/models/Department.js'
import { User } from '../src/models/User.js'
import {
  TEST_PASSWORD,
  createTestUser,
} from './support/authTestUtils.js'
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './support/testDatabase.js'

before(connectTestDatabase)
after(disconnectTestDatabase)
beforeEach(clearTestDatabase)

test('passwords are hashed and hidden by default', async () => {
  const user = await createTestUser()

  const stored = await User.findById(user._id).select('+password')

  assert.notEqual(stored.password, TEST_PASSWORD)
  assert.match(stored.password, /^\$2[aby]\$/)
  assert.equal(await stored.comparePassword(TEST_PASSWORD), true)
  assert.equal(await stored.comparePassword('WrongPassword!123'), false)

  const withoutPassword = await User.findById(user._id)
  assert.equal(withoutPassword.password, undefined)
  assert.equal('password' in withoutPassword.toJSON(), false)
  assert.equal('password' in stored.toJSON(), false)
})

test('email addresses are normalized and unique case-insensitively', async () => {
  const user = await createTestUser({ email: '  Mixed.Case@Example.COM  ' })

  assert.equal(user.email, 'mixed.case@example.com')

  await assert.rejects(
    createTestUser({ email: 'mixed.case@example.com' }),
    (error) => error.code === 11000,
  )
})

test('invalid roles are rejected by schema validation', async () => {
  await assert.rejects(
    createTestUser({ role: 'SUPER_ADMIN' }),
    (error) =>
      error.name === 'ValidationError' &&
      Object.hasOwn(error.errors, 'role'),
  )
})

test('ADMIN is college-wide while HOD requires a department', async () => {
  const department = await Department.create({
    name: 'Computer Science',
    code: 'CSE',
  })

  const admin = await createTestUser({
    role: ROLES.ADMIN,
    department: department._id,
  })

  assert.equal(admin.department, null)

  const hod = await createTestUser({
    role: ROLES.HOD,
    department: department._id,
  })

  assert.equal(hod.department.toString(), department.id)

  await assert.rejects(
    createTestUser({ role: ROLES.HOD }),
    (error) =>
      error.name === 'ValidationError' &&
      Object.hasOwn(error.errors, 'department'),
  )
})

test('department names and codes are normalized and unique', async () => {
  const department = await Department.create({
    name: '  Computer   Science  ',
    code: ' cse ',
  })

  assert.equal(department.name, 'Computer Science')
  assert.equal(department.code, 'CSE')
  assert.equal(department.status, ACCOUNT_STATUS.ACTIVE)

  await assert.rejects(
    Department.create({ name: 'computer science', code: 'CS2' }),
    (error) => error.code === 11000,
  )

  await assert.rejects(
    Department.create({ name: 'Information Technology', code: 'cse' }),
    (error) => error.code === 11000,
  )
})
