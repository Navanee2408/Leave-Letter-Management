import { Link } from 'react-router-dom'
import { ExternalLink, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { APP_NAME, COLLEGE_LOCATION, COLLEGE_NAME } from '../../constants'

export default function PublicFooter() {
  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <div className="inline-flex rounded-lg bg-white px-3 py-2">
              <img
                src="/brand/tce-logo.png"
                alt="Thiagarajar College of Engineering logo"
                className="h-8 w-auto max-w-[190px] object-contain"
              />
            </div>
            <p className="mt-4 max-w-sm text-[12.5px] leading-relaxed text-navy-300">
              An academic leave management prototype built around the administrative
              needs of a modern engineering college. Inspired by the institutional
              identity of {COLLEGE_NAME}, Madurai.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-navy-300">
              <ShieldCheck className="h-3 w-3 text-emerald-400" aria-hidden="true" />
              Independent frontend demonstration — not an official TCE service
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              Portal access
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-[12.5px]">
              <li>
                <Link to="/login/hod" className="text-navy-300 transition hover:text-white">
                  HOD login
                </Link>
              </li>
              <li>
                <Link to="/login/tutor" className="text-navy-300 transition hover:text-white">
                  Class tutor login
                </Link>
              </li>
              <li>
                <Link to="/login/parent" className="text-navy-300 transition hover:text-white">
                  Parent login
                </Link>
              </li>
              <li>
                <Link to="/" className="text-navy-300 transition hover:text-white">
                  Portal home
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              The workflow
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-[12.5px] text-navy-300">
              <li>Parent submits a request</li>
              <li>HOD reviews and decides</li>
              <li>Parent tracks the outcome</li>
              <li>Approved leave reaches the tutor</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              Reference & support
            </h3>
            <ul className="mt-3.5 space-y-3 text-[12.5px] text-navy-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-300" aria-hidden="true" />
                <span>{COLLEGE_LOCATION}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-300" aria-hidden="true" />
                <span>
                  <span className="block text-navy-200">Demo help desk</span>
                  <span className="text-[11px] text-navy-400">leave.helpdesk@example.com</span>
                </span>
              </li>
              <li>
                <a
                  href="https://www.tce.edu/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-200 transition hover:text-white"
                >
                  Design reference: tce.edu
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-[10.5px] text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME} · Frontend prototype for academic
            demonstration
          </p>
          <p>
            Institutional branding is used for design reference only. No official
            affiliation is claimed.
          </p>
        </div>
      </div>
    </footer>
  )
}
