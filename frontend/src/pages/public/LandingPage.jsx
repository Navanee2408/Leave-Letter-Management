import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FilePlus2,
  GraduationCap,
  Layers,
  LockKeyhole,
  Mail,
  MapPin,
  MonitorSmartphone,
  MousePointerClick,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react'
import PublicHeader from '../../components/public/PublicHeader'
import PublicFooter from '../../components/public/PublicFooter'
import Avatar from '../../components/ui/Avatar'
import StatusBadge from '../../components/ui/StatusBadge'
import { useData } from '../../hooks/useData'
import { pendingReviewLeaves, adminStats } from '../../services/selectors'
import { formatDateShort } from '../../lib/date'
import { LEAVE_TYPE_SHORT } from '../../constants'

const ROLE_CARDS = [
  {
    key: 'admin',
    number: '01',
    title: 'College Admin Login',
    eyebrow: 'College administration',
    icon: ShieldCheck,
    accent: 'bg-navy-900',
    iconClass: 'bg-navy-50 text-navy-800',
    description:
      'Manage departments, classes, HODs, tutors, students, parents and college-wide leave reports.',
    points: [
      'Maintain department assignments and records',
      'Activate or deactivate demo accounts',
      'Review leave outcomes and reports',
    ],
    to: '/admin/login',
    cta: 'Enter Admin portal',
  },
  {
    key: 'hod',
    number: '02',
    title: 'HOD Login',
    eyebrow: 'Administration',
    icon: Building2,
    accent: 'bg-navy-900',
    iconClass: 'bg-navy-50 text-navy-800',
    description:
      'Review and decide leave applications for your department, with complete decision and correction history.',
    points: [
      'Approve or reject with a recorded reason',
      'Reopen decisions with a correction request',
      'Monitor department requests and history',
    ],
    to: '/login/hod',
    cta: 'Enter HOD portal',
  },
  {
    key: 'tutor',
    number: '03',
    title: 'Class Tutor Login',
    eyebrow: 'Faculty',
    icon: GraduationCap,
    accent: 'bg-maroon-800',
    iconClass: 'bg-maroon-50 text-maroon-800',
    description:
      'Stay informed about approved student leave for the classes you are assigned to as tutor.',
    points: [
      'Class-scoped approved leave visibility',
      'Upcoming leave and student directory',
      'Notifications only after HOD approval',
    ],
    to: '/login/tutor',
    cta: 'Enter tutor portal',
  },
  {
    key: 'parent',
    number: '04',
    title: 'Parent Login',
    eyebrow: 'Guardian',
    icon: UsersRound,
    accent: 'bg-brand-600',
    iconClass: 'bg-brand-50 text-brand-700',
    description:
      'Submit leave requests for your children, attach supporting documents and follow every decision.',
    points: [
      'Apply for one or more linked children',
      'Track pending, approved and rejected status',
      'Download an approved leave letter as PDF',
    ],
    to: '/login/parent',
    cta: 'Enter parent portal',
  },
]

const WORKFLOW = [
  {
    icon: FilePlus2,
    step: '01',
    title: 'Parent submits',
    description:
      'Choose the child, leave type and dates. Add a clear reason and an optional supporting document.',
  },
  {
    icon: BookOpenCheck,
    step: '02',
    title: 'HOD reviews',
    description:
      'The department head reviews the application, adds remarks and approves, rejects or reopens it.',
  },
  {
    icon: BellRing,
    step: '03',
    title: 'Parent is notified',
    description:
      'The parent sees the decision, HOD remarks and can download the approved leave letter.',
  },
  {
    icon: GraduationCap,
    step: '04',
    title: 'Tutor is informed',
    description:
      'Only approved leave is forwarded to the class tutor for attendance and academic coordination.',
  },
]

const FEATURES = [
  {
    icon: Layers,
    title: 'Four focused workspaces',
    description:
      'Purpose-built workspaces for college administrators, department heads, class tutors and parents.',
  },
  {
    icon: FileCheck2,
    title: 'Documented requests',
    description:
      'Parents can attach a PDF or image with file-type and size validation before submission.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent decisions',
    description:
      'Every application keeps a visible timeline of submission, decision and correction events.',
  },
  {
    icon: RotateCcw,
    title: 'Correction-ready workflow',
    description:
      'HODs can reopen a decided application with a mandatory reason while preserving the prior outcome.',
  },
  {
    icon: BellRing,
    title: 'Notification centre',
    description:
      'Unread counts, notification history and mark-as-read controls keep every role up to date.',
  },
  {
    icon: FileCheck2,
    title: 'Approved leave letter',
    description:
      'Generate a professionally formatted PDF containing the approval details and a clear demo notice.',
  },
]

