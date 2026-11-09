import crypto from 'node:crypto'
import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { Department } from '../src/models/Department.js'
import { User } from '../src/models/User.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestAdmin,
  createTestDepartment,
  createTestHod,
  loginToken,
  uniqueSuffix,
} from './support/managementTestUtils.js'
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './support/testDatabase.js'
import { withServer } from './support/testServer.js'

before(connectTestDatabase)
after(disconnectTestDatabase)
beforeEach(clearTestDatabase)

const HOD_PASSWORD = 'HodPassword!123'

async function adminToken(baseUrl) {
  const admin = await createTestAdmin()
  return loginToken(baseUrl, admin)
}

function hodPayload(department, overrides = {}) {
  const suffix = uniqueSuffix()

  return {
    fullName: 'Dr. Test HOD',
    email: `hod-${suffix.toLowerCase()}@example.com`,
    password: HOD_PASSWORD,
    phone: '+1 555 0100',
    employeeId: `EMP-${suffix}`,
    department: department.id,
    ...overrides,
  }
}

test('ADMIN can create an HOD with a hashed password and safe response', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const payload = hodPayload(department, {
      employeeId: `emp-${uniqueSuffix().toLowerCase()}`,
    })

    const { response, body } = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: payload,
    })

    assert.equal(response.status, 201)
    assert.equal(body.success, true)
    assert.equal(body.hod.role, ROLES.HOD)
    assert.equal(body.hod.accountStatus, ACCOUNT_STATUS.ACTIVE)
    assert.equal(body.hod.department.id, department.id)
    assert.equal(body.hod.department.name, department.name)
    assert.equal(body.hod.employeeId, payload.employeeId.toUpperCase())
    assert.equal('password' in body.hod, false)
    assert.equal(JSON.stringify(body).includes('$2'), false)

    const stored = await User.findById(body.hod.id).select('+password')
    assert.match(stored.password, /^\$2[aby]\$/)
    assert.notEqual(stored.password, HOD_PASSWORD)
    assert.equal(await stored.comparePassword(HOD_PASSWORD), true)
    assert.equal('password' in stored.toJSON(), false)
  })
})

test('duplicate email and employee ID are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const firstDepartment = await createTestDepartment()
    const secondDepartment = await createTestDepartment()
    const payload = hodPayload(firstDepartment)

    const first = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: payload,
    })
    assert.equal(first.response.status, 201)

    const duplicateEmail = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(secondDepartment, {
        email: payload.email,
        employeeId: `EMP-${uniqueSuffix()}`,
      }),
    })
    assert.equal(duplicateEmail.response.status, 409)
    assert.equal(
      duplicateEmail.body.message,
      'An account with this email already exists',
    )

    const duplicateEmployeeId = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(secondDepartment, {
        employeeId: payload.employeeId.toLowerCase(),
      }),
    })
    assert.equal(duplicateEmployeeId.response.status, 409)
    assert.equal(
      duplicateEmployeeId.body.message,
      'This employee ID is already in use',
    )

    assert.equal(await User.countDocuments({ role: ROLES.HOD }), 1)
  })
})

test('HOD cannot be assigned to an inactive or missing department', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const inactiveDepartment = await createTestDepartment({
      status: ACCOUNT_STATUS.INACTIVE,
    })

    const inactive = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(inactiveDepartment),
    })
    assert.equal(inactive.response.status, 400)
    assert.equal(
      inactive.body.message,
      'Cannot assign an HOD to an inactive department',
    )

    const missing = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload({
        id: '507f1f77bcf86cd799439011',
        name: 'Missing',
        code: 'MISS',
      }),
    })
    assert.equal(missing.response.status, 404)
    assert.equal(missing.body.message, 'Department not found')

    const activeDepartment = await createTestDepartment()
    const created = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(activeDepartment),
    })
    assert.equal(created.response.status, 201)

    await Department.updateOne(
      { _id: activeDepartment._id },
      { $set: { status: ACCOUNT_STATUS.INACTIVE } },
    )

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivated.response.status, 200)

    const reactivate = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.ACTIVE },
      },
    )
    assert.equal(reactivate.response.status, 400)
    assert.equal(
      reactivate.body.message,
      'Cannot assign an HOD to an inactive department',
    )
  })
})

test('creating a new HOD safely replaces and preserves the previous HOD', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()

    const first = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(department, { fullName: 'First HOD' }),
    })
    const second = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(department, { fullName: 'Second HOD' }),
    })

    assert.equal(first.response.status, 201)
    assert.equal(second.response.status, 201)

    const previous = await User.findById(first.body.hod.id)
    const current = await User.findById(second.body.hod.id)

    assert.equal(previous.accountStatus, ACCOUNT_STATUS.INACTIVE)
    assert.equal(previous.role, ROLES.HOD)
    assert.equal(previous.department.toString(), department.id)
    assert.equal(current.accountStatus, ACCOUNT_STATUS.ACTIVE)

    assert.equal(
      await User.countDocuments({
        department: department._id,
        role: ROLES.HOD,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      }),
      1,
    )
    assert.equal(await User.countDocuments({ role: ROLES.HOD }), 2)

    const currentHod = await apiRequest(
      baseUrl,
      `/api/v1/departments/${department.id}/hod`,
      { token },
    )
    assert.equal(currentHod.response.status, 200)
    assert.equal(currentHod.body.hod.id, current.id)
  })
})

