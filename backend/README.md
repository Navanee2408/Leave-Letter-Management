# College Leave Letter Management — Backend

Backend for the College Leave Letter Management System, built with Express,
MongoDB, Mongoose, JWT, and Zod.

- **Phase 1 (complete):** application skeleton and health-check API.
- **Phase 2 (complete):** secure JWT authentication, role-based authorization,
  User and Department models, refresh-session management, and an admin seed
  script.
- **Phase 3 (complete):** dynamic department administration, HOD account
  management, department-scoped HOD isolation, and an initial department seed
  script.
- **Phase 4 (complete):** classes, tutors, students, parent accounts,
  parent-child relationships, scoped tutor/parent self-service endpoints, and
  idempotent demo seed data.
- **Phase 5 (complete):** leave application submission, parent/HOD-scoped
  application read APIs, an immutable audit history, and optional private
  supporting documents.
- **Phase 6 (complete):** HOD approval, rejection, and reopening; append-only
  decision history; persistent parent/tutor notifications; and a tutor
  approved-leaves API.
- **Phase 7 (complete):** notification inbox REST APIs and authenticated
  Socket.IO real-time delivery with per-user room isolation.

The existing React frontend in `../frontend` is unchanged and is **not** wired
to this API yet. Document cloud storage is not implemented yet.

## Tech stack

- Node.js (20 or newer) with ES Modules
- Express 5
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`) and `bcryptjs`
- Zod for environment and request validation
- Helmet, CORS, `express-rate-limit`, `cookie-parser`, and Morgan
- Socket.IO for authenticated real-time notification delivery
- Node.js built-in test runner (`node --test`)
- Nodemon for development

## Folder structure

```text
backend/
├── docs/
│   └── DEV_SEED_CREDENTIALS.md   # Development-only demo login credentials
├── storage/                      # Private local document storage (gitignored)
├── scripts/
│   ├── seedAcademicData.js      # Idempotent Phase 4 demo data seed
│   ├── seedAdmin.js              # Environment-driven admin bootstrap
│   └── seedDepartments.js        # Idempotent initial department seed
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection + live status
│   │   └── env.js                # Environment loading and validation
│   ├── constants/
│   │   └── index.js              # Roles, status, leave, and relationship values
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── class.controller.js
│   │   ├── department.controller.js
│   │   ├── health.controller.js
│   │   ├── hod.controller.js
│   │   ├── leaveApplication.controller.js
│   │   ├── notification.controller.js
│   │   ├── parent.controller.js
│   │   ├── student.controller.js
│   │   └── tutor.controller.js
│   ├── middleware/
│   │   ├── authenticate.js       # Bearer token + DB-backed user lookup
│   │   ├── authorizeDepartmentAccess.js
│   │   ├── authorizeParentAccess.js
│   │   ├── authorizeRoles.js     # Role restriction
│   │   ├── errorHandler.js       # Centralized error responses
│   │   ├── notFound.js           # JSON 404 handling
│   │   ├── rateLimiter.js        # API and login rate limits
│   │   ├── requestLogger.js
│   │   ├── uploadSupportingDocument.js  # Optional multipart upload, 5 MB cap
│   │   └── validate.js           # Zod body/query/params validation
│   ├── models/
│   │   ├── Class.js
│   │   ├── Department.js
│   │   ├── LeaveApplication.js
│   │   ├── LeaveApplicationHistory.js
│   │   ├── Notification.js
│   │   ├── ParentStudent.js
│   │   ├── RefreshSession.js
│   │   ├── Student.js
│   │   ├── User.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── class.routes.js
│   │   ├── department.routes.js
│   │   ├── health.routes.js
│   │   ├── hod.routes.js
│   │   ├── index.js
│   │   ├── leaveApplication.routes.js
│   │   ├── notification.routes.js
│   │   ├── parent.routes.js
│   │   ├── student.routes.js
│   │   └── tutor.routes.js
│   ├── realtime/
│   │   └── socketServer.js       # Authenticated Socket.IO server and user rooms
│   ├── services/
│   │   ├── auth.service.js       # Login, refresh rotation, logout
│   │   ├── class.service.js
│   │   ├── department.service.js
│   │   ├── documentStorage.service.js  # Private local document storage
│   │   ├── health.service.js
│   │   ├── hod.service.js        # HOD lifecycle and replacement
│   │   ├── leaveApplication.service.js  # Submission, scoping, history, decisions
│   │   ├── notification.service.js  # Persistent, reusable notifications
│   │   ├── parent.service.js     # Parent accounts and child links
│   │   ├── student.service.js
│   │   ├── token.service.js      # JWT signing/verification, hashing
│   │   └── tutor.service.js      # Tutor accounts and class assignments
│   ├── utils/
│   │   ├── AppError.js
│   │   ├── asyncHandler.js
│   │   ├── cookies.js            # Refresh cookie options
│   │   ├── databaseErrors.js     # Duplicate-key conflict mapping
│   │   └── escapeRegExp.js       # Safe search patterns
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── class.validator.js
│   │   ├── common.validator.js   # ObjectId, status, pagination
│   │   ├── department.validator.js
│   │   ├── hod.validator.js
│   │   ├── leaveApplication.validator.js
│   │   ├── notification.validator.js
│   │   ├── parent.validator.js
│   │   ├── student.validator.js
│   │   └── tutor.validator.js
│   ├── app.js                    # Express app factory
│   └── server.js                 # Database connection + HTTP server
├── tests/
│   ├── support/
│   │   ├── authTestUtils.js
│   │   ├── managementTestUtils.js
│   │   ├── testDatabase.js
│   │   └── testServer.js
│   ├── academicSeed.test.js
│   ├── auth.test.js
│   ├── authorizeRoles.test.js
│   ├── classAuthorization.test.js
│   ├── classes.test.js
│   ├── database.test.js
│   ├── departments.test.js
│   ├── error.test.js
│   ├── health.test.js
│   ├── hodAuthorization.test.js
│   ├── hods.test.js
│   ├── leaveApplications.test.js
│   ├── leaveAuthorization.test.js
│   ├── leaveConcurrency.test.js
│   ├── leaveDecisions.test.js
│   ├── leaveDocuments.test.js
│   ├── leaveNotifications.test.js
│   ├── leaveReopen.test.js
│   ├── notifications.test.js
│   ├── parents.test.js
│   ├── realtimeNotifications.test.js
│   ├── setup.js
│   ├── students.test.js
│   ├── tutors.test.js
│   └── user.model.test.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Installation

Requirements:

- Node.js 20 or newer and npm
- A MongoDB Atlas cluster (or another MongoDB instance) for live use
- A local or disposable MongoDB for running the test suite

From this `backend/` directory:

```bash
npm install
```

## Environment setup

Create your local environment file from the example:

```powershell
# PowerShell
Copy-Item .env.example .env
```

