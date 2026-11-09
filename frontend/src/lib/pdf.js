import { jsPDF } from 'jspdf'
import { formatDate, formatDateTime } from './date'
import { yearLabel } from '../services/selectors'

const NAVY = [0, 32, 96]
const MAROON = [131, 0, 0]
const SLATE = [71, 85, 105]
const LIGHT = [241, 245, 249]

async function loadLogoDataUrl() {
  try {
    const response = await fetch('/brand/tce-logo.png')
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    context.drawImage(bitmap, 0, 0)
    const ratio = bitmap.width / bitmap.height
    bitmap.close?.()
    return { dataUrl: canvas.toDataURL('image/png'), ratio }
  } catch {
    return null
  }
}

function sectionTitle(doc, text, y) {
  doc.setFillColor(...NAVY)
  doc.rect(16, y, 178, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(text.toUpperCase(), 19, y + 4.7)
  return y + 12
}

function fieldRow(doc, label, value, x, y, width = 85) {
  doc.setTextColor(120, 132, 149)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(label.toUpperCase(), x, y)
  doc.setTextColor(...SLATE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  const lines = doc.splitTextToSize(String(value || '—'), width)
  doc.text(lines, x, y + 5)
  return y + 5 + lines.length * 4.4
}

export async function generateApprovedLeavePDF({
  leave,
  student,
  department,
  classItem,
  tutor,
  parent,
  hodName = 'Demo HOD CSE',
}) {
  if (!leave || !student) throw new Error('Leave data is incomplete.')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await loadLogoDataUrl()

  if (logo) {
    const logoWidth = 66
    const logoHeight = logoWidth / logo.ratio
    doc.addImage(logo.dataUrl, 'PNG', 16, 12, logoWidth, logoHeight)
  }

  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('LEAVE MANAGEMENT PORTAL', 194, 17, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(110, 120, 135)
  doc.text('Academic administration · Verified leave record', 194, 22, { align: 'right' })
  doc.setTextColor(16, 120, 72)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('OFFICIALLY APPROVED · VERIFIED', 194, 27, { align: 'right' })

  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.7)
  doc.line(16, 35, 194, 35)

  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('APPROVED LEAVE LETTER', 105, 46, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...SLATE)
  doc.text('Student Leave Management Portal · Academic Year 2026–2027', 105, 51.5, {
    align: 'center',
  })
  doc.text(`Reference: ${leave.id}`, 105, 56, { align: 'center' })

  // Watermark
  doc.setTextColor(234, 239, 247)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(82)
  doc.text('DEMO', 105, 175, { align: 'center', angle: 32 })

  let y = 66
  y = sectionTitle(doc, 'Student details', y)

  const leftY = fieldRow(doc, 'Student name', student.name, 19, y, 78)
  fieldRow(doc, 'Register number', student.registerNumber, 112, y, 78)
  y = leftY + 4
  const deptY = fieldRow(
    doc,
    'Department',
    department?.name || '—',
    19,
    y,
    78,
  )
  fieldRow(
    doc,
    'Class',
    `${classItem ? yearLabel(classItem.year) : '—'}, Section ${classItem?.section || '—'}`,
    112,
    y,
    78,
  )
  y = deptY + 3

  y = sectionTitle(doc, 'Leave details', y + 2)
  const typeY = fieldRow(doc, 'Leave type', leave.leaveType, 19, y, 78)
  fieldRow(doc, 'Application ID', leave.id, 112, y, 78)
  y = typeY + 4
  const fromY = fieldRow(doc, 'From date', formatDate(leave.fromDate), 19, y, 78)
  fieldRow(doc, 'To date', formatDate(leave.toDate), 112, y, 78)
  y = fromY + 4
  const durationY = fieldRow(
    doc,
    'Duration',
    `${leave.duration || 1} day${leave.duration === 1 ? '' : 's'}`,
    19,
    y,
    78,
  )
  fieldRow(
    doc,
    'Approval date',
    formatDate(leave.decisionAt || new Date()),
    112,
    y,
    78,
  )
  y = durationY + 6

  y = sectionTitle(doc, 'Parent / guardian', y)
  const parentY = fieldRow(doc, 'Name', parent?.name || '—', 19, y, 78)
  fieldRow(doc, 'Contact', parent?.phone || '—', 112, y, 78)
  y = parentY + 6

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(16, y, 178, 26, 2, 2, 'F')
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Reason submitted by parent / guardian', 20, y + 6)
  doc.setTextColor(...SLATE)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const reasonLines = doc.splitTextToSize(leave.reason || '—', 168)
  doc.text(reasonLines.slice(0, 4), 20, y + 11.5)
  y += 32

  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Certification', 19, y)
  doc.setTextColor(...SLATE)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const certification = `This is to certify that ${student.name} (Register No. ${student.registerNumber}), a student of ${department?.name || 'the department'} in ${classItem ? yearLabel(classItem.year) : ''}${classItem ? `, Section ${classItem.section}` : ''}, has been granted leave from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} for ${leave.duration || 1} day${leave.duration === 1 ? '' : 's'}. The request was submitted through the parent portal and approved by the Head of Department. This leave has been forwarded to the class tutor for academic coordination.`
  const certLines = doc.splitTextToSize(certification, 175)
  doc.text(certLines, 19, y + 5)
  y += 8 + certLines.length * 4.2

  if (leave.remarks) {
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('HOD REMARKS', 19, y)
    doc.setTextColor(...SLATE)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    const remarkLines = doc.splitTextToSize(leave.remarks, 172)
    doc.text(remarkLines, 19, y + 4)
    y += 6 + remarkLines.length * 4
  }

  // Approval strip
  doc.setFillColor(236, 248, 242)
  doc.roundedRect(16, y, 178, 16, 2, 2, 'F')
  doc.setTextColor(5, 110, 80)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('APPROVED BY', 20, y + 6)
  doc.setTextColor(6, 78, 59)
  doc.setFontSize(9)
  doc.text(`${leave.decidedBy || hodName} · Head of Department`, 20, y + 11.5)
  doc.setTextColor(6, 95, 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(formatDateTime(leave.decisionAt), 190, y + 11.5, { align: 'right' })
  y += 25

  // Signatures
  const signatureY = Math.min(Math.max(y, 222), 246)
  doc.setDrawColor(185, 193, 204)
  doc.setLineWidth(0.3)
  doc.line(19, signatureY, 79, signatureY)
  doc.line(120, signatureY, 180, signatureY)
  doc.setTextColor(...SLATE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(tutor?.name || 'Class Tutor', 19, signatureY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Class Tutor', 19, signatureY + 9)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...NAVY)
  doc.text(leave.decidedBy || hodName, 120, signatureY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text('Head of Department', 120, signatureY + 9)

  // Footer
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.2)
  doc.line(16, 272, 194, 272)
  doc.setTextColor(140, 150, 163)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  const disclaimer =
    'This is a computer-generated leave letter issued by the College Leave Management System upon approval by the Head of Department. Reference records and audit history are secured in the institutional database.'
  doc.text(doc.splitTextToSize(disclaimer, 178), 16, 276)
  doc.text(`Generated ${formatDateTime(new Date())} · Portal reference ${leave.id}`, 16, 289)

  const safeName = `${student.registerNumber}_${leave.id}`.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`Approved_Leave_Letter_${safeName}.pdf`)
}