test('the database enforces one active HOD per department', async () => {
  const department = await createTestDepartment()
  const activeHod = await createTestHod(department)
  const suffix = crypto.randomUUID()

  await assert.rejects(
    User.create({
      fullName: 'Second Active HOD',
      email: `second-active-${suffix}@example.com`,
      password: HOD_PASSWORD,
      role: ROLES.HOD,
      department: department._id,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    }),
    (error) => error.code === 11000,
  )

  const inactiveHod = await createTestHod(department, {
    accountStatus: ACCOUNT_STATUS.INACTIVE,
  })

  assert.equal(activeHod.accountStatus, ACCOUNT_STATUS.ACTIVE)
  assert.equal(inactiveHod.accountStatus, ACCOUNT_STATUS.INACTIVE)
  assert.equal(
    await User.countDocuments({
      department: department._id,
      role: ROLES.HOD,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    }),
    1,
  )
})

test("moving an HOD replaces the target department's active HOD", async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const sourceDepartment = await createTestDepartment()
    const targetDepartment = await createTestDepartment()

    const movingHod = await createTestHod(sourceDepartment, {
      fullName: 'Moving HOD',
    })
    const targetHod = await createTestHod(targetDepartment, {
      fullName: 'Target HOD',
    })

    const moved = await apiRequest(
      baseUrl,
      `/api/v1/hods/${movingHod.id}`,
      {
        method: 'PATCH',
        token,
        body: { department: targetDepartment.id },
      },
    )

    assert.equal(moved.response.status, 200)
    assert.equal(moved.body.hod.department.id, targetDepartment.id)
    assert.equal(moved.body.hod.accountStatus, ACCOUNT_STATUS.ACTIVE)

    const previousTargetHod = await User.findById(targetHod._id)
    assert.equal(previousTargetHod.accountStatus, ACCOUNT_STATUS.INACTIVE)

    assert.equal(
      await User.countDocuments({
        department: targetDepartment._id,
        role: ROLES.HOD,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      }),
      1,
    )
    assert.equal(
      await User.countDocuments({
        department: sourceDepartment._id,
        role: ROLES.HOD,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      }),
      0,
    )
  })
})

test('activating an HOD conflicts with an existing active HOD', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const activeHod = await createTestHod(department)
    const inactiveHod = await createTestHod(department, {
      accountStatus: ACCOUNT_STATUS.INACTIVE,
    })

    const conflict = await apiRequest(
      baseUrl,
      `/api/v1/hods/${inactiveHod.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.ACTIVE },
      },
    )
    assert.equal(conflict.response.status, 409)
    assert.equal(
      conflict.body.message,
      'This department already has an active HOD',
    )

    const deactivate = await apiRequest(
      baseUrl,
      `/api/v1/hods/${activeHod.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivate.response.status, 200)

    const activate = await apiRequest(
      baseUrl,
      `/api/v1/hods/${inactiveHod.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.ACTIVE },
      },
    )
    assert.equal(activate.response.status, 200)
    assert.equal(activate.body.hod.accountStatus, ACCOUNT_STATUS.ACTIVE)

    assert.equal(
      await User.countDocuments({
        department: department._id,
        role: ROLES.HOD,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      }),
      1,
    )
  })
})

test('HOD accounts can be listed with search, status, and pagination', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const firstDepartment = await createTestDepartment()
    const secondDepartment = await createTestDepartment()
    const thirdDepartment = await createTestDepartment()

    const first = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(firstDepartment, { fullName: 'Dr. Alpha HOD' }),
    })
    const second = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(secondDepartment, { fullName: 'Dr. Beta HOD' }),
    })
    const third = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(thirdDepartment, { fullName: 'Dr. Gamma HOD' }),
    })

    assert.equal(first.response.status, 201)
    assert.equal(second.response.status, 201)
    assert.equal(third.response.status, 201)

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/hods/${second.body.hod.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivated.response.status, 200)

    const activeSearch = await apiRequest(
      baseUrl,
      '/api/v1/hods?status=ACTIVE&search=Alpha',
      { token },
    )
    assert.equal(activeSearch.response.status, 200)
    assert.equal(activeSearch.body.pagination.total, 1)
    assert.equal(activeSearch.body.hods[0].id, first.body.hod.id)
    assert.equal('password' in activeSearch.body.hods[0], false)

    const byDepartment = await apiRequest(
      baseUrl,
      `/api/v1/hods?department=${secondDepartment.id}`,
      { token },
    )
    assert.equal(byDepartment.body.pagination.total, 1)
    assert.equal(byDepartment.body.hods[0].id, second.body.hod.id)

    const page = await apiRequest(baseUrl, '/api/v1/hods?limit=2&page=2', {
      token,
    })
    assert.equal(page.body.pagination.page, 2)
    assert.equal(page.body.pagination.total, 3)
    assert.equal(page.body.pagination.totalPages, 2)
    assert.equal(page.body.hods.length, 1)
  })
})

test('HOD updates enforce uniqueness and reject protected fields', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const otherDepartment = await createTestDepartment()

    const created = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(department, { fullName: 'Original Name' }),
    })
    const other = await createTestHod(otherDepartment, {
      email: `existing-${uniqueSuffix().toLowerCase()}@example.com`,
      employeeId: `EMP-EXISTING-${uniqueSuffix()}`,
    })

    const updated = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}`,
      {
        method: 'PATCH',
        token,
        body: {
          fullName: '  Dr. Updated   Name ',
          employeeId: `emp-updated-${uniqueSuffix().toLowerCase()}`,
        },
      },
    )
    assert.equal(updated.response.status, 200)
    assert.equal(updated.body.hod.fullName, 'Dr. Updated Name')
    assert.match(updated.body.hod.employeeId, /^EMP-UPDATED-/)

    const duplicateEmail = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}`,
      {
        method: 'PATCH',
        token,
        body: { email: other.email },
      },
    )
    assert.equal(duplicateEmail.response.status, 409)
    assert.equal(
      duplicateEmail.body.message,
      'An account with this email already exists',
    )

    const duplicateEmployeeId = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}`,
      {
        method: 'PATCH',
        token,
        body: { employeeId: other.employeeId },
      },
    )
    assert.equal(duplicateEmployeeId.response.status, 409)
    assert.equal(
      duplicateEmployeeId.body.message,
      'This employee ID is already in use',
    )

    for (const body of [
      { role: ROLES.ADMIN },
      { password: 'AnotherPassword!123' },
      { accountStatus: ACCOUNT_STATUS.INACTIVE },
    ]) {
      const rejected = await apiRequest(
        baseUrl,
        `/api/v1/hods/${created.body.hod.id}`,
        { method: 'PATCH', token, body },
      )
      assert.equal(rejected.response.status, 400)
    }
  })
})