```bash
# Bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret

# Used only by `npm run seed:admin`
ADMIN_NAME=Initial Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_admin_password
```

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port for the API. Defaults to `5000`. |
| `NODE_ENV` | `development`, `test`, or `production`. |
| `MONGODB_URI` | MongoDB connection string. Required to start the server and to seed. |
| `CLIENT_URL` | Allowed frontend origin. A comma-separated list is supported. |
| `JWT_ACCESS_SECRET` | Signs access tokens. **Required**, at least 32 characters. |
| `JWT_REFRESH_SECRET` | Signs refresh tokens. **Required**, at least 32 characters, and must differ from the access secret. |
| `ADMIN_NAME` | Display name for the seeded administrator. |
| `ADMIN_EMAIL` | Email for the seeded administrator. |
| `ADMIN_PASSWORD` | Password for the seeded administrator. Hashed before storage. |
| `LEAVE_DOCUMENT_DIR` | Optional absolute path for private supporting-document storage. Defaults to `backend/storage/leave-documents`. |

`LEAVE_DOCUMENT_DIR` is optional and is mainly useful for deployments or tests
that need a different private storage location. Files are never served from a
public/static directory.

Generate strong secrets instead of using the example text. For example:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

The application refuses to start if a JWT secret is missing, shorter than 32
characters, or if the two secrets are identical.

### MongoDB notes

1. Create a dedicated database user for the application; do not use your Atlas
   account login.
2. Add your current IP address under **Network Access**. Avoid permanently
   allowing `0.0.0.0/0` in production.
3. Copy the driver connection string and replace the password placeholder.
   URL-encode special characters in the password.
4. Include a database name in the URI, for example:
   `mongodb+srv://<user>:<password>@<cluster>/college_leave_management?retryWrites=true&w=majority`

Never commit `.env`. The backend `.gitignore` excludes it, and only placeholder
values belong in `.env.example`. The server never logs the connection string,
passwords, or tokens.

> **Upgrading an existing Phase 2 database:** Phase 3 replaces the old
> `users.department_1` index with a partial unique index of the same key pattern.
> On a database that already has the Phase 2 index, drop it once with
> `db.users.dropIndex('department_1')` before starting the API, or use a fresh
> database. Mongoose then creates the Phase 3 indexes automatically.

## Start the server

Development mode with automatic restarts:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

The server connects to MongoDB **before** it starts listening. If
`MONGODB_URI` is missing or the connection fails, the process logs a sanitized
error and exits with code `1` instead of serving requests in a broken state.
Graceful shutdown is handled for `SIGINT` and `SIGTERM`.

In production the app sets `trust proxy` to `1` so secure cookies and rate-limit
client addresses work behind a reverse proxy.

Socket.IO is mounted on the same HTTP server and port. It shares the Express CORS
allowed origins and does not require a separate port.

## Roles

Exactly four roles are supported, and the same names are used everywhere:

| Role | Scope |
| --- | --- |
| `ADMIN` | College-wide. Never belongs to a department. |
| `HOD` | Department-scoped. A department is required. |
| `TUTOR` | May hold `assignedClasses` references. |
| `PARENT` | Standard guardian/student-facing account. |

Accounts also have an `accountStatus` of `ACTIVE` or `INACTIVE`. Inactive
accounts cannot log in and cannot keep using protected APIs.

### Authorization rules

| Operation | ADMIN | HOD | TUTOR | PARENT |
| --- | --- | --- | --- | --- |
| Create/update/activate/deactivate departments | yes | no | no | no |
| List departments | yes | no | no | no |
| Read a department | any | own only | no | no |
| Read a department's active HOD | any | own only | no | no |
| Create/update/activate/deactivate HOD accounts | yes | no | no | no |
| List/read HOD accounts | yes | no | no | no |
| Create/update/activate/deactivate classes | yes | no | no | no |
| List/read classes | all | own department | assigned only | no |
| Create/update/activate/deactivate tutors | yes | no | no | no |
| List/read tutors | all | own department | no | no |
| Tutor self-service classes/students | - | - | own only | - |
| Create/update/activate/deactivate students | yes | no | no | no |
| List/read students | all | own department | own classes only | linked children only |
| Create/update/activate/deactivate parents | yes | no | no | no |
| List/read parent accounts | all | no | no | no |
| Link/unlink parent and student | yes | no | no | no |
| Read a parent's child list | any | no | no | own only |
| Parent self-service children | - | - | - | own only |
| Submit leave applications | no | no | no | linked children only |
| List/read leave applications | all | own department | no | own only |
| Read leave application history | all | own department | no | own only |
| Download supporting documents | all | own department | no | own only |
| Approve pending leave applications | no | own department | no | no |
| Reject pending leave applications | no | own department | no | no |
| Reopen approved/rejected applications | no | own department | no | no |
| View approved leaves for assigned classes | no | no | own classes only | no |
| Read/mark own notifications | own only | own only | own only | own only |

- Authorization always uses the role, department, and account id loaded from
  MongoDB by the `authenticate` middleware. A department id, class id, parent
  id, or role sent by the client can never grant access.
- HODs have read-only access to classes, tutors, and students in their own
  department and cannot manage any account.
- Tutors only see classes assigned to them through `Class.assignedTutor` and the
  students in those classes. Cross-department data is never returned. Tutors see
  only `APPROVED` leave applications from those classes.
- Parents only see students linked through `ParentStudent`. A parent can read
  only their own child list; other parent and student requests return `403`.
- There is intentionally no department or class `DELETE` endpoint. Departments
  and classes are deactivated through their status endpoints, so linked users,
  students, and historical records are preserved.
- HODs cannot change their own role, department, or account status. All HOD
  management routes are ADMIN-only.
- Leave applications are always scoped by the authenticated database account.
  A PARENT can submit only for a student linked through `ParentStudent` and can
  read only their own applications. An HOD can read only applications whose
  stored department matches the HOD's authenticated department. A client-supplied
  department or parent id never grants access.
- Only HODs can call the approve, reject, and reopen decision routes, and only
  within their own department. ADMIN, TUTOR, and PARENT receive `403`.
- Parents and tutors have no route to change status, decision fields, or history.
  Decision endpoints accept only a comment or reason; actor, status, decision
  timestamp, and department always come from the authenticated database record.
- Notifications are persisted for the parent and, only after approval, the tutor
  assigned to the application's class. Rejection and reopening never notify the
  tutor.
- Notification inbox routes always filter by the authenticated database user.
  Listing, unread counts, and read updates never accept a recipient id from the
  client. Reading another user's notification returns `404`.
- Socket.IO connections authenticate with the same access token through the
  handshake `auth` payload. Each authenticated user joins only `user:<userId>`;
  there is no client-controlled room event and no department-wide broadcast.

## Data models

### `User`

- `fullName`
- `email` — required, normalized to lowercase, unique
- `password` — bcrypt hash, `select: false`, never returned by `toJSON()`
- `role` — one of `ADMIN`, `HOD`, `TUTOR`, `PARENT`
- `phone` — optional
- `employeeId` — optional, uppercase-normalized, unique when present
- `department` — optional `Department` reference
- `assignedClasses` — `Class` references, only retained for `TUTOR`
- `accountStatus` — `ACTIVE` or `INACTIVE`
- `lastLogin`
- `createdAt`, `updatedAt`

