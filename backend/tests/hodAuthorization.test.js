import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { User } from '../src/models/User.js'
import {
  TEST_PASSWORD,
  createTestUser,
  loginRequest,
} from './support/authTestUtils.js'
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

function hodPayload(department, overrides = {}) {
  const suffix = uniqueSuffix()

  return {
    fullName: 'Authorization Test HOD',
    email: `auth-hod-${suffix.toLowerCase()}@example.com`,
    password: HOD_PASSWORD,
    employeeId: `AUTH-${suffix}`,
    department: department.id,
    ...overrides,
  }
}

test('deactivated HODs cannot log in or use an existing access token', async () => {
  await withServer(async ({ baseUrl }) => {
    const admin = await createTestAdmin()
    const adminAccessToken = await loginToken(baseUrl, admin)
    const department = await createTestDepartment()
    const payload = hodPayload(department)

    const created = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token: adminAccessToken,
      body: payload,
    })
    assert.equal(created.response.status, 201)

    const hodLogin = await loginRequest(baseUrl, payload.email, HOD_PASSWORD)
    assert.equal(hodLogin.response.status, 200)
    assert.equal(hodLogin.body.user.role, ROLES.HOD)

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/hods/${created.body.hod.id}/status`,
      {
        method: 'PATCH',
        token: adminAccessToken,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivated.response.status, 200)

    const blockedLogin = await loginRequest(
      baseUrl,
      payload.email,
      HOD_PASSWORD,
    )
    assert.equal(blockedLogin.response.status, 403)
    assert.equal(blockedLogin.body.message, 'Account is inactive')
    assert.equal(blockedLogin.body.accessToken, undefined)

    const existingToken = await apiRequest(baseUrl, '/api/v1/auth/me', {
      token: hodLogin.body.accessToken,
    })
    assert.equal(existingToken.response.status, 403)
    assert.equal(existingToken.body.message, 'Account is inactive')

    const stored = await User.findById(created.body.hod.id)
    assert.equal(stored.accountStatus, ACCOUNT_STATUS.INACTIVE)
  })
})

test('HOD accounts can only be managed by ADMIN', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const otherDepartment = await createTestDepartment()
    const hod = await createTestHod(department)
    const tutor = await createTestUser({ role: ROLES.TUTOR })
    const parent = await createTestUser({ role: ROLES.PARENT })

    const hodToken = await loginToken(baseUrl, hod)
    const tutorToken = await loginToken(baseUrl, tutor)
    const parentToken = await loginToken(baseUrl, parent)

    const hodAttempts = [
      ['GET', '/api/v1/hods', undefined],
      ['GET', `/api/v1/hods/${hod.id}`, undefined],
      ['POST', '/api/v1/hods', hodPayload(otherDepartment)],
      [
        'PATCH',
        `/api/v1/hods/${hod.id}`,
        { department: otherDepartment.id },
      ],
      ['PATCH', `/api/v1/hods/${hod.id}`, { role: ROLES.ADMIN }],
      [
        'PATCH',
        `/api/v1/hods/${hod.id}/status`,
        { status: ACCOUNT_STATUS.INACTIVE },
      ],
    ]

    for (const [method, path, body] of hodAttempts) {
      const result = await apiRequest(baseUrl, path, {
        method,
        token: hodToken,
        body,
      })
      assert.equal(result.response.status, 403)
    }

    for (const token of [tutorToken, parentToken]) {
      const list = await apiRequest(baseUrl, '/api/v1/hods', { token })
      assert.equal(list.response.status, 403)

      const create = await apiRequest(baseUrl, '/api/v1/hods', {
        method: 'POST',
        token,
        body: hodPayload(otherDepartment),
      })
      assert.equal(create.response.status, 403)
    }

    const anonymous = await apiRequest(baseUrl, '/api/v1/hods')
    assert.equal(anonymous.response.status, 401)

    const unchanged = await User.findById(hod._id)
    assert.equal(unchanged.role, ROLES.HOD)
    assert.equal(unchanged.department.toString(), department.id)
    assert.equal(unchanged.accountStatus, ACCOUNT_STATUS.ACTIVE)
  })
})

test('HOD department isolation is enforced on department endpoints', async () => {
  await withServer(async ({ baseUrl }) => {
    const ownDepartment = await createTestDepartment()
    const otherDepartment = await createTestDepartment()
    const hod = await createTestHod(ownDepartment)
    const otherHod = await createTestHod(otherDepartment)
    const token = await loginToken(baseUrl, hod, TEST_PASSWORD)

    const own = await apiRequest(
      baseUrl,
      `/api/v1/departments/${ownDepartment.id}`,
      { token },
    )
    assert.equal(own.response.status, 200)
    assert.equal(own.body.department.id, ownDepartment.id)

    const ownHod = await apiRequest(
      baseUrl,
      `/api/v1/departments/${ownDepartment.id}/hod`,
      { token },
    )
    assert.equal(ownHod.response.status, 200)
    assert.equal(ownHod.body.hod.id, hod.id)

    const other = await apiRequest(
      baseUrl,
      `/api/v1/departments/${otherDepartment.id}`,
      { token },
    )
    assert.equal(other.response.status, 403)

    const otherHodResponse = await apiRequest(
      baseUrl,
      `/api/v1/departments/${otherDepartment.id}/hod`,
      { token },
    )
    assert.equal(otherHodResponse.response.status, 403)
    assert.equal(otherHodResponse.body.hod, undefined)

    const list = await apiRequest(baseUrl, '/api/v1/departments', { token })
    assert.equal(list.response.status, 403)

    const update = await apiRequest(
      baseUrl,
      `/api/v1/departments/${ownDepartment.id}`,
      {
        method: 'PATCH',
        token,
        body: { description: 'Should not be allowed' },
      },
    )
    assert.equal(update.response.status, 403)

    assert.equal(otherHod.role, ROLES.HOD)
  })
})
