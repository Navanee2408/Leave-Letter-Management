# College Leave Management System — Frontend

## Project overview

A frontend-only College Leave Management System prototype for a four-role college workflow: **Administrator**, **Head of Department (HOD)**, **Class Tutor**, and **Parent / Guardian**.

The project is a local demonstration. It uses seeded sample data and browser storage instead of a backend, and it makes no network requests to a college system. All account relationships, permissions, notifications, and leave decisions are simulated in the browser.

> This is an independent academic prototype. The visual design is inspired by the Thiagarajar College of Engineering (TCE) design language, but the project is not affiliated with or endorsed by the college. Do not use it for real administrative decisions.

## Frontend technologies

- React 18 and React Router 6
- Vite 5
- Tailwind CSS and PostCSS
- React Hook Form and Zod
- Recharts, Lucide React, React Hot Toast, and jsPDF
- ESLint
- Node.js built-in test runner (`node --test`)

## User roles and main features

### Administrator (`/admin/login`)

- College-wide dashboard with department, HOD, class, student, tutor, parent, and leave statistics.
- Manage departments, HODs, classes, class tutors, students, and parent/guardian records.
- Review account status and simulate account activation and password-reset flows.
- View **all** leave requests and department-wise reports in a read-only oversight view.
- Routine leave approvals remain with the department HOD.

### Head of Department (`/login/hod`)

- Department-scoped dashboard showing the department name, HOD name, student totals, and pending/approved/rejected leave counts.
- Review new and reopened leave applications for the HOD's own department only.
- Approve a request, reject it with a mandatory reason, or reopen it for correction with a mandatory reason.
- Reopening preserves the earlier decision in the application history and returns the request to the parent.
- Approval records the HOD identity, decision date, remarks, and audit history.

### Class Tutor (`/login/tutor`)

- View assigned classes and students.
- Receive approved-leave updates only for the tutor's own class, after HOD approval.
- Pending and rejected applications are never shown in the tutor portal.
- Rejections never generate tutor notifications.

### Parent / Guardian (`/login/parent`)

- View only the children linked to the signed-in parent account.
- Multiple children per parent are supported.
- Submit a leave application with leave type, a valid date range, a minimum reason length, and optional PDF/JPG/PNG documents up to 5 MB.
- Track application status, decision history, and HOD remarks.
- Download an approved leave letter PDF that is clearly marked as a demonstration document.

### Cross-role behaviour

- Dashboard sidebars and protected routes are rebuilt per role.
- Parent submissions resolve `student → class → department → department HOD`, so only that department's HOD is notified.
- Approvals resolve `student → class → assigned tutor`, so only that class tutor is notified.
- Notifications are addressed to individual accounts rather than entire roles.
- The demo dataset is validated when it is seeded or reset; broken relationships are reported rather than silently repaired.

## Project structure

```text
Leave-Letter-Management/
├── README.md
├── DEMO_CREDENTIALS.md        # Development-only fictional accounts
├── .gitignore
└── frontend/
    ├── public/
    │   └── brand/             # Logo assets
    ├── src/
    │   ├── components/        # Shared UI, layout, forms, admin CRUD, leave workflow
    │   ├── constants/         # Roles, navigation, leave and notification metadata
    │   ├── context/           # Simulated authentication and data providers
    │   ├── data/              # Seeded accounts and demo records
    │   ├── hooks/             # Reusable React hooks
    │   ├── lib/               # Date, CSV, PDF, and utility helpers
    │   ├── pages/             # admin, hod, tutor, parent, auth, public, shared
    │   ├── services/          # Demo store, selectors, validation, and tests
    │   ├── App.jsx
    │   └── main.jsx
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## Installation

Requirements: Node.js 18 or newer and npm.

```bash
cd frontend
npm install
```

## Run the frontend locally

From the `frontend/` directory:

```bash
npm run dev
```

Vite prints the local URL (default `http://localhost:5173`). Sign in through one of the four role portals, or use `/admin/login` for the administrator portal.

Useful commands:

```bash
npm test        # Node built-in test runner
npm run lint    # ESLint
npm run build   # Production build into frontend/dist
npm run preview # Preview the production build
```

## Demo credentials

All demo accounts, role/department/class links, and fictional credentials are listed in [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md).

- The accounts use clearly fictional `@example.com` email addresses and `+1-202-555-01xx` telephone numbers.
- Passwords are development-only placeholders prefixed with `DemoOnly!` and have no value outside this demo.
- The data is stored in browser `localStorage` and can be reset from any Profile page.

## Current demo limitations

- **No backend is connected.** Authentication, authorization, notifications, file storage, and leave decisions are simulated in the browser.
- Browser storage is not secure or shared between users. Clearing site data removes local changes.
- Uploaded documents are represented as local metadata for validation; no file is sent to a server.
- Approved-letter PDFs are demonstration documents and are not official college certificates.
- A future backend must independently enforce every role and department rule, hash passwords with bcrypt/Argon2, store files securely, and keep credentials out of client code.

## Future enhancements

- Add a secured backend, database, and server-side role/department authorization.
- Replace simulated accounts with institution-managed identity and password recovery.
- Add audit logging, configurable approval policies, and real notification delivery.
- Add deployment automation, accessibility checks, and end-to-end tests.