Schema hooks enforce the scope rules: `ADMIN` has no department, `HOD` requires
a department, and non-tutors cannot retain class assignments. A partial unique
index on `{ department }` (limited to `role: HOD` and `accountStatus: ACTIVE`)
atomically guarantees at most one active HOD per department, even under
concurrent requests.

### `Department`

- `name` — required, whitespace-normalized, unique regardless of case
- `code` — required, uppercase, unique
- `description` — optional
- `status` — `ACTIVE` or `INACTIVE`
- `createdAt`, `updatedAt`

Departments are dynamic; administrators can create as many as needed. The five
initial departments are optional seed data, not a hardcoded limit. Departments
are never deleted through the API; deactivate them instead so linked users and
historical attribution remain intact.

### `RefreshSession`

- `user` — `User` reference
- `jti` — unique token identifier
- `tokenHash` — SHA-256 hash of the refresh token, `select: false`
- `expiresAt` — TTL index for automatic cleanup
- `revokedAt` — set on rotation or logout
- `createdAt`, `updatedAt`

### `Class`

- `className` — required, whitespace-normalized
- `year` — required, stored as a string
- `section` — required
- `department` — required `Department` reference
- `assignedTutor` — optional `User` reference to one `TUTOR`
- `status` — `ACTIVE` or `INACTIVE`
- `classNameKey` — internal lowercase lookup key, `select: false`, never returned
- `createdAt`, `updatedAt`

A unique compound index on `{ department, classNameKey }` guarantees class names
are unique per department regardless of casing or repeated whitespace, while the
same name may be reused in another department. The class must reference an active
department, and an assigned tutor must be an active `TUTOR` in the same
department. `User.assignedClasses` is denormalized for convenience and kept in
sync by the class and tutor services; `Class.assignedTutor` remains the
authoritative source for tutor visibility. Classes are deactivated rather than
deleted, so linked students are never orphaned.

### `Student`

- `fullName` — required, whitespace-normalized
- `registerNumber` — required, uppercase-normalized, unique
- `email` — optional, lowercase-normalized, unique when present
- `phone` — optional
- `department` — required `Department` reference
- `class` — required `Class` reference
- `accountStatus` — `ACTIVE` or `INACTIVE`
- `createdAt`, `updatedAt`

The referenced department and class must both be active, and the student's
department must match the class department. Students do not have login accounts in
this phase.

### `ParentStudent`

- `parent` — required `User` reference with role `PARENT`
- `student` — required `Student` reference
- `relationship` — `Father`, `Mother`, or `Guardian`
- `createdAt`, `updatedAt`

The relationship is many-to-many: a parent may be linked to several students, and
a student may be linked to several parents. A unique compound index on
`{ parent, student }` prevents duplicate links. Parents see only the students
linked through this collection.

### `LeaveApplication`

- `applicationNumber` — required, unique, auto-generated as
  `LA-YYYYMMDD-<8 uppercase hex>`
- `parent` — required `User` reference (the submitting parent)
- `student` — required `Student` reference
- `department` — required `Department` reference, copied from the student record
- `class` — required `Class` reference, copied from the student record
- `leaveType` — `SICK_LEAVE`, `FAMILY_FUNCTION`, `PERSONAL`, `EMERGENCY`, or
  `OTHER`
- `fromDate`, `toDate` — normalized to UTC start-of-day
- `totalDays` — inclusive day count calculated on the server
- `reason` — 5–1000 characters after trimming
- `supportingDocument` — optional metadata: display name, stored name, MIME
  type, size, and upload timestamp
- `status` — `PENDING` (default), `APPROVED`, or `REJECTED`
- `decidedBy`, `decidedAt` — the latest HOD decision maker and timestamp
- `decisionComment` — optional approval comment
- `rejectionReason` — mandatory rejection reason when rejected
- `reopenedBy`, `reopenedAt`, `reopenReason` — latest reopening details
- `submittedAt` — set by the server on creation
- `createdAt`, `updatedAt`

Department and class are always read from the stored `Student`, never accepted
from the client, and the parent must be linked through `ParentStudent`. `fromDate`
cannot be in the past, `toDate` must be on or after `fromDate`, and the client
cannot set `status`, `totalDays`, `applicationNumber`, `parent`, `department`,
`class`, or any decision field. Status changes happen only through the HOD
decision endpoints.

The latest decision fields are convenient for fast reads. Every earlier
decision remains in `LeaveApplicationHistory`, so reopening and re-deciding
never destroys the audit trail.

### `LeaveApplicationHistory`

- `application` — required `LeaveApplication` reference
- `actor` — required `User` reference
- `actorName`, `actorEmail`, `actorRole` — snapshots for readable audit records
- `action` — `SUBMITTED`, `APPROVED`, `REJECTED`, or `REOPENED` (`UPDATED` is
  reserved for a later phase)
- `previousStatus`, `newStatus` — explicit transition data
- `reason` — approval comment, rejection reason, or reopening reason when
  applicable
- `details` — flexible action-specific data (application number, student,
  timestamps, document presence)
- `createdAt`, `updatedAt`

History records are append-only through the API: there is no route to create,
edit, or delete them directly. A `SUBMITTED` entry is written with each new
application, and every decision or reopening appends one immutable record. If
history creation fails, the status change is rolled back.

### `Notification`

- `recipient` — required `User` reference
- `recipientRole` — `PARENT` or `TUTOR` for Phase 6 notifications
- `department` — required `Department` reference for scoping
- `application` — required `LeaveApplication` reference
- `title`, `message` — human-readable decision content
- `type` — `LEAVE_APPROVED`, `LEAVE_REJECTED`, or `LEAVE_REOPENED`
- `isRead` — defaults to `false`
- `createdAt`, `updatedAt`

Notifications are created through `notification.service.js`, which also
publishes them over Socket.IO after the database write commits. Approval creates
one parent notification and, only when the application's class has an active
assigned tutor in the same department, one tutor notification. Rejection and
reopening create only a parent notification. Inbox reads always filter by the
authenticated recipient, and Phase 7 exposes list, unread-count, mark-one, and
mark-all endpoints.

## Authentication flow

1. `POST /api/v1/auth/login` validates the body with Zod, looks up the normalized
   email, and verifies the password with bcrypt. Unknown emails still perform a
   dummy bcrypt comparison so response timing does not reveal whether an account
   exists.
2. On success the API returns a signed **access token** (15 minutes) in the JSON
   body and sets a signed **refresh token** (7 days) in an HttpOnly cookie named
   `clms_refresh_token`, scoped to `/api/v1/auth`.
3. Only a SHA-256 hash of the refresh token is stored in `RefreshSession`.
4. Protected routes send `Authorization: Bearer <accessToken>`. The
   `authenticate` middleware verifies the signature and expiry, then reloads the
   user from MongoDB. Roles, departments, and status always come from the
   database, never from the token or the client.
5. `POST /api/v1/auth/refresh` verifies the cookie, checks the stored session,
   revokes it, and rotates in a new refresh token plus a new access token.
6. `POST /api/v1/auth/logout` revokes the current refresh session and clears the
   cookie. Logout is idempotent.

Cookie behavior:

| Environment | `HttpOnly` | `Secure` | `SameSite` | `Path` |
| --- | --- | --- | --- | --- |
| production | yes | yes | `None` | `/api/v1/auth` |
| development / test | yes | no | `Lax` | `/api/v1/auth` |

