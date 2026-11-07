import {
  dateInMonth,
  formatDate,
  shiftDate,
  timestampDaysAgo,
  timestampInMonth,
} from '../lib/date.js'
import { LEAVE_TYPE_SHORT, ROLES } from '../constants/index.js'
import { DEMO_ACCOUNTS_BY_ROLE } from './demoAuth.js'

const YEAR = new Date().getFullYear()

export const DEMO_SEED_VERSION = 3

const DEPARTMENT_DEFINITIONS = [
  { id: 'dept-cse', name: 'Computer Science and Engineering', code: 'CSE' },
  { id: 'dept-it', name: 'Information Technology', code: 'IT' },
  {
    id: 'dept-ece',
    name: 'Electronics and Communication Engineering',
    code: 'ECE',
  },
  { id: 'dept-mech', name: 'Mechanical Engineering', code: 'MECH' },
  { id: 'dept-mca', name: 'Master of Computer Applications', code: 'MCA' },
]

function withoutPassword(account) {
  const { password: _password, ...safe } = account
  return safe
}

export const hodsSeed = DEMO_ACCOUNTS_BY_ROLE[ROLES.HOD].map(withoutPassword)
export const tutorsSeed = DEMO_ACCOUNTS_BY_ROLE[ROLES.CLASS_TUTOR].map(
  withoutPassword,
)
export const parentsSeed = DEMO_ACCOUNTS_BY_ROLE[ROLES.PARENT].map(
  withoutPassword,
)

export const departmentsSeed = DEPARTMENT_DEFINITIONS.map((department) => {
  const hod = hodsSeed.find((item) => item.departmentId === department.id)
  return {
    ...department,
    hodId: hod?.id || null,
    hodName: hod?.name || 'Not assigned',
    hodEmail: hod?.email || '',
    status: 'active',
  }
})

export const classesSeed = [
  {
    id: 'class-cse-3a',
    departmentId: 'dept-cse',
    academicYear: '2026–2027',
    year: '3',
    section: 'A',
    tutorId: 'tutor-1',
    status: 'active',
  },
  {
    id: 'class-cse-2a',
    departmentId: 'dept-cse',
    academicYear: '2026–2027',
    year: '2',
    section: 'A',
    tutorId: 'tutor-2',
    status: 'active',
  },
  {
    id: 'class-it-2a',
    departmentId: 'dept-it',
    academicYear: '2026–2027',
    year: '2',
    section: 'A',
    tutorId: 'tutor-3',
    status: 'active',
  },
  {
    id: 'class-it-3a',
    departmentId: 'dept-it',
    academicYear: '2026–2027',
    year: '3',
    section: 'A',
    tutorId: 'tutor-7',
    status: 'active',
  },
  {
    id: 'class-ece-2a',
    departmentId: 'dept-ece',
    academicYear: '2026–2027',
    year: '2',
    section: 'A',
    tutorId: 'tutor-4',
    status: 'active',
  },
  {
    id: 'class-ece-3a',
    departmentId: 'dept-ece',
    academicYear: '2026–2027',
    year: '3',
    section: 'A',
    tutorId: 'tutor-8',
    status: 'active',
  },
  {
    id: 'class-mech-4a',
    departmentId: 'dept-mech',
    academicYear: '2026–2027',
    year: '4',
    section: 'A',
    tutorId: 'tutor-5',
    status: 'active',
  },
  {
    id: 'class-mech-3a',
    departmentId: 'dept-mech',
    academicYear: '2026–2027',
    year: '3',
    section: 'A',
    tutorId: 'tutor-9',
    status: 'active',
  },
  {
    id: 'class-mca-1a',
    departmentId: 'dept-mca',
    academicYear: '2026–2027',
    year: '1',
    section: 'A',
    tutorId: 'tutor-6',
    status: 'active',
  },
  {
    id: 'class-mca-2a',
    departmentId: 'dept-mca',
    academicYear: '2026–2027',
    year: '2',
    section: 'A',
    tutorId: 'tutor-10',
    status: 'active',
  },
]

