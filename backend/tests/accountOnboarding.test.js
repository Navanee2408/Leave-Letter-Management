import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ACCOUNT_STATUS, ROLES } from '../src/constants/index.js'
import { ParentStudent } from '../src/models/ParentStudent.js'
import { User } from '../src/models/User.js'
import { loginRequest } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestAdmin,
  createTestClass,
  createTestDepartment,
  createTestStudent,
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

const TEMP_PASSWORD = 'TempPass!123'
const NEW_PASSWORD = 'StrongNewPass!456'

test('Admin-created HOD, Tutor, and Parent accounts have hashed passwords and mustChangePassword=true', async () => {
  await withServer(async ({ baseUrl }) => {
    const admin = await createTestAdmin()
    const adminToken = await loginToken(baseUrl, admin)
    assert.equal(Boolean(admin.mustChangePassword), false)

    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)
    const student = await createTestStudent(department, classDocument, {
      registerNumber: `ADM-${uniqueSuffix()}`,
    })

    const hodRes = await apiRequest(baseUrl, '/api/v1/hods', {
      method: 'POST',
      token: adminToken,
      body: {
        fullName: 'Dr. Onboarded HOD',
        email: `hod-${uniqueSuffix().toLowerCase()}@example.test`,
        phone: '+1 555 1001',
        department: department.id,
        designation: 'Professor & HOD',
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        password: TEMP_PASSWORD,
      },
    })
    assert.equal(hodRes.response.status, 201)
    assert.equal(hodRes.body.hod.role, ROLES.HOD)
    assert.equal(hodRes.body.hod.mustChangePassword, true)
    assert.equal(hodRes.body.hod.designation, 'Professor & HOD')
    assert.equal('password' in hodRes.body.hod, false)

    const tutorRes = await apiRequest(baseUrl, '/api/v1/tutors', {
      method: 'POST',
      token: adminToken,
      body: {
        fullName: 'Prof. Onboarded Tutor',
        email: `tutor-${uniqueSuffix().toLowerCase()}@example.test`,
        phone: '+1 555 1002',
        department: department.id,
        designation: 'Assistant Professor',
        assignedClasses: [classDocument.id],
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        password: TEMP_PASSWORD,
      },
    })
    assert.equal(tutorRes.response.status, 201)
    assert.equal(tutorRes.body.tutor.role, ROLES.TUTOR)
    assert.equal(tutorRes.body.tutor.mustChangePassword, true)
    assert.equal(tutorRes.body.tutor.designation, 'Assistant Professor')
    assert.equal('password' in tutorRes.body.tutor, false)

    const parentRes = await apiRequest(baseUrl, '/api/v1/parents', {
      method: 'POST',
      token: adminToken,
      body: {
        fullName: 'Parent Onboarded',
        email: `parent-${uniqueSuffix().toLowerCase()}@example.test`,
        phone: '+1 555 1003',
        registerNumber: student.registerNumber.toLowerCase(),
        relationship: 'Mother',
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        password: TEMP_PASSWORD,
      },
    })
    assert.equal(parentRes.response.status, 201)
    assert.equal(parentRes.body.parent.role, ROLES.PARENT)
    assert.equal(parentRes.body.parent.mustChangePassword, true)
    assert.equal('password' in parentRes.body.parent, false)

    const link = await ParentStudent.findOne({
      parent: parentRes.body.parent.id,
      student: student._id,
    })
    assert.ok(link)
    assert.equal(link.relationship, 'Mother')

    for (const userId of [
      hodRes.body.hod.id,
      tutorRes.body.tutor.id,
      parentRes.body.parent.id,
    ]) {
      const stored = await User.findById(userId).select('+password')
      assert.match(stored.password, /^\$2[aby]\$/)
      assert.notEqual(stored.password, TEMP_PASSWORD)
      assert.equal(stored.mustChangePassword, true)
    }

    const inactiveParent = await apiRequest(baseUrl, '/api/v1/parents', {
      method: 'POST',
      token: adminToken,
      body: {
        fullName: 'Inactive Parent',
        email: `inactive-p-${uniqueSuffix().toLowerCase()}@example.test`,
        accountStatus: ACCOUNT_STATUS.INACTIVE,
        password: TEMP_PASSWORD,
      },
    })
    assert.equal(inactiveParent.response.status, 201)
    assert.equal(inactiveParent.body.parent.accountStatus, ACCOUNT_STATUS.INACTIVE)

    const inactiveLogin = await loginRequest(
      baseUrl,
      inactiveParent.body.parent.email,
      TEMP_PASSWORD,
    )
    assert.equal(inactiveLogin.response.status, 403)
    assert.equal(inactiveLogin.body.message, 'Account is inactive')
  })
})