Access tokens are short-lived but remain valid until they expire; logging out
invalidates the refresh session, not already-issued access tokens.

## API endpoints

### `POST /api/v1/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

Success (`200`):

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "<jwt>",
  "user": {
    "id": "...",
    "fullName": "Initial Administrator",
    "email": "admin@example.com",
    "role": "ADMIN",
    "department": null,
    "accountStatus": "ACTIVE",
    "lastLogin": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

The refresh token appears only in the `Set-Cookie` header, never in the body.

Failures:

- `400` — validation failed (missing fields, unknown fields such as `role`)
- `401` — `Invalid email or password` for both a wrong password and an unknown email
- `403` — `Account is inactive`
- `429` — too many failed login attempts

There is intentionally **no registration endpoint**. Public users cannot choose
`ADMIN` or `HOD`.

### `POST /api/v1/auth/refresh`

Requires the refresh cookie. Returns a new access token and rotates the refresh
cookie. Reusing an already-rotated token returns `401`. Invalid or expired
cookies clear the cookie.

### `POST /api/v1/auth/logout`

Revokes the current refresh session and clears the cookie. Returns `200` even if
no cookie is present.

### `GET /api/v1/auth/me`

Requires `Authorization: Bearer <accessToken>`. Returns the current database user
without a password hash. Returns `401` for missing/invalid/expired tokens and
`403` if the account is inactive.

### Department APIs

All department routes require a Bearer access token. ADMIN has full access; an
HOD may read only their own department; TUTOR and PARENT receive `403`.

#### `POST /api/v1/departments` (ADMIN)

```json
{
  "name": "Computer Science and Engineering",
  "code": "cse",
  "description": "Computing department"
}
```

`201 Created`:

```json
{
  "success": true,
  "message": "Department created successfully",
  "department": {
    "id": "...",
    "name": "Computer Science and Engineering",
    "code": "CSE",
    "description": "Computing department",
    "status": "ACTIVE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Names are whitespace-normalized and codes are uppercased. Duplicate names or
codes return `409`.

#### `GET /api/v1/departments` (ADMIN)

Supports `search` (matches name or code), `status` (`ACTIVE`/`INACTIVE`), `page`
(default `1`), and `limit` (default `20`, maximum `100`).

```json
{
  "success": true,
  "departments": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### `GET /api/v1/departments/:id` (ADMIN, or HOD for their own department)

Returns `{ "success": true, "department": { ... } }`. An HOD requesting another
department receives `403`.

#### `PATCH /api/v1/departments/:id` (ADMIN)

Accepts any of `name`, `code`, and `description`. Status is changed only through
the dedicated status endpoint. Empty updates and protected fields are rejected
with `400`.

#### `PATCH /api/v1/departments/:id/status` (ADMIN)

```json
{ "status": "INACTIVE" }
```

Returns the updated department. There is no delete endpoint; deactivation keeps
linked users and history intact.

#### `GET /api/v1/departments/:id/hod` (ADMIN, or HOD for their own department)

Returns the department's current ACTIVE HOD, or `null` when none is assigned.

```json
{
  "success": true,
  "hod": {
    "id": "...",
    "fullName": "Dr. Ada Lovelace",
    "email": "ada@example.com",
    "role": "HOD",
    "employeeId": "EMP-001",
    "department": { "id": "...", "name": "...", "code": "CSE", "status": "ACTIVE" },
    "accountStatus": "ACTIVE"
  }
}
```

### HOD management APIs

Every `/api/v1/hods` route is ADMIN-only. HODs, tutors, and parents receive
`403`; unauthenticated requests receive `401`.

#### `POST /api/v1/hods` (ADMIN)

```json
{
  "fullName": "Dr. Ada Lovelace",
  "email": "ada@example.com",
  "password": "a-strong-initial-password",
  "phone": "+1 555 0100",
  "employeeId": "EMP-001",
  "department": "<department id>"
}
```

`201 Created` returns the HOD with the department populated. The password is
hashed with bcrypt and never returned.

- `404` if the department does not exist.
- `400` if the department is inactive.
- `409` for a duplicate email or employee ID.
- If the department already has an ACTIVE HOD, the previous HOD is safely
  deactivated and kept for historical attribution, and the new HOD becomes the
  active one. The partial unique index prevents concurrent duplicates.

#### `GET /api/v1/hods` (ADMIN)

Supports `search` (full name, email, employee ID), `status`, `department`,
`page`, and `limit`. Returns `{ success, hods, pagination }`.

#### `GET /api/v1/hods/:id` (ADMIN)

Returns a single HOD with the department populated. Passwords and hashes are
never included.

#### `PATCH /api/v1/hods/:id` (ADMIN)

Accepts any of `fullName`, `email`, `phone`, `employeeId`, and `department`.
`role`, `accountStatus`, and `password` are rejected with `400`. Moving an HOD
to a department that already has an active HOD deactivates the previous target
HOD and preserves the old account.

#### `PATCH /api/v1/hods/:id/status` (ADMIN)

```json
{ "status": "INACTIVE" }
```

Deactivating an HOD immediately blocks login and protected API access. Activating
an HOD requires an ACTIVE department and no other active HOD in that department;
otherwise the API returns `409` or `400`.

### Class APIs

All `/api/v1/classes` routes require authentication. Mutations are ADMIN-only.

#### `POST /api/v1/classes` (ADMIN)

```json
{
  "className": "CSE-A",
  "year": "3",
  "section": "A",
  "department": "<department id>",
  "assignedTutor": "<tutor user id>"
}
```

`201 Created` returns the class with `department` and `assignedTutor` populated.

- `404` if the department or assigned tutor does not exist.
- `400` if the department or tutor is inactive, or the tutor belongs to another
  department.
- `409` if the class name already exists in that department.
- `assignedTutor` is optional and may be `null`.
- `status` and internal keys are rejected by the strict schema.

#### `GET /api/v1/classes`

ADMIN sees all classes; HOD sees only their own department; TUTOR sees only
classes where they are `assignedTutor`. PARENT receives `403`. Supports `search`
(class name, year, section), `status`, `department` (ADMIN only; HOD may only
repeat their own department), `page`, and `limit`. Returns
`{ success, classes, pagination }`.

#### `GET /api/v1/classes/:id`

ADMIN may read any class; HOD only classes in their department; TUTOR only an
assigned class. All other requests return `403`.

#### `PATCH /api/v1/classes/:id` (ADMIN)

Accepts any of `className`, `year`, `section`, `department`, and
`assignedTutor`. Moving a class to another department requires a tutor in the
target department or `assignedTutor: null`. Reassignment removes the class from
the previous tutor's `assignedClasses` and adds it to the new tutor's list.

#### `PATCH /api/v1/classes/:id/status` (ADMIN)

```json
{ "status": "INACTIVE" }
```

Deactivates or reactivates a class. There is intentionally no `DELETE` route.

### Tutor APIs

All `/api/v1/tutors` routes require authentication. Tutors reuse the `User` model
with role `TUTOR`. Passwords are hashed with the existing bcrypt hook and are
never returned.

#### `POST /api/v1/tutors` (ADMIN)

```json
{
  "fullName": "Dr. Aarthi Raman",
  "email": "tutor.cse.1@example.test",
  "password": "a-strong-initial-password",
  "phone": "+1 555 0100",
  "employeeId": "TUT-CSE-01",
  "department": "<department id>",
  "assignedClasses": ["<class id>"]
}
```

`201 Created` returns the tutor with department and assigned classes populated.

- `404` if the department or a class does not exist.
- `400` if the department or a class is inactive, if class ids contain
  duplicates, or if any class belongs to another department.
- `409` if the email or employee ID already exists, or a class already has
  another assigned tutor.
- `role`, `accountStatus`, and `password` cannot be mass-assigned on updates.

#### `GET /api/v1/tutors`

ADMIN sees all tutors (optionally filtered by `department`); HOD sees only their
own department. TUTOR and PARENT receive `403`. Supports `search` (name, email,
employee ID), `status`, `department`, `page`, and `limit`.

#### `GET /api/v1/tutors/:id`

ADMIN may read any tutor; HOD only tutors in their department.

#### `PATCH /api/v1/tutors/:id` (ADMIN)

Accepts `fullName`, `email`, `phone`, `employeeId`, `department`, and
`assignedClasses`. Replacing `assignedClasses` clears the tutor from removed
classes and assigns the tutor to the provided classes. Moving a tutor to another
department requires reassigning or clearing their existing classes first.

#### `PATCH /api/v1/tutors/:id/status` (ADMIN)

Deactivating a tutor immediately blocks login and protected API access while
preserving historical records.

#### `GET /api/v1/tutors/me/classes` (TUTOR)

Returns only the active classes where the authenticated tutor is `assignedTutor`.

#### `GET /api/v1/tutors/me/students` (TUTOR)

Returns only active students in the tutor's assigned active classes.

#### `GET /api/v1/tutors/me/approved-leaves` (TUTOR)

Returns only `APPROVED` leave applications for students in the authenticated
tutor's assigned active classes. Pending and rejected applications are never
returned. Supports `page` and `limit`. The response uses the standard
`{ success, message, data: { applications, pagination } }` shape.

### Student APIs

All `/api/v1/students` routes require authentication. Mutations are ADMIN-only.

#### `POST /api/v1/students` (ADMIN)

```json
{
  "fullName": "Ananya Sharma",
  "registerNumber": "CSE24001",
  "email": "student.cse.1@example.test",
  "phone": "+1 555 0200",
  "department": "<department id>",
  "class": "<class id>"
}
```

`201 Created` returns the student with department and class populated. Names and
register numbers are whitespace-normalized and register numbers are uppercased.

- `404` if the department or class does not exist.
- `400` if the department or class is inactive, or the department does not match
  the class department.
- `409` for a duplicate register number or student email.

#### `GET /api/v1/students`

ADMIN sees all students; HOD sees their department; TUTOR sees students in their
assigned classes; PARENT sees only linked children. Supports `search` (name,
register number, email), `status`, `department`, `class`, `page`, and `limit`.

#### `GET /api/v1/students/:id`

ADMIN may read any student; HOD only their department; TUTOR only assigned-class
students; PARENT only linked children. Otherwise `403`.

#### `PATCH /api/v1/students/:id` and `PATCH /api/v1/students/:id/status` (ADMIN)

Updates maintain the department/class consistency rule. Status changes toggle
`accountStatus`; students are never deleted.

### Parent APIs

All `/api/v1/parents` routes require authentication. Parent account management is
ADMIN-only.

#### `POST /api/v1/parents` (ADMIN)

```json
{
  "fullName": "Rajesh Sharma",
  "email": "parent.cse.1@example.test",
  "password": "a-strong-initial-password",
  "phone": "+1 555 0300"
}
```

`201 Created` returns the parent account with the password hash stripped. `409`
is returned for a duplicate email. `role` cannot be assigned by the client.

#### `GET /api/v1/parents` and `GET /api/v1/parents/:id` (ADMIN)

List supports `search` (name, email), `status`, `page`, and `limit`. Detail reads
return a single parent account. HOD, TUTOR, and PARENT receive `403`.

#### `PATCH /api/v1/parents/:id` and `PATCH /api/v1/parents/:id/status` (ADMIN)

Updates accept `fullName`, `email`, and `phone`; status toggles
`ACTIVE`/`INACTIVE`. Deactivated parents cannot log in or use protected APIs.

#### Parent-child relationship APIs

| Method | Path | Allowed | Behaviour |
| --- | --- | --- | --- |
| `POST` | `/api/v1/parents/:parentId/children` | ADMIN | Links a student |
| `GET` | `/api/v1/parents/:parentId/children` | ADMIN, matching PARENT | Lists linked children |
| `DELETE` | `/api/v1/parents/:parentId/children/:studentId` | ADMIN | Removes a link |
| `GET` | `/api/v1/parents/me/children` | PARENT | Lists the caller's linked children |

`POST` body:

```json
{ "studentId": "<student id>", "relationship": "Father" }
```

`201 Created` returns the link with the student, department, and class populated.

- `404` if the parent or student does not exist, or the link to delete is absent.
- `409` if the parent-student pair is already linked.
- `400` for an invalid relationship value.
- A parent may only read their own `:parentId` child list; a mismatched parent id
  returns `403`. The parent id is compared with the authenticated database user,
  never with a client-supplied claim.

### Leave application APIs

All `/api/v1/leave-applications` routes require authentication. They return the
consistent `{ success, message, data }` shape.

#### `POST /api/v1/leave-applications` (PARENT)

Accepts either a JSON body or a `multipart/form-data` body with an optional
`supportingDocument` file.

```json
{
  "studentId": "<linked student id>",
  "leaveType": "SICK_LEAVE",
  "fromDate": "2026-11-10",
  "toDate": "2026-11-12",
  "reason": "Medical appointment and recovery"
}
```

`201 Created` returns the populated application with `applicationNumber`,
server-calculated `totalDays`, status `PENDING`, and a `SUBMITTED` history entry.
The response never includes the stored document filename.

- `400` for a past `fromDate`, `toDate` before `fromDate`, an invalid leave type,
  a too-short/missing reason, an inactive student/department/class, or unknown
  client fields such as `status`, `department`, `class`, `totalDays`, or
  `applicationNumber`.
- `403` if the student is not linked to the authenticated parent.
- `404` if the student, department, or class no longer exists.
- `409` if an application number collision cannot be resolved after retries.

#### `GET /api/v1/leave-applications/my` (PARENT)

Lists only the caller's applications. Supports `studentId`, `status`, `fromDate`,
`toDate`, `search`, `page`, and `limit`. Date filters match overlapping leave
periods.

#### `GET /api/v1/leave-applications` (ADMIN, HOD, PARENT)

Lists applications visible to the caller: ADMIN sees all, HOD sees only their
own department, and PARENT sees only their own. HODs can filter by `classId`,
`studentId`, `status`, `fromDate`, and `toDate`. Passing another department's
`department` id as an HOD returns `403`.

#### `GET /api/v1/leave-applications/:id` (ADMIN, HOD, PARENT)

Returns full details if the application is visible to the caller; otherwise
`403`. A missing application returns `404`.

#### `GET /api/v1/leave-applications/:id/history` (ADMIN, HOD, PARENT)

Returns the application summary and its append-only history, oldest first. The
same authorization rules apply.

#### `GET /api/v1/leave-applications/:id/document` (ADMIN, HOD, PARENT)

Streams the private supporting document as an attachment for an authorized
caller. Returns `404` when the application has no document. Responses set
`Cache-Control: private, no-store`.

#### `POST /api/v1/leave-applications/:id/approve` (HOD)

Approves a `PENDING` application in the HOD's own department.

```json
{ "comment": "Optional approval comment" }
```

`200 OK` returns the application with status `APPROVED`, the authenticated HOD
as `decidedBy`, `decidedAt`, and the comment. It appends an immutable `APPROVED`
history record and creates:

- one `LEAVE_APPROVED` notification for the parent
- one `LEAVE_APPROVED` notification for the tutor assigned to the application's
  class, if that class has an active assigned tutor in the same department

- `400` for invalid or client-supplied fields such as `status`, `decidedBy`,
  `decidedAt`, or `department`.
- `403` for another department or a non-HOD role.
- `404` if the application does not exist.
- `409` if the application is no longer `PENDING`.

#### `POST /api/v1/leave-applications/:id/reject` (HOD)

Rejects a `PENDING` application in the HOD's own department. A non-blank reason
is mandatory.

```json
{ "reason": "Supporting document does not match the requested dates" }
```

`200 OK` returns the application with status `REJECTED`, `decidedBy`,
`decidedAt`, and `rejectionReason`. It appends an immutable `REJECTED` history
record and creates one `LEAVE_REJECTED` notification for the parent only.

- `400` for a missing or whitespace-only reason, or client-supplied protected
  fields.
- `403` for another department or a non-HOD role.
- `404` if the application does not exist.
- `409` if the application is no longer `PENDING`.

#### `POST /api/v1/leave-applications/:id/reopen` (HOD)

Reopens an `APPROVED` or `REJECTED` application in the HOD's own department. A
non-blank correction reason is mandatory.

```json
{ "reason": "Parent submitted the missing medical certificate" }
```

`200 OK` returns the application with status `PENDING`. Previous decision fields
and all earlier history remain intact; the new `REOPENED` record stores the
actor, reason, timestamp, and previous/new statuses. A `LEAVE_REOPENED`
notification is created for the parent only. The tutor is not notified until a
new approval occurs.

- `400` for a missing or whitespace-only reason, or client-supplied protected
  fields.
- `403` for another department or a non-HOD role.
- `404` if the application does not exist.
- `409` if the application is `PENDING` or in any other non-decided state.

Decision transitions are atomic. Concurrent requests cannot both win: one
succeeds and the others receive `409`, so no duplicate decision or history record
is created. On a standalone MongoDB deployment the service uses an atomic
conditional update followed by rollback if history or notification creation
fails; no multi-document transaction is required.

### Notification APIs

All `/api/v1/notifications` routes require authentication. ADMIN, HOD, TUTOR, and
PARENT accounts can access only their own notifications; the recipient is always
taken from the authenticated database user. Responses use the standard
`{ success, message, data }` shape.

#### `GET /api/v1/notifications/my`

Returns the authenticated user's notifications newest first. Supports optional
query filters:

- `page` — default `1`
- `limit` — default `20`, maximum `100`
- `isRead` — `true` or `false`
- `type` — `LEAVE_APPROVED`, `LEAVE_REJECTED`, or `LEAVE_REOPENED`

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 },
    "unreadCount": 0
  }
}
```

- `400` for invalid pagination, an invalid `isRead`/`type` value, or unknown
  query fields.
- `401` without a valid access token.

#### `GET /api/v1/notifications/unread-count`

Returns `data: { unreadCount }` for the authenticated user.

#### `PATCH /api/v1/notifications/:id/read`

Marks one notification as read only when it belongs to the authenticated user.
Returns the updated notification and the new `unreadCount`.

- `400` for a malformed id.
- `404` if the notification does not exist or belongs to another user.
- The request body must be empty; unknown body fields return `400`.

#### `PATCH /api/v1/notifications/read-all`

Marks all unread notifications owned by the authenticated user as read and
returns `data: { modifiedCount, unreadCount: 0 }`. Other users' notifications are
never changed. The request body must be empty.

### Socket.IO real-time notifications

Socket.IO shares the existing Express HTTP server and the same `CLIENT_URL` CORS
origins. It is initialized in `src/realtime/socketServer.js` and mounted by both
`src/server.js` and the test server helper.

#### Authentication

Send the existing access token in the Socket.IO handshake `auth` payload:

```js
import { io } from 'socket.io-client'

