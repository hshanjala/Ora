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
    <div className="w-60 min-h-screen bg-emerald-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow">
            <span className="text-lg font-black text-emerald-700">O</span>
          </div>
          <div>
            <h1 className="font-black text-white text-xl leading-none">Ora</h1>
            {clinicName && (
              <p className="text-emerald-300 text-xs mt-0.5 truncate max-w-[120px]">{clinicName}</p>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-emerald-300 hover:text-white md:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, external }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          if (external) {
            return (
              <a key={label} href={href} className="sidebar-link" target="_blank" rel="noopener noreferrer" onClick={handleNav}>
                <Icon size={18} />
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
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-6">
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-300 hover:bg-red-500/20"
        >
          <LogOut size={18} />
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-emerald-800 flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
            <span className="text-base font-black text-emerald-700">O</span>
          </div>
          <div>
            <span className="font-black text-white text-lg leading-none">Ora</span>
            {clinicName && <p className="text-emerald-300 text-xs truncate max-w-[140px]">{clinicName}</p>}
          </div>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white p-1">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <SidebarContent clinicName={clinicName} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
