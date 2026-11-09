import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  INITIAL_DEPARTMENTS,
  seedInitialDepartments,
} from '../scripts/seedDepartments.js'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { Department } from '../src/models/Department.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestAdmin,
  createTestDepartment,
  createTestHod,
  loginToken,
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

async function adminToken(baseUrl) {
  const admin = await createTestAdmin()
  return loginToken(baseUrl, admin)
}

test('ADMIN can create a department with normalized values', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)

    const { response, body } = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: {
        name: '  Computer   Science  ',
        code: ' cse ',
        description: 'Computing department',
      },
    })

    assert.equal(response.status, 201)
    assert.equal(body.success, true)
    assert.equal(body.department.name, 'Computer Science')
    assert.equal(body.department.code, 'CSE')
    assert.equal(body.department.status, ACCOUNT_STATUS.ACTIVE)
    assert.equal('nameKey' in body.department, false)
    assert.equal('password' in body.department, false)

    const stored = await Department.findById(body.department.id)
    assert.equal(stored.name, 'Computer Science')
    assert.equal(stored.code, 'CSE')
  })
})

test('duplicate department names and codes are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)

    const created = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: { name: 'Computer Science', code: 'CSE' },
    })
    assert.equal(created.response.status, 201)

    const duplicateCode = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: { name: 'Another Department', code: 'cse' },
    })
    assert.equal(duplicateCode.response.status, 409)
    assert.equal(
      duplicateCode.body.message,
      'A department with this code already exists',
    )

    const duplicateName = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: { name: '  computer   science ', code: 'CS2' },
    })
    assert.equal(duplicateName.response.status, 409)
    assert.equal(
      duplicateName.body.message,
      'A department with this name already exists',
    )

    assert.equal(await Department.countDocuments(), 1)
  })
})

test('department updates normalize values and enforce uniqueness', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)

    const first = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: { name: 'Alpha Engineering', code: 'ALPHA' },
    })
    const second = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: { name: 'Beta Engineering', code: 'BETA' },
    })

    const updated = await apiRequest(
      baseUrl,
      `/api/v1/departments/${first.body.department.id}`,
      {
        method: 'PATCH',
        token,
        body: {
          name: '  Alpha   Science ',
          code: 'alpha-sci',
          description: 'Updated description',
        },
      },
    )

    assert.equal(updated.response.status, 200)
    assert.equal(updated.body.department.name, 'Alpha Science')
    assert.equal(updated.body.department.code, 'ALPHA-SCI')
    assert.equal(updated.body.department.description, 'Updated description')

    const duplicateCode = await apiRequest(
      baseUrl,
      `/api/v1/departments/${first.body.department.id}`,
      {
        method: 'PATCH',
        token,
        body: { code: second.body.department.code },
      },
    )
    assert.equal(duplicateCode.response.status, 409)

    const duplicateName = await apiRequest(
      baseUrl,
      `/api/v1/departments/${first.body.department.id}`,
      {
        method: 'PATCH',
        token,
        body: { name: second.body.department.name },
      },
    )
    assert.equal(duplicateName.response.status, 409)

    const protectedField = await apiRequest(
      baseUrl,
      `/api/v1/departments/${first.body.department.id}`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(protectedField.response.status, 400)

    const emptyUpdate = await apiRequest(
      baseUrl,
      `/api/v1/departments/${first.body.department.id}`,
      {
        method: 'PATCH',
        token,
        body: {},
      },
    )
    assert.equal(emptyUpdate.response.status, 400)
  })
})

