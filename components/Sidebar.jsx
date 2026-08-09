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
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Schedule', href: '/schedule', icon: CalendarDays },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Invoice & Billing', href: '/invoices', icon: FileText },
  { label: 'Expenses', href: '/expenses', icon: TrendingDown },
  { label: 'Prescriptions', href: '/prescriptions', icon: Pill },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Report a Problem', href: 'mailto:support@ora.app', icon: AlertCircle, external: true },
]

function SidebarContent({ clinicName, onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleNav() {
    onClose?.()
  }

  return (
    <div className="w-60 min-h-screen flex flex-col" style={{ background: '#0d2218' }}>
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <span className="text-sm font-black" style={{ color: '#34d399' }}>O</span>
          </div>
          <div>
            <h1 className="font-black text-white text-[15px] leading-none tracking-tight">Ora</h1>
            {clinicName && (
              <p className="text-xs mt-0.5 truncate max-w-[120px]" style={{ color: '#3d7a5f' }}>{clinicName}</p>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden" style={{ color: '#3d7a5f' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 mb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, external }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          if (external) {
            return (
              <a key={label} href={href} className="sidebar-link" target="_blank" rel="noopener noreferrer" onClick={handleNav}>
                <Icon size={16} />
                <span>{label}</span>
              </a>
            )
          }
          return (
            <Link
              key={label}
              href={href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleNav}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

      {/* Sign out */}
      <div className="px-2.5 py-3">
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full"
          style={{ color: '#4a7a62' }}
        >
          <LogOut size={16} />
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex shrink-0">
        <SidebarContent clinicName={clinicName} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 shadow-md" style={{ background: '#0d2218' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <span className="text-xs font-black" style={{ color: '#34d399' }}>O</span>
          </div>
          <span className="font-black text-white text-[15px] leading-none">Ora</span>
          {clinicName && <span className="text-xs ml-1 truncate max-w-[100px]" style={{ color: '#3d7a5f' }}>{clinicName}</span>}
        </div>
        <button onClick={() => setMobileOpen(true)} style={{ color: '#5a9478' }}>
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <SidebarContent clinicName={clinicName} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
