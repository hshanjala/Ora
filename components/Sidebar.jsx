'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, Users, FileText,
  TrendingDown, Pill, Settings, LogOut, AlertCircle, Menu, X
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',       href: '/',             icon: LayoutDashboard },
  { label: 'Schedule',        href: '/schedule',     icon: CalendarDays },
  { label: 'Patients',        href: '/patients',     icon: Users },
  { label: 'Invoice & Billing', href: '/invoices',   icon: FileText },
  { label: 'Expenses',        href: '/expenses',     icon: TrendingDown },
  { label: 'Prescriptions',   href: '/prescriptions', icon: Pill },
  { label: 'Settings',        href: '/settings',     icon: Settings },
  { label: 'Report a Problem', href: 'mailto:support@ora.app', icon: AlertCircle, external: true },
]

function SidebarContent({ clinicName, onClose }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div
      className="w-[220px] min-h-screen flex flex-col select-none"
      style={{ background: '#1c1c1e' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#059669' }}
          >
            O
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white leading-none">Ora</p>
            {clinicName && (
              <p className="text-[11px] mt-0.5 truncate max-w-[130px]" style={{ color: '#6b7280' }}>
                {clinicName}
              </p>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 md:hidden transition-colors">
            <X size={17} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, external }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

          if (external) {
            return (
              <a
                key={label}
                href={href}
                className="sidebar-link"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClose?.()}
              >
                <Icon size={15} strokeWidth={1.75} />
                <span>{label}</span>
              </a>
            )
          }

          return (
            <Link
              key={label}
              href={href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => onClose?.()}
            >
              <Icon size={15} strokeWidth={1.75} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-4">
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }} />
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={15} strokeWidth={1.75} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ clinicName }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex shrink-0">
        <SidebarContent clinicName={clinicName} />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: '#1c1c1e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: '#059669' }}
          >
            O
          </div>
          <span className="text-[14px] font-semibold text-white">Ora</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white transition-colors p-1">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">
            <SidebarContent clinicName={clinicName} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