test('department activation and deactivation are reflected in filters', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/departments/${department.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )

    assert.equal(deactivated.response.status, 200)
    assert.equal(deactivated.body.department.status, ACCOUNT_STATUS.INACTIVE)

    const inactiveList = await apiRequest(
      baseUrl,
      '/api/v1/departments?status=INACTIVE',
      { token },
    )
    assert.equal(inactiveList.body.pagination.total, 1)
    assert.equal(inactiveList.body.departments[0].id, department.id)

    const activeList = await apiRequest(
      baseUrl,
      '/api/v1/departments?status=ACTIVE',
      { token },
    )
    assert.equal(activeList.body.pagination.total, 0)

    const activated = await apiRequest(
      baseUrl,
      `/api/v1/departments/${department.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.ACTIVE },
      },
    )
    assert.equal(activated.response.status, 200)
    assert.equal(activated.body.department.status, ACCOUNT_STATUS.ACTIVE)

    const invalidStatus = await apiRequest(
      baseUrl,
      `/api/v1/departments/${department.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: 'SUSPENDED' },
      },
    )
    assert.equal(invalidStatus.response.status, 400)
  })
})

test('department list supports search and pagination', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)

    await Department.create([
      { name: 'Alpha Engineering', code: 'ALPHA' },
      { name: 'Beta Engineering', code: 'BETA' },
      { name: 'Gamma Science', code: 'GAMMA' },
    ])

    const page = await apiRequest(
      baseUrl,
      '/api/v1/departments?search=engineering&page=2&limit=1',
      { token },
    )

    assert.equal(page.response.status, 200)
    assert.equal(page.body.pagination.page, 2)
    assert.equal(page.body.pagination.limit, 1)
    assert.equal(page.body.pagination.total, 2)
    assert.equal(page.body.pagination.totalPages, 2)
    assert.equal(page.body.departments.length, 1)

    const byCode = await apiRequest(
      baseUrl,
      '/api/v1/departments?search=alpha',
      { token },
    )
    assert.equal(byCode.body.pagination.total, 1)
    assert.equal(byCode.body.departments[0].code, 'ALPHA')

    const invalidPage = await apiRequest(
      baseUrl,
      '/api/v1/departments?page=0',
      { token },
    )
    assert.equal(invalidPage.response.status, 400)

    const unknownFilter = await apiRequest(
      baseUrl,
      '/api/v1/departments?role=ADMIN',
      { token },
    )
    assert.equal(unknownFilter.response.status, 400)
  })
})

test('invalid department ids and bodies are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)

    const invalidId = await apiRequest(
      baseUrl,
      '/api/v1/departments/not-an-object-id',
      { token },
    )
    assert.equal(invalidId.response.status, 400)
    assert.equal(invalidId.body.message, 'Validation failed')

    const missingFields = await apiRequest(
      baseUrl,
      '/api/v1/departments',
      {
        method: 'POST',
        token,
        body: { code: 'CSE' },
      },
    )
    assert.equal(missingFields.response.status, 400)
    assert.ok(
      missingFields.body.details.some((detail) => detail.field === 'name'),
    )

    const unknownField = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: {
        name: 'Computer Science',
        code: 'CSE',
        role: ROLES.ADMIN,
      },
    })
    assert.equal(unknownField.response.status, 400)

    const missingDepartment = await apiRequest(
      baseUrl,
      '/api/v1/departments/507f1f77bcf86cd799439011',
      { token },
    )
    assert.equal(missingDepartment.response.status, 404)
    assert.equal(missingDepartment.body.message, 'Department not found')
  })
})

