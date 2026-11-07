import {
  DEMO_HOD_CREDENTIALS_STORAGE_KEY,
  ROLES,
  ROLE_VALUES,
} from '../constants/index.js'

/**
 * Development-only demo accounts.
 *
 * This file is the single source of truth for public development-only demo
 * credentials used by the frontend prototype. A real deployment must
 * authenticate against hashed passwords (bcrypt/Argon2) stored server-side and
 * must never ship credentials in client code.
 */
export const DEMO_ACCOUNTS = [
  {
    id: 'admin-1',
    role: ROLES.ADMIN,
    name: 'Demo Administrator',
    email: 'admin@example.com',
    password: 'DemoOnly!awZZHVV8HBtboiE2aL',
    phone: '+1-202-555-0100',
    designation: 'College Administrator',
    status: 'active',
  },

  // Heads of Department — exactly one per department.
  {
    id: 'hod-1',
    employeeId: 'DEMO-HOD-001',
    role: ROLES.HOD,
    name: 'Demo HOD CSE',
    email: 'hod.cse@example.com',
    password: 'DemoOnly!jmYCbHsQNmRaKawP2m',
    phone: '+1-202-555-0101',
    designation: 'Head of Department',
    departmentId: 'dept-cse',
    status: 'active',
  },
  {
    id: 'hod-2',
    employeeId: 'DEMO-HOD-002',
    role: ROLES.HOD,
    name: 'Demo HOD IT',
    email: 'hod.it@example.com',
    password: 'DemoOnly!KWGCoT5E4vWgTxktZs',
    phone: '+1-202-555-0102',
    designation: 'Head of Department',
    departmentId: 'dept-it',
    status: 'active',
  },
  {
    id: 'hod-3',
    employeeId: 'DEMO-HOD-003',
    role: ROLES.HOD,
    name: 'Demo HOD ECE',
    email: 'hod.ece@example.com',
    password: 'DemoOnly!Ti4wiCeYVYNFfmYYic',
    phone: '+1-202-555-0103',
    designation: 'Head of Department',
    departmentId: 'dept-ece',
    status: 'active',
  },
  {
    id: 'hod-4',
    employeeId: 'DEMO-HOD-004',
    role: ROLES.HOD,
    name: 'Demo HOD MECH',
    email: 'hod.mech@example.com',
    password: 'DemoOnly!XXEdrHNSqjQkDqREj3',
    phone: '+1-202-555-0104',
    designation: 'Head of Department',
    departmentId: 'dept-mech',
    status: 'active',
  },
  {
    id: 'hod-5',
    employeeId: 'DEMO-HOD-005',
    role: ROLES.HOD,
    name: 'Demo HOD MCA',
    email: 'hod.mca@example.com',
    password: 'DemoOnly!ngw9qZSbdaEipGc6bh',
    phone: '+1-202-555-0105',
    designation: 'Head of Department',
    departmentId: 'dept-mca',
    status: 'active',
  },

  // Class tutors — each tutor coordinates exactly one class in the seed.
  {
    id: 'tutor-1',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 01',
    email: 'tutor01@example.com',
    password: 'DemoOnly!J2m9h9puqoGnWoY9W8',
    phone: '+1-202-555-0106',
    designation: 'Associate Professor',
    departmentId: 'dept-cse',
    status: 'active',
  },
  {
    id: 'tutor-2',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 02',
    email: 'tutor02@example.com',
    password: 'DemoOnly!qEAKUrPQPaCpeFVu8w',
    phone: '+1-202-555-0107',
    designation: 'Assistant Professor',
    departmentId: 'dept-cse',
    status: 'active',
  },
  {
    id: 'tutor-3',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 03',
    email: 'tutor03@example.com',
    password: 'DemoOnly!QELVASmzBcK7JtQrv7',
    phone: '+1-202-555-0108',
    designation: 'Associate Professor',
    departmentId: 'dept-it',
    status: 'active',
  },
  {
    id: 'tutor-4',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 04',
    email: 'tutor04@example.com',
    password: 'DemoOnly!7nRzELhQzvrJkZDtEw',
    phone: '+1-202-555-0109',
    designation: 'Assistant Professor',
    departmentId: 'dept-ece',
    status: 'active',
  },
  {
    id: 'tutor-5',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 05',
    email: 'tutor05@example.com',
    password: 'DemoOnly!DbgbJwd3DCSnAB4K7x',
    phone: '+1-202-555-0110',
    designation: 'Professor',
    departmentId: 'dept-mech',
    status: 'active',
  },
  {
    id: 'tutor-6',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 06',
    email: 'tutor06@example.com',
    password: 'DemoOnly!3C7kcdT8Venuk6Koxt',
    phone: '+1-202-555-0111',
    designation: 'Assistant Professor',
    departmentId: 'dept-mca',
    status: 'active',
  },
  {
    id: 'tutor-7',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 07',
    email: 'tutor07@example.com',
    password: 'DemoOnly!2XXW24FHqKA92mgFLp',
    phone: '+1-202-555-0112',
    designation: 'Assistant Professor',
    departmentId: 'dept-it',
    status: 'active',
  },
  {
    id: 'tutor-8',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 08',
    email: 'tutor08@example.com',
    password: 'DemoOnly!aBHGKS3aV958AxHCpQ',
    phone: '+1-202-555-0113',
    designation: 'Associate Professor',
    departmentId: 'dept-ece',
    status: 'active',
  },
  {
    id: 'tutor-9',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 09',
    email: 'tutor09@example.com',
    password: 'DemoOnly!xgKrXgr8ZJU9qxgabD',
    phone: '+1-202-555-0114',
    designation: 'Assistant Professor',
    departmentId: 'dept-mech',
    status: 'active',
  },
  {
    id: 'tutor-10',
    role: ROLES.CLASS_TUTOR,
    name: 'Demo Tutor 10',
    email: 'tutor10@example.com',
    password: 'DemoOnly!LJuBhFWMYowiP8pwFr',
    phone: '+1-202-555-0115',
    designation: 'Assistant Professor',
    departmentId: 'dept-mca',
    status: 'active',
  },

  // Parents / guardians — at least one linked child each. parent-1 and
  // parent-20 demonstrate multiple guardians for the same student.
  {
    id: 'parent-1',
    role: ROLES.PARENT,
    name: 'Demo Parent 01',
    email: 'parent01@example.com',
    password: 'DemoOnly!xHaSRRGFRFMrfW9jJE',
    phone: '+1-202-555-0116',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-1', 'student-2'],
    status: 'active',
  },
  {
    id: 'parent-2',
    role: ROLES.PARENT,
    name: 'Demo Parent 02',
    email: 'parent02@example.com',
    password: 'DemoOnly!c2LjkPwAWTnSiFdomo',
    phone: '+1-202-555-0117',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-3'],
    status: 'active',
  },
  {
    id: 'parent-3',
    role: ROLES.PARENT,
    name: 'Demo Parent 03',
    email: 'parent03@example.com',
    password: 'DemoOnly!RoPZLbRPG8bT23WTQj',
    phone: '+1-202-555-0118',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-4'],
    status: 'active',
  },
  {
    id: 'parent-4',
    role: ROLES.PARENT,
    name: 'Demo Parent 04',
    email: 'parent04@example.com',
    password: 'DemoOnly!epHejcQrpsmeYwZrZU',
    phone: '+1-202-555-0119',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-5'],
    status: 'active',
  },
  {
    id: 'parent-5',
    role: ROLES.PARENT,
    name: 'Demo Parent 05',
    email: 'parent05@example.com',
    password: 'DemoOnly!22ZHAYXjLGcQ8sgyyx',
    phone: '+1-202-555-0120',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-6'],
    status: 'active',
  },
  {
    id: 'parent-6',
    role: ROLES.PARENT,
    name: 'Demo Parent 06',
    email: 'parent06@example.com',
    password: 'DemoOnly!LamFVsFFonRfvWAcdG',
    phone: '+1-202-555-0121',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-7'],
    status: 'active',
  },
  {
    id: 'parent-7',
    role: ROLES.PARENT,
    name: 'Demo Parent 07',
    email: 'parent07@example.com',
    password: 'DemoOnly!WBvo6EL8hgVUELG2cv',
    phone: '+1-202-555-0122',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-8'],
    status: 'active',
  },
  {
    id: 'parent-8',
    role: ROLES.PARENT,
    name: 'Demo Parent 08',
    email: 'parent08@example.com',
    password: 'DemoOnly!TEdMhZeCJj4oSzuUec',
    phone: '+1-202-555-0123',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-9'],
    status: 'active',
  },
  {
    id: 'parent-9',
    role: ROLES.PARENT,
    name: 'Demo Parent 09',
    email: 'parent09@example.com',
    password: 'DemoOnly!BDgdEGiSaQwWPqwAHV',
    phone: '+1-202-555-0124',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-10'],
    status: 'active',
  },
  {
    id: 'parent-10',
    role: ROLES.PARENT,
    name: 'Demo Parent 10',
    email: 'parent10@example.com',
    password: 'DemoOnly!QHhXSYDGMaZs53Vyqf',
    phone: '+1-202-555-0125',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-11'],
    status: 'active',
  },
  {
    id: 'parent-11',
    role: ROLES.PARENT,
    name: 'Demo Parent 11',
    email: 'parent11@example.com',
    password: 'DemoOnly!2JMz7kdyRS6B5xPkqJ',
    phone: '+1-202-555-0126',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-12'],
    status: 'active',
  },
  {
    id: 'parent-12',
    role: ROLES.PARENT,
    name: 'Demo Parent 12',
    email: 'parent12@example.com',
    password: 'DemoOnly!fMbuqr7EZSYW98FEYg',
    phone: '+1-202-555-0127',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-13'],
    status: 'active',
  },
  {
    id: 'parent-13',
    role: ROLES.PARENT,
    name: 'Demo Parent 13',
    email: 'parent13@example.com',
    password: 'DemoOnly!TQGMEdNrboALiYA4RT',
    phone: '+1-202-555-0128',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-14'],
    status: 'active',
  },
  {
    id: 'parent-14',
    role: ROLES.PARENT,
    name: 'Demo Parent 14',
    email: 'parent14@example.com',
    password: 'DemoOnly!9zqHWvm59GcGRbjWCH',
    phone: '+1-202-555-0129',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-15'],
    status: 'active',
  },
  {
    id: 'parent-15',
    role: ROLES.PARENT,
    name: 'Demo Parent 15',
    email: 'parent15@example.com',
    password: 'DemoOnly!SPRC5AJWooEnzA5jcQ',
    phone: '+1-202-555-0130',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-16'],
    status: 'active',
  },
  {
    id: 'parent-16',
    role: ROLES.PARENT,
    name: 'Demo Parent 16',
    email: 'parent16@example.com',
    password: 'DemoOnly!wqCkjvPCRHWTRg8uBr',
    phone: '+1-202-555-0131',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-17'],
    status: 'active',
  },
  {
    id: 'parent-17',
    role: ROLES.PARENT,
    name: 'Demo Parent 17',
    email: 'parent17@example.com',
    password: 'DemoOnly!PwjRZHRpFdWZEAgmK6',
    phone: '+1-202-555-0132',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-18'],
    status: 'active',
  },
  {
    id: 'parent-18',
    role: ROLES.PARENT,
    name: 'Demo Parent 18',
    email: 'parent18@example.com',
    password: 'DemoOnly!REY37wxqhzJgZx4GTx',
    phone: '+1-202-555-0133',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-19'],
    status: 'active',
  },
  {
    id: 'parent-19',
    role: ROLES.PARENT,
    name: 'Demo Parent 19',
    email: 'parent19@example.com',
    password: 'DemoOnly!sGJ7AZTZgZBvYkFV6B',
    phone: '+1-202-555-0134',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-20'],
    status: 'active',
  },
  {
    id: 'parent-20',
    role: ROLES.PARENT,
    name: 'Demo Parent 20',
    email: 'parent20@example.com',
    password: 'DemoOnly!USEWdVsFXXjcGNCSwE',
    phone: '+1-202-555-0135',
    designation: 'Parent / Guardian',
    address: '100 Example Street, Test City, ZZ 00000',
    childIds: ['student-1'],
    status: 'active',
  },
]