const socket = io('http://localhost:5000', {
  auth: { token: accessToken },
})
```

- Tokens are never accepted from URL query parameters.
- The server verifies the JWT signature, issuer, audience, and `HS256` algorithm
  using the same `verifyAccessToken` function as the REST API.
- The user is reloaded from MongoDB and must be `ACTIVE`.
- Missing, invalid, expired, or inactive-account handshakes fail with
  `connect_error`.
- Each authenticated connection joins only its own `user:<userId>` room. There is
  no client-controlled join event, no public room, and no department-wide
  broadcast.

#### Events

| Event | Sent to | Payload |
| --- | --- | --- |
| `notification:new` | the notification's recipient | `{ notification, unreadCount }` |
| `notification:read` | the authenticated owner | `{ notificationId, isRead, unreadCount }` or `{ notificationId: null, all: true, isRead, unreadCount }` |
| `notification:unread-count` | the authenticated owner | `{ unreadCount }` |

The current unread count is also emitted once after a socket connects.

`notification:new` is emitted only after the notification is persisted and the
owning leave operation has committed. If a decision is rolled back, staged
notifications are deleted and no socket event is emitted. Real-time delivery is
best effort: the REST inbox works even when Socket.IO is disconnected.

### Supporting document storage

Supporting documents are optional. When present, the API:

- Accepts only PDF, JPG/JPEG, and PNG content, verified by magic bytes rather
  than the client-supplied extension or MIME type
- Limits the file to 5 MB, with a single-file multipart field named
  `supportingDocument`
- Rejects empty and spoofed files
- Generates a server-side filename of the form
  `<timestamp>-<uuid>.<pdf|jpg|png>`; the original filename is sanitized for
  display only and is never used as a path
- Writes to the private `backend/storage/leave-documents` directory (mode `0700`,
  files `0600`), which is gitignored and outside the static/public tree
- Deletes the stored file if application or history creation fails

There is **no cloud storage configured**. Production deployments should mount a
private volume or replace `documentStorage.service.js` with an object-store
adapter. `LEAVE_DOCUMENT_DIR` can point local development and tests at another
private directory.

### `GET /api/v1/health`

Returns the running state and the **actual** Mongoose connection state.

```json
{
  "success": true,
  "message": "Backend is running",
  "database": "connected"
}
```

The `database` value can be `connected`, `connecting`, `disconnected`,
`disconnecting`, or `unknown`.

### `GET /`

Returns a small service description and the health endpoint path.

### Error responses

All errors use a consistent JSON shape:

```json
{
  "success": false,
  "message": "Route not found: GET /api/v1/example"
}
```

Validation errors also include a `details` array with `field` and `message`.
Unhandled server errors return `500` with a generic message in production and
never include a stack trace in the response body.

## Admin seed script

Create the first administrator from environment variables:

```bash
npm run seed:admin
```

Requirements:

- `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` must be set.
- `ADMIN_NAME` is optional and defaults to `Initial Administrator`.
- The password must be 8–128 characters and must not be the example placeholder.
- The password is hashed with bcrypt before saving.
- Running it again for an existing email makes no changes (no duplicates).
- It only creates an `ADMIN`. It never creates HOD, tutor, or parent accounts.
- It is not called during normal server startup.

The script refuses to run with invalid configuration and exits with code `1`.

### Department seed script

Create the five initial departments:

```bash
npm run seed:departments
```

| Code | Name |
| --- | --- |
| `CSE` | Computer Science and Engineering |
| `IT` | Information Technology |
| `ECE` | Electronics and Communication Engineering |
| `MECH` | Mechanical Engineering |
| `MCA` | Master of Computer Applications |

- Uses `MONGODB_URI` from `.env` or the environment.
- Creates a department only when its code and normalized name do not already
  exist.
- Never overwrites existing department changes.
- Never creates HOD, tutor, or parent accounts.
- Safe to run repeatedly; the output reports created and skipped counts.

### Phase 4 demo data seed script

Create the demo classes, tutors, students, parents, and parent-child links:

```bash
npm run seed:phase4
```

- Uses `MONGODB_URI` from `.env` or the environment.
- Reuses the five initial departments, creating them only if missing.
- Creates 10 classes (2 per department), 10 tutors (2 per department), 20
  students (4 per department), 20 parent accounts, and 20 parent-student links
  on the first run.
- Uses fictional names and reserved `example.test` email addresses.
- Never overwrites existing records, including manual edits.
- Skips any record that already exists and reports created/skipped counts.
- Assigns the first tutor to each department's first class and the second tutor
  to its second class only when the class has no tutor.
- Hashes tutor and parent passwords with the existing bcrypt hook.
- Is not imported by the server startup path and never runs automatically.
- Development-only login credentials are documented separately in
  `docs/DEV_SEED_CREDENTIALS.md`. Never use those accounts in production.

## Security measures

- Passwords hashed with bcrypt (cost 12), `select: false`, and stripped by
  `toJSON()`
- Refresh tokens stored only as SHA-256 hashes in MongoDB
- HttpOnly refresh cookie; `Secure` + `SameSite=None` in production
- Access tokens expire after 15 minutes; refresh tokens after 7 days
- Signed JWTs with issuer/audience validation and explicit `HS256`
- Refresh-token rotation and revocation of the previous session
- Refresh sessions removed automatically by a TTL index
- Database-backed role and status checks on every protected request
- Zod `.strict()` login schema prevents mass assignment of `role` and other
  protected fields
- Identical generic error for unknown email and wrong password
- Dummy bcrypt comparison for unknown emails to reduce timing differences
- Login rate limit: 10 failed attempts per 15 minutes; general API limit: 100
  requests per 15 minutes
- Auth responses send `Cache-Control: no-store`
- `x-powered-by` disabled and Helmet security headers enabled
- CORS restricted to `CLIENT_URL`
- No public registration endpoint
- Secrets, tokens, and passwords are never logged
- All department and HOD mutation routes are ADMIN-only; HOD detail reads are
  scoped to the department stored on the authenticated account
- Strict Zod schemas validate bodies, query strings, and object ids; unknown
  fields such as `role`, `status`, and `password` are rejected on HOD updates
- One ACTIVE HOD per department is enforced by a partial unique MongoDB index,
  with transaction-backed replacement when the deployment supports it and
  compensating rollback on standalone servers
- Replacement deactivates the previous HOD instead of deleting it, preserving
  historical attribution
- No department delete route; deactivation is the supported lifecycle operation
- Search terms are regex-escaped before use
- HOD passwords reuse the existing bcrypt hashing hook and all responses strip
  password fields
- Class, tutor, student, and parent mutations are ADMIN-only; HOD reads are
  department-scoped and TUTOR/PARENT reads are scoped to their own relationships
- Tutor visibility is derived from `Class.assignedTutor`, not from a
  client-supplied class id; parent visibility is derived from `ParentStudent`
- A parent can read only their own `:parentId` child list; the id is compared
  with the authenticated database user
- Tutors must belong to the same active department as their classes; cross-
  department class assignment is rejected
- Students must match their class department, and both the class and department
  must be active
- Unique compound indexes prevent duplicate class names per department and
  duplicate parent-student links
- Tutor and parent passwords reuse the existing bcrypt hook and are never
  returned
- No class delete route; deactivation preserves linked students and history
- Leave applications derive department and class from the stored `Student`, never
  from client input; parent access is derived from `ParentStudent`
- HOD leave access is scoped to the department stored on the authenticated
  account; a mismatched department filter is rejected with `403`
- Leave creation schemas are strict and reject `status`, `parent`, `department`,
  `class`, `totalDays`, `applicationNumber`, and `submittedAt`
- Leave decision endpoints are HOD-only and department-scoped; ADMIN, TUTOR, and
  PARENT receive `403`
- Decision schemas are strict and accept only an optional comment or a mandatory
  reason; actor, status, decision timestamp, and department cannot be supplied
- Approve, reject, and reopen use an atomic conditional status update, so
  concurrent requests cannot create duplicate decisions or history records
- History and notification failures roll the status transition back on
  standalone MongoDB deployments that do not support multi-document transactions
- Only `PENDING` applications can be approved or rejected; only `APPROVED` or
  `REJECTED` applications can be reopened; invalid or repeated transitions return
  `409`
- Application numbers are unique-indexed and retried on collision
- `totalDays` is calculated on the server from UTC-normalized dates
- Leave history is append-only through the API and records actor snapshots,
  previous/new statuses, and decision reasons
- Notifications target the parent and, only after approval, the single tutor
  assigned to the application's class; rejection and reopening never notify a
  tutor
- Notification inbox routes always filter by the authenticated database user;
  client-supplied recipient ids are rejected by strict query/body schemas
- Marking another user's notification as read returns `404`, and mark-all updates
  only the authenticated user's records
- Socket.IO handshakes use the same JWT verification (signature, issuer,
  audience, `HS256`) and reload the account from MongoDB, rejecting inactive
  users
- Socket connections join only their own `user:<userId>` room; there is no
  client-controlled room event, public room, or cross-user emit
- `notification:new` is published only after persistence and the owning operation
  commit; rolled-back decisions delete staged notifications and emit nothing
- Real-time delivery failures never roll back a committed database operation, and
  the REST inbox remains available when sockets are disconnected
- JWT values, passwords, and notification content are not logged
- Supporting documents are validated by magic bytes, capped at 5 MB, stored
  under server-generated names in a private, gitignored directory, and downloaded
  only through an authenticated, authorized route
- Stored document filenames are excluded from normal JSON responses
- Document responses set `Cache-Control: private, no-store`

## Tests

```bash
npm test
```

Run only the Phase 7 suites:

```bash
npm test -- tests/notifications.test.js
npm test -- tests/realtimeNotifications.test.js
```

There is no lint script or ESLint configuration in this backend; the test suite is
the automated verification step.

The suite uses the Node.js built-in test runner. Phase 1 tests start the app on
an ephemeral loopback port without a database. Phase 2–7 tests need an isolated
MongoDB database: by default they use
`mongodb://127.0.0.1:27017/clms_test_<pid>_<timestamp>`, or `MONGODB_URI_TEST` if
set. The test database is dropped after the run. Document tests use a temporary
directory through `LEAVE_DOCUMENT_DIR` and remove it afterwards. Socket.IO tests
start a real Socket.IO server on the same ephemeral port and use
`socket.io-client`. Tests never use production or Atlas data.