const STUDENT_DEFINITIONS = [
  ['student-1', 'Demo Student 01', 'DEMO-STU-0001', 'cse-3a', 'parent-1'],
  ['student-2', 'Demo Student 02', 'DEMO-STU-0002', 'it-2a', 'parent-1'],
  ['student-3', 'Demo Student 03', 'DEMO-STU-0003', 'cse-3a', 'parent-2'],
  ['student-4', 'Demo Student 04', 'DEMO-STU-0004', 'cse-2a', 'parent-3'],
  ['student-5', 'Demo Student 05', 'DEMO-STU-0005', 'cse-2a', 'parent-4'],
  ['student-6', 'Demo Student 06', 'DEMO-STU-0006', 'it-2a', 'parent-5'],
  ['student-7', 'Demo Student 07', 'DEMO-STU-0007', 'it-3a', 'parent-6'],
  ['student-8', 'Demo Student 08', 'DEMO-STU-0008', 'it-3a', 'parent-7'],
  ['student-9', 'Demo Student 09', 'DEMO-STU-0009', 'ece-2a', 'parent-8'],
  ['student-10', 'Demo Student 10', 'DEMO-STU-0010', 'ece-2a', 'parent-9'],
  ['student-11', 'Demo Student 11', 'DEMO-STU-0011', 'ece-3a', 'parent-10'],
  ['student-12', 'Demo Student 12', 'DEMO-STU-0012', 'ece-3a', 'parent-11'],
  ['student-13', 'Demo Student 13', 'DEMO-STU-0013', 'mech-4a', 'parent-12'],
  ['student-14', 'Demo Student 14', 'DEMO-STU-0014', 'mech-4a', 'parent-13'],
  ['student-15', 'Demo Student 15', 'DEMO-STU-0015', 'mech-3a', 'parent-14'],
  ['student-16', 'Demo Student 16', 'DEMO-STU-0016', 'mech-3a', 'parent-15'],
  ['student-17', 'Demo Student 17', 'DEMO-STU-0017', 'mca-1a', 'parent-16'],
  ['student-18', 'Demo Student 18', 'DEMO-STU-0018', 'mca-1a', 'parent-17'],
  ['student-19', 'Demo Student 19', 'DEMO-STU-0019', 'mca-2a', 'parent-18'],
  ['student-20', 'Demo Student 20', 'DEMO-STU-0020', 'mca-2a', 'parent-19'],
]

export const studentsSeed = STUDENT_DEFINITIONS.map(
  ([id, name, registerNumber, classSuffix, parentId], index) => {
    const classItem = classesSeed.find(
      (item) => item.id === `class-${classSuffix}`,
    )
    return {
      id,
      name,
      registerNumber,
      email: `student${String(index + 1).padStart(2, '0')}@example.com`,
      phone: `+1-202-555-${String(136 + index).padStart(4, '0')}`,
      departmentId: classItem.departmentId,
      classId: classItem.id,
      parentId,
      status: 'active',
    }
  },
)

const noteFor = (leaveType, parentName) =>
  ({
    'Medical Leave': `${parentName} requests medical leave for the student, who has been advised rest by the attending physician. A medical certificate can be produced at the department office on return.`,
    'Casual Leave': `${parentName} requests casual leave for an unavoidable personal commitment at home. The student will collect notes and complete any missed coursework.`,
    'Emergency Leave': `${parentName} requests emergency leave because of an urgent family situation that requires the student to travel out of station at short notice.`,
    'Family Function Leave': `${parentName} requests leave so the student can attend a close family function. The family will ensure that academic work is completed before departure.`,
    Other: `${parentName} requests leave for a personal matter that requires the student to be away from campus. Additional details can be shared with the class tutor if needed.`,
  })[leaveType]

