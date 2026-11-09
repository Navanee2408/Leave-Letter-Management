import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { ParentStudent } from '../src/models/ParentStudent.js'
import { User } from '../src/models/User.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestAdmin,
  createTestClass,
  createTestDepartment,
  createTestHod,
  createTestParentStudent,
  createTestStudent,
  createTestTutor,
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

const PARENT_PASSWORD = 'ParentPass!123'

async function adminToken(baseUrl) {
  const admin = await createTestAdmin()
  return loginToken(baseUrl, admin)
}

function parentPayload(overrides = {}) {
  const suffix = uniqueSuffix()

  return {
    fullName: 'Test Parent Account',
    email: `parent-${suffix.toLowerCase()}@example.test`,
    password: PARENT_PASSWORD,
    phone: '+1 555 0111',
    ...overrides,
  }
}

test('ADMIN can create, list, read, update, and deactivate parent accounts', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const payload = parentPayload()

    const created = await apiRequest(baseUrl, '/api/v1/parents', {
      method: 'POST',
      token,
      body: payload,
    })
    assert.equal(created.response.status, 201)
    assert.equal(created.body.parent.role, ROLES.PARENT)
    assert.equal(created.body.parent.accountStatus, ACCOUNT_STATUS.ACTIVE)
    assert.equal(created.body.parent.email, payload.email)
    assert.equal('password' in created.body.parent, false)
    assert.equal(JSON.stringify(created.body).includes('$2'), false)

    const stored = await User.findById(created.body.parent.id).select(
      '+password',
    )
    assert.match(stored.password, /^\$2[aby]\$/)
    assert.notEqual(stored.password, PARENT_PASSWORD)
    assert.equal(await stored.comparePassword(PARENT_PASSWORD), true)

    const duplicateEmail = await apiRequest(baseUrl, '/api/v1/parents', {
      method: 'POST',
      token,
      body: parentPayload({ email: payload.email }),
    })
    assert.equal(duplicateEmail.response.status, 409)
    assert.equal(
      duplicateEmail.body.message,
      'An account with this email already exists',
    )

    const inactiveParent = await createTestUser({
      role: ROLES.PARENT,
      fullName: 'Inactive Parent',
      accountStatus: ACCOUNT_STATUS.INACTIVE,
    })

    const search = await apiRequest(
      baseUrl,
      '/api/v1/parents?search=Test%20Parent%20Account&status=ACTIVE',
      { token },
    )
    assert.equal(search.response.status, 200)
    assert.equal(search.body.pagination.total, 1)
    assert.equal(search.body.parents[0].id, created.body.parent.id)

    const inactiveList = await apiRequest(
      baseUrl,
      '/api/v1/parents?status=INACTIVE',
      { token },
    )
    assert.equal(inactiveList.body.pagination.total, 1)
    assert.equal(inactiveList.body.parents[0].id, inactiveParent.id)

    const page = await apiRequest(
      baseUrl,
      '/api/v1/parents?page=1&limit=1',
      { token },
    )
    assert.equal(page.body.pagination.limit, 1)
    assert.equal(page.body.pagination.total, 2)
    assert.equal(page.body.parents.length, 1)

    const detail = await apiRequest(
      baseUrl,
      `/api/v1/parents/${created.body.parent.id}`,
      { token },
    )
    assert.equal(detail.response.status, 200)
    assert.equal(detail.body.parent.id, created.body.parent.id)

    const updated = await apiRequest(
      baseUrl,
      `/api/v1/parents/${created.body.parent.id}`,
      {
        method: 'PATCH',
        token,
        body: { fullName: '  Updated   Parent ', phone: '+1 555 0199' },
      },
    )
    assert.equal(updated.response.status, 200)
    assert.equal(updated.body.parent.fullName, 'Updated Parent')
    assert.equal(updated.body.parent.phone, '+1 555 0199')

    const deactivated = await apiRequest(
      baseUrl,
      `/api/v1/parents/${created.body.parent.id}/status`,
      {
        method: 'PATCH',
        token,
        body: { status: ACCOUNT_STATUS.INACTIVE },
      },
    )
    assert.equal(deactivated.response.status, 200)
    assert.equal(deactivated.body.parent.accountStatus, ACCOUNT_STATUS.INACTIVE)

    const protectedField = await apiRequest(
      baseUrl,
      `/api/v1/parents/${created.body.parent.id}`,
      { method: 'PATCH', token, body: { role: ROLES.ADMIN } },
    )
    assert.equal(protectedField.response.status, 400)

    const invalidId = await apiRequest(
      baseUrl,
      '/api/v1/parents/not-an-object-id',
      { token },
    )
    assert.equal(invalidId.response.status, 400)
  })
})

