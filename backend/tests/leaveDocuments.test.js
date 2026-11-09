import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { LeaveApplication } from '../src/models/LeaveApplication.js'
import { createTestUser } from './support/authTestUtils.js'
import {
  apiRequest,
  createTestClass,
  createTestDepartment,
  createTestHod,
  createTestParentStudent,
  createTestStudent,
  futureDate,
  leaveApplicationPayload,
  loginToken,
} from './support/managementTestUtils.js'
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from './support/testDatabase.js'
import { withServer } from './support/testServer.js'

const documentDir = path.join(
  os.tmpdir(),
  `clms-leave-documents-${process.pid}-${Date.now()}`,
)
process.env.LEAVE_DOCUMENT_DIR = documentDir

before(connectTestDatabase)
after(async () => {
  await fs.rm(documentDir, { recursive: true, force: true })
  await disconnectTestDatabase()
})
beforeEach(clearTestDatabase)

const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n',
)
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
])

async function createFamily() {
  const department = await createTestDepartment()
  const classDocument = await createTestClass(department)
  const parent = await createTestUser({ role: 'PARENT' })
  const student = await createTestStudent(department, classDocument)
  await createTestParentStudent(parent, student)
  return { department, classDocument, parent, student }
}

async function countDocumentFiles() {
  try {
    return (await fs.readdir(documentDir)).length
  } catch (error) {
    if (error.code === 'ENOENT') return 0
    throw error
  }
}

async function submitMultipart(
  baseUrl,
  token,
  student,
  { buffer, type, name },
  overrides = {},
) {
  const form = new FormData()
  form.append('studentId', student.id)
  form.append('leaveType', overrides.leaveType ?? 'SICK_LEAVE')
  form.append('fromDate', overrides.fromDate ?? futureDate(1))
  form.append('toDate', overrides.toDate ?? futureDate(2))
  form.append(
    'reason',
    overrides.reason ?? 'Medical certificate attached for review',
  )
  form.append('supportingDocument', new Blob([buffer], { type }), name)

  const response = await fetch(`${baseUrl}/api/v1/leave-applications`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: form,
  })

  let body = null

  try {
    body = await response.json()
  } catch {
    body = null
  }

  return { response, body }
}

test('valid supporting document is stored privately and downloadable by authorized users', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const parentToken = await loginToken(baseUrl, family.parent)
    const ownHod = await createTestHod(family.department)
    const otherDepartment = await createTestDepartment()
    const otherHod = await createTestHod(otherDepartment)
    const otherParent = await createTestUser({ role: 'PARENT' })
    const ownHodToken = await loginToken(baseUrl, ownHod)
    const otherHodToken = await loginToken(baseUrl, otherHod)
    const otherParentToken = await loginToken(baseUrl, otherParent)

    const created = await submitMultipart(baseUrl, parentToken, family.student, {
      buffer: PDF_BYTES,
      type: 'application/pdf',
      name: '../../secret.pdf',
    })

    assert.equal(created.response.status, 201)
    const application = created.body.data.application
    assert.equal(application.supportingDocument.mimeType, 'application/pdf')
    assert.equal(application.supportingDocument.size, PDF_BYTES.length)
    assert.equal(
      application.supportingDocument.fileName.includes('/'),
      false,
    )
    assert.equal(
      application.supportingDocument.fileName.includes('\\'),
      false,
    )
    assert.equal('storedName' in application.supportingDocument, false)

    const storedFiles = await fs.readdir(documentDir)
    assert.equal(storedFiles.length, 1)
    assert.match(storedFiles[0], /^[0-9]+-[0-9a-f-]{36}\.pdf$/)
    assert.notEqual(storedFiles[0], 'secret.pdf')

    const download = await fetch(
      `${baseUrl}/api/v1/leave-applications/${application.id}/document`,
      { headers: { authorization: `Bearer ${parentToken}` } },
    )
    assert.equal(download.status, 200)
    assert.match(download.headers.get('content-type'), /application\/pdf/)
    assert.match(download.headers.get('content-disposition'), /attachment/)
    assert.match(download.headers.get('cache-control'), /no-store/)
    const downloaded = Buffer.from(await download.arrayBuffer())
    assert.deepEqual(downloaded, PDF_BYTES)

    const hodDownload = await fetch(
      `${baseUrl}/api/v1/leave-applications/${application.id}/document`,
      { headers: { authorization: `Bearer ${ownHodToken}` } },
    )
    assert.equal(hodDownload.status, 200)

    for (const token of [otherParentToken, otherHodToken]) {
      const denied = await fetch(
        `${baseUrl}/api/v1/leave-applications/${application.id}/document`,
        { headers: { authorization: `Bearer ${token}` } },
      )
      assert.equal(denied.status, 403)
    }
  })
})

test('PNG documents are accepted while spoofed files are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const token = await loginToken(baseUrl, family.parent)

    const png = await submitMultipart(baseUrl, token, family.student, {
      buffer: PNG_BYTES,
      type: 'image/png',
      name: 'proof.png',
    })
    assert.equal(png.response.status, 201)
    assert.equal(
      png.body.data.application.supportingDocument.mimeType,
      'image/png',
    )

    const filesBefore = await countDocumentFiles()
    const spoofed = await submitMultipart(baseUrl, token, family.student, {
      buffer: Buffer.from('this is not a real document'),
      type: 'application/pdf',
      name: 'fake.pdf',
    })
    assert.equal(spoofed.response.status, 400)
    assert.equal(spoofed.body.success, false)
    assert.match(spoofed.body.message, /PDF, JPG, JPEG, or PNG/)

    assert.equal(await countDocumentFiles(), filesBefore)
    assert.equal(await LeaveApplication.countDocuments(), 1)
  })
})

test('documents over 5 MB are rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const token = await loginToken(baseUrl, family.parent)
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 0x25)

    const response = await submitMultipart(baseUrl, token, family.student, {
      buffer: oversized,
      type: 'application/pdf',
      name: 'large.pdf',
    })

    assert.equal(response.response.status, 400)
    assert.match(
      response.body.message,
      /5 MB or smaller/,
    )
    assert.equal(await LeaveApplication.countDocuments(), 0)
  })
})

test('download reports 404 when an application has no document', async () => {
  await withServer(async ({ baseUrl }) => {
    const family = await createFamily()
    const token = await loginToken(baseUrl, family.parent)

    const created = await apiRequest(
      baseUrl,
      '/api/v1/leave-applications',
      {
        method: 'POST',
        token,
        body: leaveApplicationPayload(family.student.id),
      },
    )
    assert.equal(created.response.status, 201)

    const download = await apiRequest(
      baseUrl,
      `/api/v1/leave-applications/${created.body.data.application.id}/document`,
      { token },
    )
    assert.equal(download.response.status, 404)
    assert.equal(download.body.message, 'Supporting document not found')
  })
})