function buildLeave({
  number,
  studentId,
  leaveType,
  fromDate,
  toDate,
  submittedAt,
  status = 'pending',
  decisionAt = null,
  remarks = '',
  rejectionReason = '',
  reopenedAt = null,
  reopenReason = '',
  previousDecision = null,
  history = null,
  document = null,
}) {
  const student = studentsSeed.find((item) => item.id === studentId)
  const parent = parentsSeed.find((item) => item.id === student?.parentId)
  const hod = hodsSeed.find((item) => item.departmentId === student?.departmentId)
  const id = `LV-${YEAR}-${String(number).padStart(3, '0')}`
  const events = history
    ? [...history]
    : [
        {
          status: 'submitted',
          label: 'Application submitted',
          at: submittedAt,
          by: parent?.name || 'Parent / Guardian',
          note: 'Leave request submitted from the parent portal.',
        },
      ]

  if (!history && decisionAt) {
    events.push({
      status,
      label:
        status === 'approved'
          ? 'Approved by HOD'
          : status === 'rejected'
            ? 'Rejected by HOD'
            : 'Reopened by HOD',
      at: decisionAt,
      by: hod?.name || 'Head of Department',
      note:
        status === 'approved'
          ? remarks || 'Leave approved.'
          : status === 'rejected'
            ? rejectionReason
            : reopenReason,
    })
  }

  return {
    id,
    studentId,
    parentId: student?.parentId || null,
    submittedById: student?.parentId || null,
    submittedByRole: ROLES.PARENT,
    leaveType,
    fromDate,
    toDate,
    reason: noteFor(leaveType, parent?.name || 'The parent / guardian'),
    document,
    status,
    submittedAt,
    decisionAt,
    decidedBy: decisionAt ? hod?.name || null : null,
    decidedById: decisionAt ? hod?.id || null : null,
    decidedByRole: decisionAt ? ROLES.HOD : null,
    remarks,
    rejectionReason,
    reopenedAt,
    reopenedBy: reopenedAt ? hod?.name || null : null,
    reopenedById: reopenedAt ? hod?.id || null : null,
    reopenReason,
    previousDecision,
    tutorNotified: status === 'approved',
    history: events,
  }
}

const medicalDoc = {
  name: 'medical-certificate.pdf',
  type: 'application/pdf',
  size: 284120,
}

const eventDoc = {
  name: 'event-invitation.pdf',
  type: 'application/pdf',
  size: 195600,
}