const FAQS = [
  {
    question: 'How do I sign in to the demo?',
    answer:
      'Each portal shows a pre-filled demo account. Sign-in checks the listed email and password against the local demo account list; there is no backend session or JWT.',
  },
  {
    question: 'Is this an official college portal?',
    answer:
      'No. This is an independent academic frontend project inspired by the institutional design language of Thiagarajar College of Engineering. It is not affiliated with or endorsed by the college, and no data is sent to college systems.',
  },
  {
    question: 'What happens after a parent submits a leave?',
    answer:
      'The request appears in the HOD review queue and generates a notification. Once the HOD approves it, the parent can download a leave letter and the class tutor receives an approved-leave update. Rejections are not forwarded to tutors.',
  },
  {
    question: 'Where is the demo data stored?',
    answer:
      'Demo records are stored in your browser using localStorage through a centralised data adapter. You can reset the dataset from the Profile page of any portal. No backend or MongoDB is connected in this phase.',
  },
]

function HeroPreview() {
  const { db } = useData()
  const pending = useMemo(() => pendingReviewLeaves(db).slice(0, 3), [db])
  const stats = useMemo(() => adminStats(db), [db])

  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
      <div
        className="absolute -inset-6 rounded-[2rem] bg-white/[0.035] ring-1 ring-white/10"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-white/20">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-900 text-white">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-navy-900">Department review queue</p>
              <p className="text-[9px] text-slate-400">HOD workspace · demo preview</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
            {stats.pending + stats.reopened} pending
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
          <div className="px-4 py-2.5">
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-slate-400">
              Departments
            </p>
            <p className="mt-0.5 font-display text-base font-bold text-navy-900">
              {stats.departments}
            </p>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-slate-400">
              Students
            </p>
            <p className="mt-0.5 font-display text-base font-bold text-navy-900">
              {stats.students}
            </p>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-slate-400">
              Approved
            </p>
            <p className="mt-0.5 font-display text-base font-bold text-emerald-700">
              {stats.approved}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {pending.map((leave) => (
            <div key={leave.id} className="flex items-center gap-2.5 px-4 py-2.5">
              <Avatar name={leave.studentName} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10.5px] font-semibold text-slate-800">
                  {leave.studentName}
                </p>
                <p className="truncate text-[8.5px] text-slate-400">
                  {leave.department?.code} · {LEAVE_TYPE_SHORT[leave.leaveType]} ·{' '}
                  {formatDateShort(leave.fromDate)}
                </p>
              </div>
              <StatusBadge status={leave.status} className="scale-90 text-[8px]" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-2.5">
          <p className="text-[9px] text-slate-400">
            Sample data from the interactive demo
          </p>
          <Link
            to="/login/hod"
            className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-navy-800 hover:text-navy-600"
          >
            Open workspace
            <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden w-[210px] rounded-lg border border-emerald-200 bg-white p-3 shadow-lift sm:block">
        <div className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-slate-800">Leave approved</p>
            <p className="mt-0.5 text-[8.5px] leading-relaxed text-slate-400">
              Parent notified · forwarded to class tutor
            </p>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -top-4 hidden items-center gap-1.5 rounded-full border border-white/20 bg-navy-900/90 px-3 py-1.5 text-[9px] font-medium text-white shadow-lg backdrop-blur sm:flex">
        <Layers className="h-3 w-3 text-brand-300" aria-hidden="true" />
        4 role-based portals
      </div>
    </div>
  )
}

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
      >
        <span className="text-[13.5px] font-semibold text-slate-800">{faq.question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="pb-4 pr-7 text-[12.5px] leading-relaxed text-slate-500">
          {faq.answer}
        </p>
      )}
    </div>
  )
}

