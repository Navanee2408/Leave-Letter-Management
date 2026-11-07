import assert from 'node:assert/strict'
import test from 'node:test'
import { shiftDate } from '../lib/date.js'
import { leaveApplicationSchema } from './leaveValidation.js'

function application(fromDate, toDate) {
  return {
    studentId: 'student-1',
    leaveType: 'Medical Leave',
    fromDate,
    toDate,
    reason: 'Medical appointment and recovery at home.',
  }
}

test('valid ISO leave dates pass and remain in the submission payload', () => {
  const fromDate = shiftDate(4)
  const toDate = shiftDate(5)
  const result = leaveApplicationSchema.safeParse(application(fromDate, toDate))

  assert.equal(result.success, true)
  assert.equal(result.data.fromDate, fromDate)
  assert.equal(result.data.toDate, toDate)
})

test('same-day leave is valid and an earlier To date has the requested error', () => {
  const date = shiftDate(4)
  assert.equal(leaveApplicationSchema.safeParse(application(date, date)).success, true)

  const invalid = leaveApplicationSchema.safeParse(
    application(shiftDate(5), shiftDate(4)),
  )
  assert.equal(invalid.success, false)
  assert.equal(
    invalid.error.issues.find((issue) => issue.path[0] === 'toDate')?.message,
    'To date must be on or after From date.',
  )
})

test('locale-formatted strings and past dates are rejected', () => {
  const localeDate = leaveApplicationSchema.safeParse(
    application('05-11-2026', '06-11-2026'),
  )
  assert.equal(localeDate.success, false)
  assert.ok(localeDate.error.issues.some((issue) => issue.message === 'Select a valid From date.'))

  const pastDate = leaveApplicationSchema.safeParse(
    application(shiftDate(-1), shiftDate(1)),
  )
  assert.equal(pastDate.success, false)
  assert.ok(pastDate.error.issues.some((issue) => issue.message === 'From date cannot be in the past.'))
})

test('a reversed range keeps the range error when both dates are in the past', () => {
  const invalid = leaveApplicationSchema.safeParse(
    application(shiftDate(-2), shiftDate(-3)),
  )
  assert.equal(invalid.success, false)
  assert.equal(
    invalid.error.issues.find((issue) => issue.path[0] === 'toDate')?.message,
    'To date must be on or after From date.',
  )
})