export const leavesSeed = [
  buildLeave({
    number: 1,
    studentId: 'student-1',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(3),
    toDate: shiftDate(4),
    submittedAt: timestampDaysAgo(1, 9, 12),
    document: medicalDoc,
  }),
  buildLeave({
    number: 2,
    studentId: 'student-2',
    leaveType: 'Casual Leave',
    fromDate: shiftDate(-39),
    toDate: shiftDate(-38),
    submittedAt: timestampDaysAgo(42, 16, 20),
    status: 'approved',
    decisionAt: timestampDaysAgo(41, 10, 5),
    remarks: 'Approved. Coursework may be completed after return.',
  }),
  buildLeave({
    number: 3,
    studentId: 'student-1',
    leaveType: 'Family Function Leave',
    fromDate: shiftDate(6),
    toDate: shiftDate(7),
    submittedAt: timestampDaysAgo(2, 18, 45),
    status: 'approved',
    decisionAt: timestampDaysAgo(1, 11, 30),
    remarks:
      'Approved. Please inform the class representative and subject teachers.',
  }),
  buildLeave({
    number: 4,
    studentId: 'student-2',
    leaveType: 'Emergency Leave',
    fromDate: shiftDate(-14),
    toDate: shiftDate(-13),
    submittedAt: timestampDaysAgo(16, 8, 40),
    status: 'rejected',
    decisionAt: timestampDaysAgo(15, 12, 10),
    rejectionReason:
      'Insufficient supporting documentation. The emergency could not be verified against the academic attendance record.',
  }),
  buildLeave({
    number: 5,
    studentId: 'student-1',
    leaveType: 'Casual Leave',
    fromDate: shiftDate(16),
    toDate: shiftDate(17),
    submittedAt: timestampDaysAgo(1, 14, 5),
  }),
  buildLeave({
    number: 6,
    studentId: 'student-2',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(5),
    toDate: shiftDate(6),
    submittedAt: timestampDaysAgo(4, 10, 25),
    status: 'reopened',
    decisionAt: timestampDaysAgo(2, 9, 15),
    reopenedAt: timestampDaysAgo(1, 15, 40),
    reopenReason:
      'The medical certificate was unclear. Please re-upload a legible copy and confirm the consultation dates.',
    previousDecision: {
      status: 'rejected',
      at: timestampDaysAgo(2, 9, 15),
      by: 'Demo HOD IT',
      byId: 'hod-2',
      note: 'Medical certificate could not be read clearly.',
    },
    history: [
      {
        status: 'submitted',
        label: 'Application submitted',
        at: timestampDaysAgo(4, 10, 25),
        by: 'Demo Parent 01',
        note: 'Leave request submitted from the parent portal.',
      },
      {
        status: 'rejected',
        label: 'Rejected by HOD',
        at: timestampDaysAgo(2, 9, 15),
        by: 'Demo HOD IT',
        note: 'Medical certificate could not be read clearly.',
      },
      {
        status: 'reopened',
        label: 'Reopened for correction',
        at: timestampDaysAgo(1, 15, 40),
        by: 'Demo HOD IT',
        note: 'The medical certificate was unclear. Please re-upload a legible copy and confirm the consultation dates.',
      },
    ],
    document: medicalDoc,
  }),
  buildLeave({
    number: 7,
    studentId: 'student-3',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(2),
    toDate: shiftDate(4),
    submittedAt: timestampDaysAgo(3, 11, 10),
    status: 'approved',
    decisionAt: timestampDaysAgo(1, 10, 20),
    remarks: 'Approved based on the medical certificate submitted.',
    document: medicalDoc,
  }),
  buildLeave({
    number: 8,
    studentId: 'student-4',
    leaveType: 'Casual Leave',
    fromDate: shiftDate(-10),
    toDate: shiftDate(-7),
    submittedAt: timestampDaysAgo(12, 9, 30),
    status: 'approved',
    decisionAt: timestampDaysAgo(11, 14, 0),
    remarks:
      'Approved for family commitments. Attendance will be updated by the tutor.',
  }),
  buildLeave({
    number: 9,
    studentId: 'student-5',
    leaveType: 'Emergency Leave',
    fromDate: shiftDate(1),
    toDate: shiftDate(2),
    submittedAt: timestampDaysAgo(0, 8, 20),
  }),
  buildLeave({
    number: 10,
    studentId: 'student-6',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(-5),
    toDate: shiftDate(-4),
    submittedAt: timestampDaysAgo(7, 12, 10),
    status: 'rejected',
    decisionAt: timestampDaysAgo(6, 9, 45),
    rejectionReason:
      'The request was submitted after the leave period had already begun. Retrospective leave requires a separate condonation process.',
  }),
  buildLeave({
    number: 11,
    studentId: 'student-7',
    leaveType: 'Family Function Leave',
    fromDate: shiftDate(10),
    toDate: shiftDate(11),
    submittedAt: timestampDaysAgo(5, 17, 0),
    status: 'approved',
    decisionAt: timestampDaysAgo(4, 10, 30),
    remarks:
      'Approved. Please collect notes from classmates for the missed sessions.',
  }),
  buildLeave({
    number: 12,
    studentId: 'student-8',
    leaveType: 'Casual Leave',
    fromDate: shiftDate(3),
    toDate: shiftDate(3),
    submittedAt: timestampDaysAgo(2, 13, 15),
  }),
  buildLeave({
    number: 13,
    studentId: 'student-9',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(-20),
    toDate: shiftDate(-18),
    submittedAt: timestampDaysAgo(22, 9, 0),
    status: 'approved',
    decisionAt: timestampDaysAgo(21, 11, 20),
    remarks: 'Approved. Medical documents verified with the department office.',
  }),
  buildLeave({
    number: 14,
    studentId: 'student-10',
    leaveType: 'Emergency Leave',
    fromDate: shiftDate(-2),
    toDate: shiftDate(-2),
    submittedAt: timestampDaysAgo(3, 20, 10),
    status: 'rejected',
    decisionAt: timestampDaysAgo(2, 8, 50),
    rejectionReason:
      'The application was submitted for a single day with no verifiable emergency documentation.',
  }),
  buildLeave({
    number: 15,
    studentId: 'student-11',
    leaveType: 'Casual Leave',
    fromDate: shiftDate(-25),
    toDate: shiftDate(-23),
    submittedAt: timestampDaysAgo(27, 10, 0),
    status: 'approved',
    decisionAt: timestampDaysAgo(26, 15, 30),
    remarks:
      'Approved. Placement training schedule has been shared with the student.',
  }),
  buildLeave({
    number: 16,
    studentId: 'student-12',
    leaveType: 'Family Function Leave',
    fromDate: shiftDate(8),
    toDate: shiftDate(9),
    submittedAt: timestampDaysAgo(6, 11, 25),
    status: 'approved',
    decisionAt: timestampDaysAgo(5, 12, 10),
    remarks:
      'Approved. Please ensure lab records are completed before departure.',
  }),
  buildLeave({
    number: 17,
    studentId: 'student-13',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(1),
    toDate: shiftDate(2),
    submittedAt: timestampDaysAgo(4, 15, 50),
    status: 'rejected',
    decisionAt: timestampDaysAgo(3, 9, 10),
    rejectionReason:
      'The uploaded prescription does not mention the recommended rest period. Please submit a complete medical certificate.',
  }),
  buildLeave({
    number: 18,
    studentId: 'student-14',
    leaveType: 'Casual Leave',
    fromDate: shiftDate(-15),
    toDate: shiftDate(-14),
    submittedAt: timestampDaysAgo(17, 10, 30),
    status: 'approved',
    decisionAt: timestampDaysAgo(16, 11, 0),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 19,
    studentId: 'student-15',
    leaveType: 'Other',
    fromDate: shiftDate(12),
    toDate: shiftDate(13),
    submittedAt: timestampDaysAgo(1, 16, 45),
    document: eventDoc,
  }),
  buildLeave({
    number: 20,
    studentId: 'student-16',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(-30),
    toDate: shiftDate(-28),
    submittedAt: timestampDaysAgo(32, 9, 15),
    status: 'approved',
    decisionAt: timestampDaysAgo(31, 10, 0),
    remarks: 'Approved. Department attendance office informed.',
  }),
  buildLeave({
    number: 21,
    studentId: 'student-17',
    leaveType: 'Casual Leave',
    fromDate: shiftDate(-1),
    toDate: shiftDate(1),
    submittedAt: timestampDaysAgo(5, 18, 10),
    status: 'reopened',
    decisionAt: timestampDaysAgo(4, 10, 0),
    reopenedAt: timestampDaysAgo(2, 14, 20),
    reopenReason:
      'The reason provided is too brief. Please add the purpose of travel and the dates of the family commitment.',
    previousDecision: {
      status: 'rejected',
      at: timestampDaysAgo(4, 10, 0),
      by: 'Demo HOD MCA',
      byId: 'hod-5',
      note: 'Insufficient explanation for the requested leave.',
    },
    history: [
      {
        status: 'submitted',
        label: 'Application submitted',
        at: timestampDaysAgo(5, 18, 10),
        by: 'Demo Parent 16',
        note: 'Leave request submitted from the parent portal.',
      },
      {
        status: 'rejected',
        label: 'Rejected by HOD',
        at: timestampDaysAgo(4, 10, 0),
        by: 'Demo HOD MCA',
        note: 'Insufficient explanation for the requested leave.',
      },
      {
        status: 'reopened',
        label: 'Reopened for correction',
        at: timestampDaysAgo(2, 14, 20),
        by: 'Demo HOD MCA',
        note: 'The reason provided is too brief. Please add the purpose of travel and the dates of the family commitment.',
      },
    ],
  }),
  buildLeave({
    number: 22,
    studentId: 'student-18',
    leaveType: 'Medical Leave',
    fromDate: shiftDate(2),
    toDate: shiftDate(3),
    submittedAt: timestampDaysAgo(1, 10, 5),
    document: medicalDoc,
  }),
  buildLeave({
    number: 23,
    studentId: 'student-19',
    leaveType: 'Family Function Leave',
    fromDate: shiftDate(5),
    toDate: shiftDate(6),
    submittedAt: timestampDaysAgo(3, 9, 40),
    status: 'approved',
    decisionAt: timestampDaysAgo(2, 11, 15),
    remarks: 'Approved. The tutor has been informed about the absence.',
  }),
  buildLeave({
    number: 24,
    studentId: 'student-20',
    leaveType: 'Emergency Leave',
    fromDate: shiftDate(-4),
    toDate: shiftDate(-3),
    submittedAt: timestampDaysAgo(5, 21, 0),
    status: 'rejected',
    decisionAt: timestampDaysAgo(4, 9, 30),
    rejectionReason:
      'Late submission with no supporting document. Please apply in advance for planned family travel.',
  }),
  buildLeave({
    number: 25,
    studentId: 'student-1',
    leaveType: 'Medical Leave',
    fromDate: dateInMonth(YEAR, 0, 12),
    toDate: dateInMonth(YEAR, 0, 13),
    submittedAt: timestampInMonth(0, 10, 9),
    status: 'approved',
    decisionAt: timestampInMonth(0, 10, 15),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 26,
    studentId: 'student-3',
    leaveType: 'Casual Leave',
    fromDate: dateInMonth(YEAR, 1, 5),
    toDate: dateInMonth(YEAR, 1, 6),
    submittedAt: timestampInMonth(1, 3, 11),
    status: 'rejected',
    decisionAt: timestampInMonth(1, 4, 10),
    rejectionReason: 'Class assessment scheduled during the requested period.',
  }),
  buildLeave({
    number: 27,
    studentId: 'student-5',
    leaveType: 'Medical Leave',
    fromDate: dateInMonth(YEAR, 2, 18),
    toDate: dateInMonth(YEAR, 2, 19),
    submittedAt: timestampInMonth(2, 16, 10),
    status: 'approved',
    decisionAt: timestampInMonth(2, 17, 12),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 28,
    studentId: 'student-7',
    leaveType: 'Family Function Leave',
    fromDate: dateInMonth(YEAR, 3, 8),
    toDate: dateInMonth(YEAR, 3, 9),
    submittedAt: timestampInMonth(3, 6, 14),
    status: 'approved',
    decisionAt: timestampInMonth(3, 7, 9),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 29,
    studentId: 'student-9',
    leaveType: 'Medical Leave',
    fromDate: dateInMonth(YEAR, 4, 20),
    toDate: dateInMonth(YEAR, 4, 21),
    submittedAt: timestampInMonth(4, 18, 11),
    status: 'approved',
    decisionAt: timestampInMonth(4, 19, 10),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 30,
    studentId: 'student-11',
    leaveType: 'Casual Leave',
    fromDate: dateInMonth(YEAR, 5, 10),
    toDate: dateInMonth(YEAR, 5, 11),
    submittedAt: timestampInMonth(5, 8, 10),
    status: 'approved',
    decisionAt: timestampInMonth(5, 9, 12),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 31,
    studentId: 'student-13',
    leaveType: 'Medical Leave',
    fromDate: dateInMonth(YEAR, 6, 15),
    toDate: dateInMonth(YEAR, 6, 16),
    submittedAt: timestampInMonth(6, 13, 9),
    status: 'approved',
    decisionAt: timestampInMonth(6, 14, 13),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 32,
    studentId: 'student-15',
    leaveType: 'Other',
    fromDate: dateInMonth(YEAR, 7, 22),
    toDate: dateInMonth(YEAR, 7, 23),
    submittedAt: timestampInMonth(7, 20, 10),
    status: 'rejected',
    decisionAt: timestampInMonth(7, 21, 11),
    rejectionReason: 'Insufficient notice and no supporting document provided.',
  }),
  buildLeave({
    number: 33,
    studentId: 'student-17',
    leaveType: 'Medical Leave',
    fromDate: dateInMonth(YEAR, 8, 9),
    toDate: dateInMonth(YEAR, 8, 10),
    submittedAt: timestampInMonth(8, 7, 10),
    status: 'approved',
    decisionAt: timestampInMonth(8, 8, 15),
    remarks: 'Approved.',
  }),
  buildLeave({
    number: 34,
    studentId: 'student-19',
    leaveType: 'Casual Leave',
    fromDate: dateInMonth(YEAR, 9, 6),
    toDate: dateInMonth(YEAR, 9, 7),
    submittedAt: timestampInMonth(9, 4, 10),
    status: 'approved',
    decisionAt: timestampInMonth(9, 5, 14),
    remarks: 'Approved.',
  }),
]