export default function LandingPage() {
  const { db } = useData()
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy-950">
          <div className="absolute inset-0 bg-institution-grid opacity-60" aria-hidden="true" />
          <div
            className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-navy-800/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-52 -left-20 h-[420px] w-[420px] rounded-full bg-maroon-900/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-200">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Academic Year 2026–27
                  </span>
                  <span className="text-[10.5px] text-navy-300">
                    Digital leave administration
                  </span>
                </div>

                <h1 className="max-w-xl font-display text-[38px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[46px] lg:text-[52px]">
                  Student Leave{' '}
                  <span className="relative inline-block">
                    Management
                    <span
                      className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-maroon-600"
                      aria-hidden="true"
                    />
                  </span>{' '}
                  Portal
                </h1>
                <p className="mt-5 max-w-lg text-[14.5px] leading-relaxed text-navy-200 sm:text-[15.5px]">
                  A smart and transparent leave approval system for parents, faculty
                  and college administration.
                </p>

                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                  <Link
                    to="/login/parent"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[13px] font-semibold text-navy-900 shadow-sm transition hover:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                  >
                    Apply as a parent
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a
                    href="#portals"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 text-[13px] font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                  >
                    Explore all portals
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5">
                  {[
                    { icon: Layers, label: 'Four role-based portals' },
                    { icon: Workflow, label: 'Four-step approval trail' },
                    { icon: FileCheck2, label: 'Downloadable leave letter' },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-navy-300"
                    >
                      <item.icon className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
                      {item.label}
                    </span>
                  ))}
                </div>

                <p className="mt-6 max-w-md text-[10px] leading-relaxed text-navy-400">
                  Frontend demonstration only. Login is simulated and the portal is
                  not an official college service.
                </p>
              </div>

              <HeroPreview />
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section id="about" className="scroll-mt-28 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-maroon-800">
                  One connected workflow
                </p>
                <h2 className="mt-2 max-w-xl font-display text-[28px] font-bold leading-tight tracking-tight text-navy-900 sm:text-[32px]">
                  A clear, accountable way to manage student leave.
                </h2>
                <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
                  The portal replaces scattered messages and paper letters with a
                  structured approval process. Parents submit requests, department
                  heads record decisions, and class tutors receive only the approved
                  information they need.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'A single source of truth for every leave application.',
                    'Clear status visibility for parents at every stage.',
                    'Class-scoped visibility for tutors — never pending or rejected requests.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="text-[13px] leading-relaxed text-slate-600">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Demo dataset
                    </p>
                    <p className="mt-1 font-display text-base font-semibold text-navy-900">
                      Built for realistic exploration
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
                    No backend
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { value: db.departments.length, label: 'Departments', icon: Building2 },
                    { value: db.students.length, label: 'Students', icon: GraduationCap },
                    { value: db.tutors.length, label: 'Class tutors', icon: UsersRound },
                    { value: db.parents.length, label: 'Parent accounts', icon: Layers },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-3"
                    >
                      <stat.icon className="h-4 w-4 text-navy-700" aria-hidden="true" />
                      <p className="mt-2 font-display text-xl font-bold leading-none text-navy-900">
                        {String(stat.value).padStart(2, '0')}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                  <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
                  <p className="text-[10.5px] leading-relaxed text-amber-800">
                    Records are stored in your browser for demonstration. Real
                    authentication and MongoDB integration arrive in a later phase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role cards */}
        <section id="portals" className="scroll-mt-24 bg-canvas">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-maroon-800">
                Choose your portal
              </p>
              <h2 className="mt-2 font-display text-[28px] font-bold tracking-tight text-navy-900 sm:text-[32px]">
                One system. Four focused experiences.
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-slate-500">
                Sign in with the demo credentials shown on each page. Every role sees
                only the information relevant to their responsibilities.
              </p>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {ROLE_CARDS.map((card) => {
                const Icon = card.icon
                return (
                  <Link
                    key={card.key}
                    to={card.to}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                  >
                    <span
                      className={`absolute inset-x-0 top-0 h-[3px] ${card.accent}`}
                      aria-hidden="true"
                    />
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.iconClass}`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-[10px] font-bold tracking-[0.12em] text-slate-300">
                        {card.number}
                      </span>
                    </div>
                    <p className="mt-4 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {card.eyebrow}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-navy-900">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
                      {card.description}
                    </p>
                    <ul className="mt-4 flex-1 space-y-2">
                      {card.points.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
                          <span className="text-[11.5px] leading-snug text-slate-600">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <span className="mt-5 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11.5px] font-semibold text-navy-900 transition group-hover:border-navy-200 group-hover:bg-navy-50">
                      {card.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                )
              })}
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-center text-[10.5px] leading-relaxed text-slate-400">
              Demo credentials are checked locally. No backend session or JWT is issued.
            </p>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="scroll-mt-24 border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-maroon-800">
                  The approval workflow
                </p>
                <h2 className="mt-2 font-display text-[28px] font-bold tracking-tight text-navy-900 sm:text-[32px]">
                  From request to classroom clarity.
                </h2>
              </div>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-slate-500">
                A visible, four-stage journey keeps every participant working from the
                same information.
              </p>
            </div>

            <div className="relative mt-9">
              <div
                className="absolute left-[8%] right-[8%] top-[38px] hidden border-t border-dashed border-slate-300 lg:block"
                aria-hidden="true"
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {WORKFLOW.map((step) => (
                  <div key={step.step} className="relative rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-navy-100 bg-navy-50 text-navy-800 ring-4 ring-white">
                        <step.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="font-display text-2xl font-bold text-slate-100">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-[15px] font-semibold text-navy-900">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-navy-100 bg-navy-50/60 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" aria-hidden="true" />
              <p className="text-[11.5px] leading-relaxed text-navy-800">
                <span className="font-semibold">Privacy by role design:</span> pending
                and rejected applications are never exposed in the class tutor portal.
                Tutors see approved leave only for their assigned classes.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 bg-canvas">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-maroon-800">
                System capabilities
              </p>
              <h2 className="mt-2 font-display text-[28px] font-bold tracking-tight text-navy-900 sm:text-[32px]">
                Designed around real administrative work.
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-slate-500">
                Not just forms and tables — the demo includes search, filters,
                validation, notification states and a complete decision trail.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-card"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 transition group-hover:bg-navy-900 group-hover:text-white">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-display text-[14px] font-semibold text-navy-900">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-maroon-50 text-maroon-800">
                  <MousePointerClick className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-[13.5px] font-semibold text-navy-900">
                    Try the complete demo workflow
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
                    Submit as a parent, switch to the HOD portal, approve the request,
                    then review the tutor notification.
                  </p>
                </div>
              </div>
              <a
                href="#portals"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-[11.5px] font-semibold text-white transition hover:bg-navy-800"
              >
                Start with a role
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* Help */}
        <section id="help" className="scroll-mt-24 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="overflow-hidden rounded-xl bg-navy-950 p-6 text-white sm:p-7">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-brand-200">
                  <MonitorSmartphone className="h-3 w-3" aria-hidden="true" />
                  Demo help desk
                </span>
                <h2 className="mt-4 font-display text-[25px] font-bold leading-tight">
                  Need help using the portal?
                </h2>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-navy-200">
                  This help desk is part of the demonstration. For the full demo
                  journey, start with the parent portal and use the pre-filled
                  credentials.
                </p>

                <div className="mt-6 space-y-3.5 border-t border-white/10 pt-5 text-[12px]">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-white">Email</p>
                      <a
                        href="mailto:leave.helpdesk@example.com"
                        className="text-navy-300 transition hover:text-white"
                      >
                        leave.helpdesk@example.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-white">Department office</p>
                      <p className="text-navy-300">Demo help desk · Mon–Fri, 9:00–17:00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-white">Campus</p>
                      <p className="text-navy-300">Madurai, Tamil Nadu · 625015</p>
                    </div>
                  </div>
                </div>

                <a
                  href="#portals"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[11.5px] font-semibold text-navy-900 transition hover:bg-navy-50"
                >
                  Return to role selection
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-maroon-800">
                  Frequently asked questions
                </p>
                <h2 className="mt-2 font-display text-[26px] font-bold tracking-tight text-navy-900">
                  Before you sign in
                </h2>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5">
                  {FAQS.map((faq, index) => (
                    <FaqItem
                      key={faq.question}
                      faq={faq}
                      open={openFaq === index}
                      onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2.5 text-[10.5px] leading-relaxed text-slate-400">
                  <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  <p>
                    The TCE wordmark and logo are used solely to provide institutional
                    design context in this independent academic prototype. No official
                    endorsement is claimed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-maroon-900">
          <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-5 px-4 py-9 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden="true" />
              <div>
                <p className="font-display text-[17px] font-semibold text-white">
                  Ready to explore the leave workflow?
                </p>
                <p className="mt-1 text-[12px] text-maroon-100">
                  Choose a role and follow the complete demo journey.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/login/parent"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[11.5px] font-semibold text-maroon-900 transition hover:bg-maroon-50"
              >
                Parent portal
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                to="/login/hod"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-4 py-2.5 text-[11.5px] font-semibold text-white transition hover:bg-white/10"
              >
                HOD portal
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-4 py-2.5 text-[11.5px] font-semibold text-white transition hover:bg-white/10"
              >
                Admin portal
              </Link>
              <Link
                to="/login/tutor"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-4 py-2.5 text-[11.5px] font-semibold text-white transition hover:bg-white/10"
              >
                Tutor portal
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