test('HOD can read only their own department', async () => {
  await withServer(async ({ baseUrl }) => {
    const ownDepartment = await createTestDepartment()
    const otherDepartment = await createTestDepartment()
    const hod = await createTestHod(ownDepartment)
    const token = await loginToken(baseUrl, hod)

    const own = await apiRequest(
      baseUrl,
      `/api/v1/departments/${ownDepartment.id}`,
      { token },
    )
    assert.equal(own.response.status, 200)
    assert.equal(own.body.department.id, ownDepartment.id)

    const other = await apiRequest(
      baseUrl,
      `/api/v1/departments/${otherDepartment.id}`,
      { token },
    )
    assert.equal(other.response.status, 403)
    assert.equal(
      other.body.message,
      'You do not have permission to access this department',
    )

    const list = await apiRequest(baseUrl, '/api/v1/departments', { token })
    assert.equal(list.response.status, 403)

    const update = await apiRequest(
      baseUrl,
      `/api/v1/departments/${ownDepartment.id}`,
      {
        method: 'PATCH',
        token,
        body: { description: 'HOD should not change this' },
      },
    )
    assert.equal(update.response.status, 403)

    const create = await apiRequest(baseUrl, '/api/v1/departments', {
      method: 'POST',
      token,
      body: { name: 'Unauthorized Department', code: 'UNAUTH' },
    })
    assert.equal(create.response.status, 403)

    const ownHod = await apiRequest(
      baseUrl,
      `/api/v1/departments/${ownDepartment.id}/hod`,
      { token },
    )
    assert.equal(ownHod.response.status, 200)
    assert.equal(ownHod.body.hod.id, hod.id)
  })
})

test('TUTOR and PARENT cannot access department administration', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const tutor = await createTestUser({ role: ROLES.TUTOR })
    const parent = await createTestUser({ role: ROLES.PARENT })
    const tutorToken = await loginToken(baseUrl, tutor)
    const parentToken = await loginToken(baseUrl, parent)

    for (const token of [tutorToken, parentToken]) {
      const list = await apiRequest(baseUrl, '/api/v1/departments', { token })
      assert.equal(list.response.status, 403)

      const detail = await apiRequest(
        baseUrl,
        `/api/v1/departments/${department.id}`,
        { token },
      )
      assert.equal(detail.response.status, 403)

      const create = await apiRequest(baseUrl, '/api/v1/departments', {
        method: 'POST',
        token,
        body: { name: 'Forbidden Department', code: 'FORBID' },
      })
      assert.equal(create.response.status, 403)

      const status = await apiRequest(
        baseUrl,
        `/api/v1/departments/${department.id}/status`,
        {
          method: 'PATCH',
          token,
          body: { status: ACCOUNT_STATUS.INACTIVE },
        },
      )
      assert.equal(status.response.status, 403)
    }

    const anonymous = await apiRequest(baseUrl, '/api/v1/departments')
    assert.equal(anonymous.response.status, 401)
  })
})

test('departments cannot be deleted through the API', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()

    const response = await apiRequest(
      baseUrl,
      `/api/v1/departments/${department.id}`,
      { method: 'DELETE', token },
    )

    assert.equal(response.response.status, 404)
    assert.match(response.body.message, /Route not found: DELETE/)

    assert.ok(await Department.findById(department.id))
  })
})

test('department seed is idempotent and never overwrites existing changes', async () => {
  const silentLogger = { log() {} }

  const first = await seedInitialDepartments({ logger: silentLogger })
  assert.equal(first.created, INITIAL_DEPARTMENTS.length)
  assert.equal(first.skipped, 0)
  assert.equal(await Department.countDocuments(), INITIAL_DEPARTMENTS.length)

  await Department.updateOne(
    { code: 'CSE' },
    {
      $set: {
        description: 'Customized description',
        status: ACCOUNT_STATUS.INACTIVE,
      },
    },
  )

  const second = await seedInitialDepartments({ logger: silentLogger })
  assert.equal(second.created, 0)
  assert.equal(second.skipped, INITIAL_DEPARTMENTS.length)
  assert.equal(await Department.countDocuments(), INITIAL_DEPARTMENTS.length)

  const cse = await Department.findOne({ code: 'CSE' })
  assert.equal(cse.description, 'Customized description')
  assert.equal(cse.status, ACCOUNT_STATUS.INACTIVE)

  const codes = (await Department.find().sort({ code: 1 })).map(
    (department) => department.code,
  )
  assert.deepEqual(
    codes,
    INITIAL_DEPARTMENTS.map((department) => department.code).sort(),
  )
})