test('invalid HOD ids and payloads are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const created = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(department),
    })

    const invalidId = await apiRequest(
      baseUrl,
      '/api/v1/hods/not-an-object-id',
      { token },
    )
    assert.equal(invalidId.response.status, 400)

    const missingFields = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: { email: 'missing-fields@example.com' },
    })
    assert.equal(missingFields.response.status, 400)

    const publicRole = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: {
        ...hodPayload(department),
        role: ROLES.ADMIN,
      },
    })
    assert.equal(publicRole.response.status, 400)

    const emptyUpdate = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}`,
      { method: 'PATCH', token, body: {} },
    )
    assert.equal(emptyUpdate.response.status, 400)

    const invalidPage = await apiRequest(baseUrl, '/api/v1/hods?page=0', {
      token,
    })
    assert.equal(invalidPage.response.status, 400)

    const missingHod = await apiRequest(
      baseUrl,
      '/api/v1/hods/507f1f77bcf86cd799439011',
      { token },
    )
    assert.equal(missingHod.response.status, 404)
    assert.equal(missingHod.body.message, 'HOD not found')
  })
})

test('HOD detail and list responses never expose password hashes', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const created = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(department),
    })

    const detail = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}`,
      { token },
    )
    assert.equal(detail.response.status, 200)
    assert.equal(detail.body.hod.id, created.body.hod.id)
    assert.equal(detail.body.hod.department.id, department.id)
    assert.equal('password' in detail.body.hod, false)
    assert.equal(JSON.stringify(detail.body).includes('$2'), false)

    const list = await apiRequest(baseUrl, '/api/v1/hods', { token })
    assert.equal(list.response.status, 200)
    assert.equal(list.body.hods.length, 1)
    assert.equal('password' in list.body.hods[0], false)
    assert.equal(JSON.stringify(list.body).includes('$2'), false)
  })
})

test('department HOD endpoint returns the active HOD or null', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()

    const empty = await apiRequest(
      baseUrl,
      `/api/v1/departments/${department.id}/hod`,
      { token },
    )
    assert.equal(empty.response.status, 200)
    assert.equal(empty.body.hod, null)

    const created = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token,
      body: hodPayload(department),
    })

    const current = await apiRequest(
      baseUrl,
      `/api/v1/departments/${department.id}/hod`,
      { token },
    )
    assert.equal(current.response.status, 200)
    assert.equal(current.body.hod.id, created.body.hod.id)

    const missingDepartment = await apiRequest(
      baseUrl,
      '/api/v1/departments/507f1f77bcf86cd799439011/hod',
      { token },
    )
    assert.equal(missingDepartment.response.status, 404)
    assert.equal(missingDepartment.body.message, 'Department not found')
  })
})