test('Creating parent with unknown admission number rejects 404 without orphan user', async () => {
  await withServer(async ({ baseUrl }) => {
    const admin = await createTestAdmin()
    const adminToken = await loginToken(baseUrl, admin)
    const email = `missing-student-${uniqueSuffix().toLowerCase()}@example.test`

    const res = await apiRequest(baseUrl, '/api/v1/parents', {
      method: 'POST',
      token: adminToken,
      body: {
        fullName: 'Orphan Check Parent',
        email,
        registerNumber: 'NONEXISTENT-REG-999',
        relationship: 'Father',
        password: TEMP_PASSWORD,
      },
    })
    assert.equal(res.response.status, 404)
    assert.equal(await User.exists({ email }), null)
  })
})

test('Mandatory first-login password change blocks dashboards until updated', async () => {
  await withServer(async ({ baseUrl }) => {
    const admin = await createTestAdmin()
    const adminToken = await loginToken(baseUrl, admin)
    const department = await createTestDepartment()
    const classDocument = await createTestClass(department)
    const student = await createTestStudent(department, classDocument)

    const parentEmail = `force-parent-${uniqueSuffix().toLowerCase()}@example.test`
    const created = await apiRequest(baseUrl, '/api/v1/parents', {
      method: 'POST',
      token: adminToken,
      body: {
        fullName: 'Forced Change Parent',
        email: parentEmail,
        studentId: student.id,
        relationship: 'Father',
        password: TEMP_PASSWORD,
      },
    })
    assert.equal(created.response.status, 201)

    const tempLogin = await loginRequest(baseUrl, parentEmail, TEMP_PASSWORD)
    assert.equal(tempLogin.response.status, 200)
    assert.equal(tempLogin.body.user.mustChangePassword, true)

    const meRes = await apiRequest(baseUrl, '/api/v1/auth/me', {
      token: tempLogin.body.accessToken,
    })
    assert.equal(meRes.response.status, 200)
    assert.equal(meRes.body.user.mustChangePassword, true)

    const blockedChildren = await apiRequest(
      baseUrl,
      '/api/v1/parents/me/children',
      { token: tempLogin.body.accessToken },
    )
    assert.equal(blockedChildren.response.status, 403)
    assert.match(blockedChildren.body.message, /Password change is required/i)

    const blockedNotifs = await apiRequest(
      baseUrl,
      '/api/v1/notifications/my',
      { token: tempLogin.body.accessToken },
    )
    assert.equal(blockedNotifs.response.status, 403)

    const wrongOldPass = await apiRequest(baseUrl, '/api/v1/auth/change-password', {
      method: 'POST',
      token: tempLogin.body.accessToken,
      body: {
        currentPassword: 'WrongTempPassword!',
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      },
    })
    assert.equal(wrongOldPass.response.status, 400)
    assert.equal(wrongOldPass.body.message, 'Current password is incorrect')

    const weakPass = await apiRequest(baseUrl, '/api/v1/auth/change-password', {
      method: 'POST',
      token: tempLogin.body.accessToken,
      body: {
        currentPassword: TEMP_PASSWORD,
        newPassword: 'weak',
        confirmPassword: 'weak',
      },
    })
    assert.equal(weakPass.response.status, 400)

    const mismatchPass = await apiRequest(baseUrl, '/api/v1/auth/change-password', {
      method: 'POST',
      token: tempLogin.body.accessToken,
      body: {
        currentPassword: TEMP_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: 'DifferentPassword!789',
      },
    })
    assert.equal(mismatchPass.response.status, 400)

    const changed = await apiRequest(baseUrl, '/api/v1/auth/change-password', {
      method: 'POST',
      token: tempLogin.body.accessToken,
      body: {
        currentPassword: TEMP_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      },
    })
    assert.equal(changed.response.status, 200)
    assert.equal(changed.body.user.mustChangePassword, false)
    assert.equal(typeof changed.body.accessToken, 'string')

    const oldPassLogin = await loginRequest(baseUrl, parentEmail, TEMP_PASSWORD)
    assert.equal(oldPassLogin.response.status, 401)

    const newPassLogin = await loginRequest(baseUrl, parentEmail, NEW_PASSWORD)
    assert.equal(newPassLogin.response.status, 200)
    assert.equal(newPassLogin.body.user.mustChangePassword, false)

    const allowedChildren = await apiRequest(
      baseUrl,
      '/api/v1/parents/me/children',
      { token: newPassLogin.body.accessToken },
    )
    assert.equal(allowedChildren.response.status, 200)
    assert.equal(allowedChildren.body.children.length, 1)
    assert.equal(allowedChildren.body.children[0].student.id, student.id)
  })
})
