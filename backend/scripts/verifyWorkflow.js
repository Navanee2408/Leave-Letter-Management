import '../tests/setup.js'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { withServer } from '../tests/support/testServer.js'

process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-characters-long'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-characters-long'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clms_dev'

async function post(baseUrl, path, body, token = null, cookie = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (cookie) headers.Cookie = cookie
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  let data = null
  try {
    data = await res.json()
  } catch {}
  return { status: res.status, data, headers: res.headers }
}

async function patch(baseUrl, path, body, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  let data = null
  try {
    data = await res.json()
  } catch {}
  return { status: res.status, data }
}

async function get(baseUrl, path, token = null) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${baseUrl}${path}`, { headers })
  const contentType = res.headers.get('content-type') || ''
  let data = null
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.arrayBuffer()
  }
  return { status: res.status, data, headers: res.headers }
}

async function postMultipart(baseUrl, path, fields, file, token = null) {
  const formData = new FormData()
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v))
  if (file) {
    const blob = new Blob([file.content], { type: file.type || 'application/pdf' })
    formData.append('supportingDocument', blob, file.name || 'document.pdf')
  }
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  let data = null
  try {
    data = await res.json()
  } catch {}
  return { status: res.status, data }
}

async function verify() {
  console.log('[E2E Verification] Connecting to MongoDB:', MONGODB_URI)
  await mongoose.connect(MONGODB_URI)

  await withServer(async ({ baseUrl }) => {
    console.log('[E2E Verification] Server live at:', baseUrl)

    // =========================================================================
    // SECTION 1: AUTHENTICATION & DASHBOARDS
    // =========================================================================
    console.log('\n--- SECTION 1: ALL 4 ROLE DASHBOARDS ---')

    // 1.1 Admin Auth & Dashboard
    console.log('1.1: Admin signs in and accesses dashboard stats...')
    const adminLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
    })
    assert.equal(adminLogin.status, 200, 'Admin login must return 200')
    const adminToken = adminLogin.data.accessToken
    assert.ok(adminToken, 'Admin token present')

    const adminDepts = await get(baseUrl, '/api/v1/departments', adminToken)
    assert.equal(adminDepts.status, 200)
    const adminClasses = await get(baseUrl, '/api/v1/classes', adminToken)
    assert.equal(adminClasses.status, 200)
    const adminLeaves = await get(baseUrl, '/api/v1/leave-applications', adminToken)
    assert.equal(adminLeaves.status, 200)
    console.log(`✔ Admin dashboard data verified (${adminDepts.data.departments.length} depts, ${adminClasses.data.classes.length} classes)`)

    // 1.2 HOD Auth & Dashboard
    console.log('1.2: HOD signs in and accesses department dashboard...')
    const hodLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'hod.cse@example.com',
      password: 'Hod@12345',
    })
    assert.equal(hodLogin.status, 200, 'HOD login must return 200')
    const hodToken = hodLogin.data.accessToken
    const hodDept = await get(baseUrl, `/api/v1/departments/${hodLogin.data.user.department}`, hodToken)
    assert.equal(hodDept.status, 200)
    const hodLeaves = await get(baseUrl, '/api/v1/leave-applications?status=PENDING', hodToken)
    assert.equal(hodLeaves.status, 200)
    console.log(`✔ HOD dashboard data verified for department: ${hodDept.data.department.code}`)

    // 1.3 Tutor Auth & Dashboard
    console.log('1.3: Class Tutor signs in and accesses assigned workspace...')
    const tutorLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'tutor.cse.1@example.test',
      password: 'Tutor@12345',
    })
    assert.equal(tutorLogin.status, 200, 'Tutor login must return 200')
    const tutorToken = tutorLogin.data.accessToken
    const tutorClasses = await get(baseUrl, '/api/v1/tutors/me/classes', tutorToken)
    assert.equal(tutorClasses.status, 200)
    const tutorStudents = await get(baseUrl, '/api/v1/tutors/me/students', tutorToken)
    assert.equal(tutorStudents.status, 200)
    console.log(`✔ Tutor dashboard data verified (${tutorClasses.data.classes.length} assigned classes, ${tutorStudents.data.students.length} students)`)

    // 1.4 Parent Auth & Dashboard
    console.log('1.4: Parent signs in and accesses children dashboard...')
    const parentLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'parent.cse.1@example.test',
      password: 'Parent@12345',
    })
    assert.equal(parentLogin.status, 200, 'Parent login must return 200')
    const parentToken = parentLogin.data.accessToken
    const parentChildren = await get(baseUrl, '/api/v1/parents/me/children', parentToken)
    assert.equal(parentChildren.status, 200)
    const parentLeaves = await get(baseUrl, '/api/v1/leave-applications/my', parentToken)
    assert.equal(parentLeaves.status, 200)
    console.log(`✔ Parent dashboard data verified (${parentChildren.data.children.length} linked children)`)

    // =========================================================================
    // SECTION 2: ADMIN CRUD OPERATIONS
    // =========================================================================
    console.log('\n--- SECTION 2: ADMIN CRUD OPERATIONS ---')

    const testSuffix = Date.now().toString().slice(-4)
    const testDeptCode = `ROBO${testSuffix}`

    // 2.1 Create Department
    console.log(`2.1: Admin creates new department (${testDeptCode})...`)
    const createDeptRes = await post(baseUrl, '/api/v1/departments', {
      code: testDeptCode,
      name: `Robotics and Automation ${testSuffix}`,
      description: 'Advanced robotics laboratory and academic wing',
    }, adminToken)
    assert.equal(createDeptRes.status, 201)
    const newDept = createDeptRes.data.department
    const newDeptId = newDept.id || newDept._id
    console.log(`✔ Department created: ${newDept.code} (ID: ${newDeptId})`)

    // 2.2 Update Department
    console.log('2.2: Admin updates department description...')
    const updateDeptRes = await patch(baseUrl, `/api/v1/departments/${newDeptId}`, {
      description: 'Updated department description with ISO standard lab',
    }, adminToken)
    assert.equal(updateDeptRes.status, 200)
    console.log('✔ Department updated successfully')

    // 2.3 Create HOD
    console.log('2.3: Admin creates and assigns HOD...')
    const createHodRes = await post(baseUrl, '/api/v1/hods', {
      fullName: `Dr. Robotics HOD ${testSuffix}`,
      email: `hod.robo.${testSuffix}@example.test`,
      password: 'RoboHodPassword123!',
      employeeId: `EMP-ROBO-${testSuffix}`,
      phone: '+1-555-0199',
      department: newDeptId,
    }, adminToken)
    assert.equal(createHodRes.status, 201)
    const newHod = createHodRes.data.hod
    const newHodId = newHod.id || newHod._id
    console.log(`✔ HOD created and assigned: ${newHod.fullName} (ID: ${newHodId})`)

    // 2.4 Create Class
    console.log('2.4: Admin creates Class for department...')
    const createClassRes = await post(baseUrl, '/api/v1/classes', {
      className: `ROBO-YEAR3-${testSuffix}`,
      year: '3',
      section: 'A',
      department: newDeptId,
    }, adminToken)
    assert.equal(createClassRes.status, 201)
    const newClass = createClassRes.data.class
    const newClassId = newClass.id || newClass._id
    console.log(`✔ Class created: ${newClass.className} (ID: ${newClassId})`)

    // 2.5 Create Tutor & Assign Class
    console.log('2.5: Admin creates Tutor and assigns to class...')
    const createTutorRes = await post(baseUrl, '/api/v1/tutors', {
      fullName: `Prof. Robo Tutor ${testSuffix}`,
      email: `tutor.robo.${testSuffix}@example.test`,
      password: 'RoboTutorPassword123!',
      employeeId: `TUT-ROBO-${testSuffix}`,
      phone: '+1-555-0188',
      department: newDeptId,
      assignedClasses: [newClassId],
    }, adminToken)
    assert.equal(createTutorRes.status, 201)
    const newTutor = createTutorRes.data.tutor
    const newTutorId = newTutor.id || newTutor._id
    console.log(`✔ Tutor created and assigned: ${newTutor.fullName} (ID: ${newTutorId})`)

    // 2.6 Create Student
    console.log('2.6: Admin creates Student...')
    const createStudentRes = await post(baseUrl, '/api/v1/students', {
      fullName: `Student Robo ${testSuffix}`,
      registerNumber: `ROBO${testSuffix}`,
      department: newDeptId,
      class: newClassId,
      email: `student.robo.${testSuffix}@example.test`,
      phone: '+1-555-0177',
    }, adminToken)
    assert.equal(createStudentRes.status, 201)
    const newStudent = createStudentRes.data.student
    const newStudentId = newStudent.id || newStudent._id
    console.log(`✔ Student created: ${newStudent.fullName} (${newStudent.registerNumber})`)

    // 2.7 Create Parent & Link Student
    console.log('2.7: Admin creates Parent and links Student...')
    const createParentRes = await post(baseUrl, '/api/v1/parents', {
      fullName: `Guardian Robo ${testSuffix}`,
      email: `parent.robo.${testSuffix}@example.test`,
      password: 'RoboParentPassword123!',
      phone: '+1-555-0166',
    }, adminToken)
    assert.equal(createParentRes.status, 201)
    const newParent = createParentRes.data.parent
    const newParentId = newParent.id || newParent._id

    const linkRes = await post(baseUrl, `/api/v1/parents/${newParentId}/children`, {
      studentId: newStudentId,
      relationship: 'Mother',
    }, adminToken)
    assert.equal(linkRes.status, 201)
    console.log(`✔ Parent created and linked: ${newParent.fullName} -> ${newStudent.fullName}`)

    // 2.8 Deactivate and Reactivate Department Status
    console.log('2.8: Admin updates status...')
    const deactDept = await patch(baseUrl, `/api/v1/departments/${newDeptId}/status`, {
      status: 'INACTIVE',
    }, adminToken)
    assert.equal(deactDept.status, 200)
    assert.equal(deactDept.data.department.status, 'INACTIVE')
    const reactDept = await patch(baseUrl, `/api/v1/departments/${newDeptId}/status`, {
      status: 'ACTIVE',
    }, adminToken)
    assert.equal(reactDept.status, 200)
    assert.equal(reactDept.data.department.status, 'ACTIVE')
    console.log('✔ Department status toggles verified (INACTIVE -> ACTIVE)')

    // =========================================================================
    // SECTION 3: FULL 12-STAGE LEAVE WORKFLOW & DOCUMENT UPLOAD
    // =========================================================================
    console.log('\n--- SECTION 3: 12-STAGE LEAVE APPLICATION WORKFLOW ---')

    // Stage 1: Parent logs in with new account
    console.log('Stage 1: Newly created Parent signs in...')
    const testParentLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: `parent.robo.${testSuffix}@example.test`,
      password: 'RoboParentPassword123!',
    })
    assert.equal(testParentLogin.status, 200)
    assert.equal(testParentLogin.data.user.mustChangePassword, true)
    const blockedParentChildren = await get(
      baseUrl,
      '/api/v1/parents/me/children',
      testParentLogin.data.accessToken,
    )
    assert.equal(blockedParentChildren.status, 403)
    const parentChangePass = await post(
      baseUrl,
      '/api/v1/auth/change-password',
      {
        currentPassword: 'RoboParentPassword123!',
        newPassword: 'RoboParentNewPass123!',
        confirmPassword: 'RoboParentNewPass123!',
      },
      testParentLogin.data.accessToken,
    )
    assert.equal(parentChangePass.status, 200)
    assert.equal(parentChangePass.data.user.mustChangePassword, false)
    const activeParentToken = parentChangePass.data.accessToken
    console.log('✔ Active parent authenticated and completed first-login password change')

    // Stage 2: Retrieve linked child
    console.log('Stage 2: Parent retrieves linked child...')
    const myChildren = await get(baseUrl, '/api/v1/parents/me/children', activeParentToken)
    assert.equal(myChildren.status, 200)
    assert.equal(myChildren.data.children.length, 1)
    console.log(`✔ Verified child: ${myChildren.data.children[0].student.fullName}`)

    // Stage 3: Parent submits leave application with document
    console.log('Stage 3: Parent submits leave with supporting document...')
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() + 3)
    const toDate = new Date()
    toDate.setDate(toDate.getDate() + 5)

    const submissionRes = await postMultipart(
      baseUrl,
      '/api/v1/leave-applications',
      {
        studentId: newStudentId,
        leaveType: 'SICK_LEAVE',
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        reason: 'Severe flu symptoms requiring medical quarantine and bed rest',
      },
      {
        name: 'Doctor_Certificate.pdf',
        content: '%PDF-1.4 Mock Doctor Medical Certificate Content for verification',
        type: 'application/pdf',
      },
      activeParentToken,
    )
    assert.equal(submissionRes.status, 201)
    const appData = submissionRes.data?.data?.application || submissionRes.data?.application
    assert.ok(appData)
    const leaveAppId = appData.id || appData._id
    console.log(`✔ Leave submitted: ${appData.applicationNumber} (Status: ${appData.status}, ID: ${leaveAppId})`)

    // Stage 4: Tutor verifies pending application is withheld
    console.log('Stage 4: Assigned tutor checks approved leaves list...')
    const testTutorLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: `tutor.robo.${testSuffix}@example.test`,
      password: 'RoboTutorPassword123!',
    })
    assert.equal(testTutorLogin.status, 200)
    assert.equal(testTutorLogin.data.user.mustChangePassword, true)
    const blockedTutorLeaves = await get(
      baseUrl,
      '/api/v1/tutors/me/approved-leaves',
      testTutorLogin.data.accessToken,
    )
    assert.equal(blockedTutorLeaves.status, 403)
    const tutorChangePass = await post(
      baseUrl,
      '/api/v1/auth/change-password',
      {
        currentPassword: 'RoboTutorPassword123!',
        newPassword: 'RoboTutorNewPass123!',
        confirmPassword: 'RoboTutorNewPass123!',
      },
      testTutorLogin.data.accessToken,
    )
    assert.equal(tutorChangePass.status, 200)
    assert.equal(tutorChangePass.data.user.mustChangePassword, false)
    const activeTutorToken = tutorChangePass.data.accessToken

    const tutorApprovedBefore = await get(baseUrl, '/api/v1/tutors/me/approved-leaves', activeTutorToken)
    assert.equal(tutorApprovedBefore.status, 200)
    const tutorBeforeApps = tutorApprovedBefore.data?.data?.applications || tutorApprovedBefore.data?.applications || []
    assert.equal(tutorBeforeApps.some(a => (a.id || a._id) === leaveAppId), false)
    console.log('✔ Pending leave is withheld from tutor approved view')

    // Stage 5: HOD reviews department pending queue
    console.log('Stage 5: Department HOD checks review queue...')
    const testHodLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: `hod.robo.${testSuffix}@example.test`,
      password: 'RoboHodPassword123!',
    })
    assert.equal(testHodLogin.status, 200)
    assert.equal(testHodLogin.data.user.mustChangePassword, true)
    const blockedHodQueue = await get(
      baseUrl,
      '/api/v1/leave-applications?status=PENDING',
      testHodLogin.data.accessToken,
    )
    assert.equal(blockedHodQueue.status, 403)
    const hodChangePass = await post(
      baseUrl,
      '/api/v1/auth/change-password',
      {
        currentPassword: 'RoboHodPassword123!',
        newPassword: 'RoboHodNewPass123!',
        confirmPassword: 'RoboHodNewPass123!',
      },
      testHodLogin.data.accessToken,
    )
    assert.equal(hodChangePass.status, 200)
    assert.equal(hodChangePass.data.user.mustChangePassword, false)
    const activeHodToken = hodChangePass.data.accessToken

    const hodQueue = await get(baseUrl, '/api/v1/leave-applications?status=PENDING', activeHodToken)
    assert.equal(hodQueue.status, 200)
    const hodQueueApps = hodQueue.data?.data?.applications || hodQueue.data?.applications || []
    assert.ok(hodQueueApps.some(a => (a.id || a._id) === leaveAppId))
    console.log('✔ Pending leave visible in HOD department review queue')

    // Stage 6: HOD approves application
    console.log('Stage 6: HOD approves leave...')
    const approveRes = await post(
      baseUrl,
      `/api/v1/leave-applications/${leaveAppId}/approve`,
      { comment: 'Approved. Rest well and return when fully recovered.' },
      activeHodToken,
    )
    assert.equal(approveRes.status, 200)
    const approvedLeave = approveRes.data?.data?.application || approveRes.data?.application
    assert.equal(approvedLeave.status, 'APPROVED')
    console.log('✔ Leave approved by HOD')

    // Stage 7: Parent receives LEAVE_APPROVED notification
    console.log('Stage 7: Parent receives approval notification...')
    const parentNotifs = await get(baseUrl, '/api/v1/notifications/my', activeParentToken)
    assert.equal(parentNotifs.status, 200)
    const pNotifs = parentNotifs.data?.data?.notifications || parentNotifs.data?.notifications || []
    assert.ok(pNotifs.some(n => String(n.application) === String(leaveAppId) && n.type === 'LEAVE_APPROVED'))
    console.log('✔ Parent received LEAVE_APPROVED notification')

    // Stage 8: Tutor receives LEAVE_APPROVED notification
    console.log('Stage 8: Assigned tutor receives notification...')
    const tutorNotifs = await get(baseUrl, '/api/v1/notifications/my', activeTutorToken)
    assert.equal(tutorNotifs.status, 200)
    const tNotifs = tutorNotifs.data?.data?.notifications || tutorNotifs.data?.notifications || []
    assert.ok(tNotifs.some(n => String(n.application) === String(leaveAppId) && n.type === 'LEAVE_APPROVED'))
    console.log('✔ Tutor received LEAVE_APPROVED notification')

    // Stage 9: Tutor approved list contains the application
    console.log('Stage 9: Tutor approved list now contains the approved leave...')
    const tutorApprovedAfter = await get(baseUrl, '/api/v1/tutors/me/approved-leaves', activeTutorToken)
    assert.equal(tutorApprovedAfter.status, 200)
    const tutorAfterApps = tutorApprovedAfter.data?.data?.applications || tutorApprovedAfter.data?.applications || []
    assert.ok(tutorAfterApps.some(a => (a.id || a._id) === leaveAppId))
    console.log('✔ Approved leave appears in tutor approved leaves')

    // Stage 10: Document download verified
    console.log('Stage 10: Supporting document download by authorized actor...')
    const docDownload = await get(baseUrl, `/api/v1/leave-applications/${leaveAppId}/document`, activeParentToken)
    assert.equal(docDownload.status, 200)
    assert.ok(docDownload.data.byteLength > 0, 'Downloaded document contains valid bytes')
    console.log(`✔ Supporting document downloaded (${docDownload.data.byteLength} bytes)`)

    // Stage 11: HOD reopens application
    console.log('Stage 11: HOD reopens application for correction...')
    const reopenRes = await post(
      baseUrl,
      `/api/v1/leave-applications/${leaveAppId}/reopen`,
      { reason: 'Please upload prescription stamped with clinic seal' },
      activeHodToken,
    )
    assert.equal(reopenRes.status, 200)
    const reopenedLeave = reopenRes.data?.data?.application || reopenRes.data?.application
    assert.equal(reopenedLeave.status, 'PENDING')
    assert.equal(reopenedLeave.reopenReason, 'Please upload prescription stamped with clinic seal')
    console.log('✔ Application reopened, status reverted to PENDING with reason')

    // Stage 12: HOD rejects application
    console.log('Stage 12: HOD rejects application...')
    const rejectRes = await post(
      baseUrl,
      `/api/v1/leave-applications/${leaveAppId}/reject`,
      { reason: 'Prescription clinic seal was not provided in time' },
      activeHodToken,
    )
    assert.equal(rejectRes.status, 200)
    const rejectedLeave = rejectRes.data?.data?.application || rejectRes.data?.application
    assert.equal(rejectedLeave.status, 'REJECTED')
    console.log('✔ Application rejected with reason recorded')

    // Verify Audit History
    const historyRes = await get(baseUrl, `/api/v1/leave-applications/${leaveAppId}/history`, activeHodToken)
    assert.equal(historyRes.status, 200)
    const history = historyRes.data?.data?.history || historyRes.data?.history || []
    const actions = history.map(h => h.action)
    assert.ok(actions.includes('SUBMITTED'))
    assert.ok(actions.includes('APPROVED'))
    assert.ok(actions.includes('REOPENED'))
    assert.ok(actions.includes('REJECTED'))
    console.log(`✔ Full audit trail verified: ${actions.join(' -> ')}`)

    // =========================================================================
    // SECTION 4: SECURITY & AUTHORIZATION VERIFICATION
    // =========================================================================
    console.log('\n--- SECTION 4: SECURITY & ISOLATION VERIFICATION ---')

    // 4.1 Role-Based Route Access
    console.log('4.1: Checking Role-based route access...')
    const parentDeptAccess = await get(baseUrl, '/api/v1/departments', activeParentToken)
    assert.equal(parentDeptAccess.status, 403, 'Parent must be denied access to department administration (403)')

    const tutorParentAccess = await get(baseUrl, '/api/v1/parents', activeTutorToken)
    assert.equal(tutorParentAccess.status, 403, 'Tutor must be denied access to parent administration (403)')
    console.log('✔ Route access correctly rejected with 403 Forbidden for unauthorized roles')

    // 4.2 Department Isolation
    console.log('4.2: Checking Department isolation...')
    const cseHodLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'hod.cse@example.com',
      password: 'Hod@12345',
    })
    const cseHodToken = cseHodLogin.data.accessToken
    const cseHodForeignDept = await get(baseUrl, `/api/v1/departments/${newDeptId}`, cseHodToken)
    assert.equal(cseHodForeignDept.status, 403, 'HOD must be denied access to another department (403)')

    const foreignApprove = await post(
      baseUrl,
      `/api/v1/leave-applications/${leaveAppId}/approve`,
      { comment: 'Malicious cross-department approval' },
      cseHodToken,
    )
    assert.equal(foreignApprove.status, 403, 'HOD must be denied approval of cross-department leaves (403)')
    console.log('✔ Department isolation enforced: cross-department reads and writes rejected with 403')

    // 4.3 Parent-Child Ownership
    console.log('4.3: Checking Parent-child ownership...')
    const cseParentLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'parent.cse.1@example.test',
      password: 'Parent@12345',
    })
    const cseParentToken = cseParentLogin.data.accessToken
    const illegalLeave = await post(
      baseUrl,
      '/api/v1/leave-applications',
      {
        studentId: newStudentId, // belongs to the Robo parent, NOT the CSE parent
        leaveType: 'SICK_LEAVE',
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        reason: 'Unauthorized leave submission for another parent student',
      },
      cseParentToken,
    )
    assert.equal(illegalLeave.status, 403, 'Parent submitting for unlinked student must be rejected with 403')
    console.log('✔ Parent-child ownership enforced: unlinked child leave rejected with 403')

    // 4.4 Tutor Class Restriction
    console.log('4.4: Checking Tutor assigned-class restriction...')
    const cseTutorLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'tutor.cse.1@example.test',
      password: 'Tutor@12345',
    })
    const cseTutorToken = cseTutorLogin.data.accessToken
    const cseTutorApproved = await get(baseUrl, '/api/v1/tutors/me/approved-leaves', cseTutorToken)
    assert.equal(cseTutorApproved.status, 200)
    const cseTutorApps = cseTutorApproved.data?.data?.applications || cseTutorApproved.data?.applications || []
    assert.equal(cseTutorApps.some(a => (a.id || a._id) === leaveAppId), false, 'Tutor must not see leaves outside assigned classes')
    console.log('✔ Tutor class restriction enforced: foreign class leaves withheld')

    // 4.5 Authentication Refresh & Logout Invalidation
    console.log('4.5: Checking Token refresh and logout invalidation...')
    const tempLogin = await post(baseUrl, '/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
    })
    assert.equal(tempLogin.status, 200)
    const cookieHeader = tempLogin.headers.get('set-cookie')
    assert.ok(cookieHeader, 'Refresh cookie must be set')
    const refreshCookie = cookieHeader.split(';')[0]

    // Refresh token
    const refreshRes = await post(baseUrl, '/api/v1/auth/refresh', {}, null, refreshCookie)
    assert.equal(refreshRes.status, 200, 'Refresh must return 200')
    assert.ok(refreshRes.data.accessToken, 'Rotated access token received')
    const newRefreshCookie = (refreshRes.headers.get('set-cookie') || refreshCookie).split(';')[0]

    // Logout
    const logoutRes = await post(baseUrl, '/api/v1/auth/logout', {}, null, newRefreshCookie)
    assert.equal(logoutRes.status, 200, 'Logout must succeed')

    // Subsequent refresh with logged-out cookie must fail
    const reusedRefresh = await post(baseUrl, '/api/v1/auth/refresh', {}, null, newRefreshCookie)
    assert.equal(reusedRefresh.status, 401, 'Logged-out session refresh must be rejected with 401')
    console.log('✔ Session lifecycle verified: silent refresh rotates token and logout invalidates session')

    // 4.6 Notification Ownership
    console.log('4.6: Checking Notification ownership...')
    const targetNotifId = pNotifs[0]?._id || pNotifs[0]?.id
    if (targetNotifId) {
      const foreignRead = await patch(baseUrl, `/api/v1/notifications/${targetNotifId}/read`, {}, cseParentToken)
      assert.equal(foreignRead.status, 404, 'User marking foreign notification as read must be rejected with 404')
      console.log('✔ Notification ownership enforced: foreign notification read rejected')
    }

    // 4.7 File Access Authorization
    console.log('4.7: Checking File access authorization...')
    const anonDoc = await get(baseUrl, `/api/v1/leave-applications/${leaveAppId}/document`)
    assert.equal(anonDoc.status, 401, 'Anonymous document download must be rejected with 401')

    const foreignDoc = await get(baseUrl, `/api/v1/leave-applications/${leaveAppId}/document`, cseParentToken)
    assert.equal(foreignDoc.status, 403, 'Foreign parent document download must be rejected with 403')
    console.log('✔ Document access authorization enforced: 401 for anonymous, 403 for unauthorized users')

    console.log('\n=================================================================')
    console.log('🎉 ALL INTEGRATION, WORKFLOW, AND SECURITY CHECKS PASSED (100%)!')
    console.log('=================================================================')
  })

  await mongoose.disconnect()
}

verify().catch((err) => {
  console.error('❌ Verification failed:', err)
  process.exitCode = 1
})