test('parent-child links prevent duplicates and support multiple links', async () => {
  await withServer(async ({ baseUrl }) => {
    const token = await adminToken(baseUrl)
    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)
    const firstParent = await createTestUser({
      role: ROLES.PARENT,
      fullName: 'First Parent',
    })
    const secondParent = await createTestUser({
      role: ROLES.PARENT,
      fullName: 'Second Parent',
    })
    const firstStudent = await createTestStudent(department, classDocument, {
      fullName: 'First Child',
    })
    const secondStudent = await createTestStudent(department, classDocument, {
      fullName: 'Second Child',
    })

    const linked = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      {
        method: 'POST',
        token,
        body: {
          studentId: firstStudent.id,
          relationship: 'Father',
        },
      },
    )
    assert.equal(linked.response.status, 201)
    assert.equal(linked.body.child.relationship, 'Father')
    assert.equal(linked.body.child.student.id, firstStudent.id)

    const duplicate = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      {
        method: 'POST',
        token,
        body: {
          studentId: firstStudent.id,
          relationship: 'Guardian',
        },
      },
    )
    assert.equal(duplicate.response.status, 409)
    assert.equal(
      duplicate.body.message,
      'This student is already linked to this parent',
    )

    const secondChild = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      {
        method: 'POST',
        token,
        body: {
          studentId: secondStudent.id,
          relationship: 'Mother',
        },
      },
    )
    assert.equal(secondChild.response.status, 201)

    const secondParentLink = await apiRequest(
      baseUrl,
      `/api/v1/parents/${secondParent.id}/children`,
      {
        method: 'POST',
        token,
        body: {
          studentId: firstStudent.id,
          relationship: 'Guardian',
        },
      },
    )
    assert.equal(secondParentLink.response.status, 201)

    const children = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      { token },
    )
    assert.equal(children.response.status, 200)
    assert.equal(children.body.pagination.total, 2)
    assert.deepEqual(
      children.body.children
        .map((child) => child.student.id)
        .sort(),
      [firstStudent.id, secondStudent.id].sort(),
    )

    const missingStudent = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      {
        method: 'POST',
        token,
        body: {
          studentId: '507f1f77bcf86cd799439011',
          relationship: 'Father',
        },
      },
    )
    assert.equal(missingStudent.response.status, 404)

    const missingParent = await apiRequest(
      baseUrl,
      '/api/v1/parents/507f1f77bcf86cd799439011/children',
      { token },
    )
    assert.equal(missingParent.response.status, 404)

    const invalidRelationship = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      {
        method: 'POST',
        token,
        body: {
          studentId: secondStudent.id,
          relationship: 'Cousin',
        },
      },
    )
    assert.equal(invalidRelationship.response.status, 400)

    const removed = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children/${firstStudent.id}`,
      { method: 'DELETE', token },
    )
    assert.equal(removed.response.status, 200)

    const removedAgain = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children/${firstStudent.id}`,
      { method: 'DELETE', token },
    )
    assert.equal(removedAgain.response.status, 404)

    assert.equal(
      await ParentStudent.countDocuments({ parent: firstParent._id }),
      1,
    )
  })
})