Coverage includes:

- Health endpoint response shape and live database status
- Security headers and CORS
- JSON 404 and malformed JSON handling
- Operational and unexpected error handling
- Missing `MONGODB_URI` behavior
- Valid login; invalid password; unknown email; inactive account; missing
  credentials and rejected protected fields
- Missing, malformed, expired, and wrong-type access tokens
- Protected route access and database-backed role trust
- Role authorization middleware
- `/api/v1/auth/me`
- Refresh rotation, reuse rejection, logout invalidation, and idempotent logout
- Password hashing and password-field hiding
- Email normalization and duplicate-email prevention
- Department normalization and uniqueness
- Role/department scope rules
- Admin seed behavior (verified manually against a disposable database)
- Department creation, updates, activation/deactivation, search, pagination,
  duplicate names/codes, invalid ids, and protected fields
- Department authorization for HOD, TUTOR, and PARENT accounts
- Department delete prevention
- Department seed idempotency and preservation of manual edits
- HOD creation, hashing, duplicate email/employee ID, and inactive-department
  assignment prevention
- One-active-HOD-per-department enforcement, replacement, and old-account
  preservation
- HOD reassignment between departments, activation conflicts, and deactivation
  login/token blocking
- HOD listing, search, pagination, updates, validation, and response
  sanitization