function recipientKey(recipient) {
  return `${recipient.role}:${recipient.id}`
}

function buildNotifications() {
  const list = []
  let counter = 1

  const push = ({
    type,
    title,
    message,
    createdAt,
    applicationId,
    recipients,
    readFor = [],
  }) => {
    const readBy = []
    recipients.forEach((recipient) => {
      const key = recipientKey(recipient)
      const isRecent =
        Date.now() - new Date(createdAt).getTime() < 36 * 3600 * 1000
      if (!isRecent || readFor.includes(key)) readBy.push(key)
    })
    list.push({
      id: `ntf-${String(counter).padStart(3, '0')}`,
      type,
      title,
      message,
      createdAt,
      applicationId,
      recipients,
      readBy,
    })
    counter += 1
  }

  leavesSeed.forEach((leave) => {
    const student = studentsSeed.find((item) => item.id === leave.studentId)
    if (!student) return
    const classItem = classesSeed.find((item) => item.id === student.classId)
    const tutor = tutorsSeed.find((item) => item.id === classItem?.tutorId)
    const parent = parentsSeed.find((item) => item.id === student.parentId)
    const hod = hodsSeed.find(
      (item) => item.departmentId === student.departmentId,
    )
    if (!parent || !hod) return

    const isActive = ['pending', 'reopened'].includes(leave.status)
    const submittedRecently =
      Date.now() - new Date(leave.submittedAt).getTime() < 30 * 86400000

    if (isActive || submittedRecently) {
      push({
        type: 'new_application',
        title: 'New leave application received',
        message: `${parent.name} submitted a ${LEAVE_TYPE_SHORT[leave.leaveType]} leave request for ${student.name} (${student.registerNumber}).`,
        createdAt: leave.submittedAt,
        applicationId: leave.id,
        recipients: [{ role: ROLES.HOD, id: hod.id }],
      })
    }

    if (!leave.decisionAt) return

    const parentRecipient = { role: ROLES.PARENT, id: parent.id }
    const hodRecipient = { role: ROLES.HOD, id: hod.id }

    if (leave.status === 'approved') {
      push({
        type: 'leave_approved',
        title: 'Leave application approved',
        message: `${student.name}'s ${LEAVE_TYPE_SHORT[leave.leaveType].toLowerCase()} leave (${leave.id}) was approved by the HOD.`,
        createdAt: leave.decisionAt,
        applicationId: leave.id,
        recipients: [hodRecipient, parentRecipient],
      })
      if (tutor) {
        push({
          type: 'forwarded_to_tutor',
          title: 'Approved leave forwarded',
          message: `${student.name} (${student.registerNumber}) has approved leave from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)}. Review the class attendance plan.`,
          createdAt: leave.decisionAt,
          applicationId: leave.id,
          recipients: [{ role: ROLES.CLASS_TUTOR, id: tutor.id }],
        })
      }
    } else if (leave.status === 'rejected') {
      push({
        type: 'leave_rejected',
        title: 'Leave application rejected',
        message: `${student.name}'s ${LEAVE_TYPE_SHORT[leave.leaveType].toLowerCase()} leave (${leave.id}) was rejected. Please review the HOD remarks.`,
        createdAt: leave.decisionAt,
        applicationId: leave.id,
        recipients: [hodRecipient, parentRecipient],
      })
    } else if (leave.status === 'reopened') {
      push({
        type: 'application_reopened',
        title: 'Application reopened for correction',
        message: `${student.name}'s leave request (${leave.id}) was reopened. ${leave.reopenReason}`,
        createdAt: leave.reopenedAt || leave.decisionAt,
        applicationId: leave.id,
        recipients: [hodRecipient, parentRecipient],
      })
    }
  })

  push({
    type: 'administration_notice',
    title: 'Demo accounts refreshed',
    message:
      'The four-role demo dataset is active: 5 departments, 10 classes, 20 students and 20 parent accounts. Use DEMO_CREDENTIALS.md for role-specific sign-in details.',
    createdAt: timestampDaysAgo(2, 9, 0),
    recipients: [{ role: ROLES.ADMIN, id: 'admin-1' }],
  })
  push({
    type: 'administration_notice',
    title: 'Account activation review',
    message:
      'Account activation and password resets are simulated in this frontend build. No plaintext password is stored with college records.',
    createdAt: timestampDaysAgo(1, 11, 30),
    recipients: [{ role: ROLES.ADMIN, id: 'admin-1' }],
  })

  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function createSeedData() {
  // Return a deep copy so a caller that edits a seeded record can never mutate
  // the shared seed definitions for the next reset or reload.
  return structuredClone({
    version: DEMO_SEED_VERSION,
    adminStatus: 'active',
    departments: departmentsSeed,
    hods: hodsSeed,
    classes: classesSeed,
    tutors: tutorsSeed,
    students: studentsSeed,
    parents: parentsSeed,
    leaves: leavesSeed,
    notifications: buildNotifications(),
  })
}