test('parents can access only their own linked children', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)
    const firstParent = await createTestUser({
      role: ROLES.PARENT,
      fullName: 'Own Parent',
    })
    const secondParent = await createTestUser({
      role: ROLES.PARENT,
      fullName: 'Other Parent',
    })
    const firstStudent = await createTestStudent(department, classDocument, {
      fullName: 'Own Child',
    })
    const secondStudent = await createTestStudent(department, classDocument, {
      fullName: 'Other Child',
    })
    await createTestParentStudent(firstParent, firstStudent)
    await createTestParentStudent(secondParent, secondStudent)

    const token = await loginToken(baseUrl, firstParent)

    const myChildren = await apiRequest(
      baseUrl,
      '/api/v1/parents/me/children',
      { token },
    )
    assert.equal(myChildren.response.status, 200)
    assert.equal(myChildren.body.pagination.total, 1)
    assert.equal(myChildren.body.children[0].student.id, firstStudent.id)

    const ownChildren = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      { token },
    )
    assert.equal(ownChildren.response.status, 200)
    assert.equal(ownChildren.body.pagination.total, 1)

    const otherChildren = await apiRequest(
      baseUrl,
      `/api/v1/parents/${secondParent.id}/children`,
      { token },
    )
    assert.equal(otherChildren.response.status, 403)

    const parentList = await apiRequest(baseUrl, '/api/v1/parents', {
      token,
    })
    assert.equal(parentList.response.status, 403)

    const otherParentDetail = await apiRequest(
      baseUrl,
      `/api/v1/parents/${secondParent.id}`,
      { token },
    )
    assert.equal(otherParentDetail.response.status, 403)

    const createParent = await apiRequest(baseUrl, '/api/v1/parents', {
      method: 'POST',
      token,
      body: parentPayload(),
    })
    assert.equal(createParent.response.status, 403)

    const linkChild = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children`,
      {
        method: 'POST',
        token,
        body: {
          studentId: secondStudent.id,
          relationship: 'Guardian',
        },
      },
    )
    assert.equal(linkChild.response.status, 403)

    const removeLink = await apiRequest(
      baseUrl,
      `/api/v1/parents/${firstParent.id}/children/${firstStudent.id}`,
      { method: 'DELETE', token },
    )
    assert.equal(removeLink.response.status, 403)

    const otherStudentDetail = await apiRequest(
      baseUrl,
      `/api/v1/students/${secondStudent.id}`,
      { token },
    )
    assert.equal(otherStudentDetail.response.status, 403)

    const anonymous = await apiRequest(
      baseUrl,
      '/api/v1/parents/me/children',
    )
    assert.equal(anonymous.response.status, 401)
  })
})

test('HOD and TUTOR cannot access parent administration', async () => {
  await withServer(async ({ baseUrl }) => {
    const department = await createTestDepartment()
    const hod = await createTestHod(department)
    const tutor = await createTestTutor(department)
    const parent = await createTestUser({ role: ROLES.PARENT })

    const hodToken = await loginToken(baseUrl, hod)
    const tutorToken = await loginToken(baseUrl, tutor)

    for (const token of [hodToken, tutorToken]) {
      const list = await apiRequest(baseUrl, '/api/v1/parents', { token })
      assert.equal(list.response.status, 403)

      const create = await apiRequest(baseUrl, '/api/v1/parents', {
        method: 'POST',
        token,
        body: parentPayload(),
      })
      assert.equal(create.response.status, 403)

      const meChildren = await apiRequest(
        baseUrl,
        '/api/v1/parents/me/children',
        { token },
      )
      assert.equal(meChildren.response.status, 403)
    }

    const admin = await createTestAdmin()
    const adminTokenValue = await loginToken(baseUrl, admin)
    const adminList = await apiRequest(baseUrl, '/api/v1/parents', {
      token: adminTokenValue,
    })
    assert.equal(adminList.response.status, 200)
    assert.equal(adminList.body.pagination.total, 1)
    assert.equal(adminList.body.parents[0].id, parent.id)
  })
})