export const DEMO_ACCOUNTS_BY_ROLE = ROLE_VALUES.reduce((groups, role) => {
  groups[role] = DEMO_ACCOUNTS.filter((account) => account.role === role)
  return groups
}, {})

export const DEMO_CREDENTIALS = ROLE_VALUES.reduce((credentials, role) => {
  const account = DEMO_ACCOUNTS_BY_ROLE[role]?.[0]
  if (account) {
    credentials[role] = {
      email: account.email,
      password: account.password,
      name: account.name,
    }
  }
  return credentials
}, {})

function readDemoHodPasswords() {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(DEMO_HOD_CREDENTIALS_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveDemoHodPassword(hodId, password) {
  if (typeof localStorage === 'undefined') return
  const credentials = readDemoHodPasswords()
  credentials[hodId] = password
  localStorage.setItem(
    DEMO_HOD_CREDENTIALS_STORAGE_KEY,
    JSON.stringify(credentials),
  )
}

export function getDemoAccounts(db) {
  const seededIds = new Set(DEMO_ACCOUNTS.map((account) => account.id))
  const passwords = readDemoHodPasswords()
  const addedHods = (db?.hods || []).flatMap((hod) => {
    if (seededIds.has(hod.id) || !passwords[hod.id]) return []
    return [{ ...hod, password: passwords[hod.id] }]
  })
  return [...DEMO_ACCOUNTS, ...addedHods]
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function publicAccount(account) {
  if (!account) return null
  const { password: _password, ...safe } = account
  return safe
}

export function demoAccountById(id) {
  return DEMO_ACCOUNTS.find((account) => account.id === id) || null
}

function statusForAccount(db, account) {
  if (!db || !account) return account?.status || 'active'
  if (account.role === ROLES.ADMIN) return db.adminStatus || account.status
  const collection =
    account.role === ROLES.HOD
      ? db.hods
      : account.role === ROLES.CLASS_TUTOR
        ? db.tutors
        : db.parents
  const entity = (collection || []).find((item) => item.id === account.id)
  return entity?.status || 'inactive'
}

function accountRecord(db, account) {
  if (!db || !account || account.role === ROLES.ADMIN) return null
  const collection =
    account.role === ROLES.HOD
      ? db.hods
      : account.role === ROLES.CLASS_TUTOR
        ? db.tutors
        : db.parents
  return (collection || []).find((item) => item.id === account.id) || null
}

export function demoCredentialsForRole(db, role) {
  const account = getDemoAccounts(db).find(
    (item) => item.role === role && statusForAccount(db, item) === 'active',
  )
  if (!account) return null
  const record = accountRecord(db, account)
  return {
    email: record?.email || account.email,
    password: account.password,
    name: record?.name || account.name,
  }
}

export function isDemoAccountActive(db, user) {
  if (!user || !ROLE_VALUES.includes(user.role)) return false
  if (user.role === ROLES.ADMIN) return (db?.adminStatus || 'active') === 'active'
  const collection =
    user.role === ROLES.HOD
      ? db?.hods
      : user.role === ROLES.CLASS_TUTOR
        ? db?.tutors
        : db?.parents
  return collection?.find((account) => account.id === user.id)?.status === 'active'
}

/**
 * Validates a demo email/password pair against the development account list and
 * the current browser-local account status (so admin activation works).
 * Returns `{ user }` on success or `{ error }` on failure.
 */
export function authenticateDemoUser(email, password, db) {
  const normalizedEmail = normalizeEmail(email)
  const account = getDemoAccounts(db).find((item) => {
    const currentRecord = accountRecord(db, item)
    return normalizeEmail(currentRecord?.email || item.email) === normalizedEmail
  })
  if (!account || account.password !== password) {
    return { error: 'Invalid email or password for this portal.' }
  }
  if (statusForAccount(db, account) === 'inactive') {
    return {
      error:
        'This account is inactive. Contact the college administrator to reactivate it.',
    }
  }
  return { user: publicAccount({ ...account, ...accountRecord(db, account) }) }
}