- HOD department isolation and ADMIN-only HOD management
- Class creation, normalization, unique names per department, active-department
  enforcement, tutor assignment/reassignment, status changes, and delete
  prevention
- Class visibility for ADMIN, HOD, and TUTOR plus PARENT denial
- Tutor creation, password hashing, duplicate email/employee ID, active
  department and active same-department class assignment, and occupied-class
  rejection
- Tutor updates, class reassignment, deactivation login/token blocking, and
  rejection of protected fields
- Tutor self-service class/student isolation and HOD tutor department isolation
- Student creation normalization, unique register number/email, active
  department/class enforcement, department/class mismatch rejection, updates,
  search, pagination, and status changes
- Student visibility for HOD, TUTOR, PARENT, and ADMIN
- Parent account creation, hashing, duplicate email, listing, search, pagination,
  updates, status changes, and sanitization
- Parent-child link creation, duplicate prevention, multiple links, invalid
  relationship, removal, and missing records
- Parent child isolation, own-child reads, and denial of parent administration
  for HOD and TUTOR
- Phase 4 demo seed completeness, idempotency, and preservation of manual edits
- Leave application submission, server-derived department/class, default
  `PENDING` status, unique application numbers, and inclusive `totalDays`
- Rejection of past dates, reversed date ranges, missing reasons, invalid leave
  types, and client-supplied `department`, `class`, `status`, `totalDays`,
  `applicationNumber`, `parent`, and `submittedAt`
- Leave history creation and read access; confirmation that no status or edit
  route exists
- Parent submission for multiple linked children, self-scoped list filtering,
  unlinked-student denial, and denial of access to another parent's application,
  history, and document
- HOD own-department listing/filtering/detail/history, cross-department denial,
  and rejection of a foreign department filter
- Leave role restrictions for TUTOR, HOD submission, and unauthenticated requests
- Optional PDF/PNG upload, private storage naming, authorized download, denial
  for other parents/HODs, spoofed-file rejection, the 5 MB limit, and the
  no-document `404`
- HOD approval with an optional comment, decision fields, and `APPROVED` history
- HOD rejection with a mandatory non-blank reason, decision fields, and
  `REJECTED` history
- Cross-department decision denial and denial for PARENT, TUTOR, and ADMIN
- Reopening approved and rejected applications, preserving prior decision
  details and append-only history
- Rejection and reopening without a reason, repeated decisions, and invalid
  transitions returning `400`/`409`
- Rejection of client-supplied actor, status, decision timestamp, and department
  fields
- Parent notifications for approval, rejection, and reopening
- Approval notifications only to the assigned class tutor; rejection and
  reopening create no tutor notification
- Tutor approved-leaves visibility limited to approved applications in assigned
  classes, with pending/rejected/other-class leaves excluded
- Concurrent approvals, concurrent approve/reject, and concurrent reopens
  producing exactly one decision and one history record
- Parent access to the latest decision comment/reason and complete history
- Notification inbox retrieval for ADMIN, HOD, TUTOR, and PARENT accounts, with
  cross-user isolation
- Notification pagination, `isRead`/`type` filters, and newest-first ordering
- Unread counts and mark-one/mark-all read operations limited to the owner
- Invalid notification queries, bodies, ids, and unauthenticated requests
- Socket.IO rejection of missing, invalid, expired, and inactive-account tokens
- Authenticated socket delivery of `notification:new`, `notification:read`, and
  unread-count events to the correct user room
- No cross-user Socket.IO notification leakage
- Approval socket notifications to the parent and exactly the assigned tutor;
  rejection and reopening notify the parent but never the tutor
- Rolled-back decisions emitting no socket notification and leaving no persisted
  notification or decision history

## Current limitations and next phase

- The frontend is not connected to authentication or this API yet.
- Socket.IO runs in-process. A multi-instance deployment would need a shared
  adapter (for example Redis) so events reach users connected to another instance.
- There is no notification delete/archive endpoint; notifications are marked
  read but retained for audit-friendly history.
- Supporting documents use private local disk storage only. No cloud storage is
  configured, and a production deployment must provide a private persistent
  volume or an object-store adapter.
- Leave applications cannot be edited or withdrawn after submission; only the
  HOD approve, reject, and reopen routes change status.
- Reopening preserves prior decision fields on the application and all earlier
  history records, but the application shows only the latest decision fields.
- Students do not have login accounts; only ADMIN, HOD, TUTOR, and PARENT
  accounts can authenticate.
- Deactivating a department does not automatically deactivate its HOD, tutors,
  or classes; account and class status are managed separately.
- Access tokens stay valid until expiry after logout; only refresh sessions are
  revoked.
- The frontend uses `CLASS_TUTOR`, while this backend deliberately uses `TUTOR`.
  Integration will map these when the frontend is wired up.

Phase 1 functionality (health API, middleware, error handling, graceful database
startup) remains intact, and all Phase 1–6 tests continue to pass.
