'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, Users, FileText,
  TrendingDown, Pill, Settings, LogOut, AlertCircle, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import NotificationButton from '@/components/NotificationButton'

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

function SidebarContent({ clinicName, onClose, collapsed, onToggleCollapse }) {
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
    <div className={`${collapsed ? 'w-16' : 'w-60'} min-h-screen bg-emerald-800 flex flex-col transition-all duration-200`}>
      {/* Logo */}
      <div className={`py-5 border-b border-white/10 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 bg-white rounded-xl flex items-center justify-center shadow">
            <span className="text-lg font-black text-emerald-700">O</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-black text-white text-xl leading-none">Ora</h1>
              {clinicName && (
                <p className="text-emerald-300 text-xs mt-0.5 truncate max-w-[100px]">{clinicName}</p>
              )}
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-emerald-300 hover:text-white md:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, external }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const cls = `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
          if (external) {
            return (
              <a key={label} href={href} className={`sidebar-link ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? label : undefined}
                target="_blank" rel="noopener noreferrer" onClick={handleNav}>
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </a>
            )
          }
          return (
            <Link key={label} href={href} className={cls}
              title={collapsed ? label : undefined}
              onClick={handleNav}>
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Notifications + Sign out */}
      <div className="px-2 pb-4 space-y-1">
        {!collapsed && <NotificationButton />}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`sidebar-link w-full text-red-300 hover:bg-red-500/20 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      {onToggleCollapse && (
        <div className="px-2 pb-5 flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-1.5 text-emerald-400 hover:text-white hover:bg-white/10 rounded-lg py-2 transition-colors text-xs font-medium"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ clinicName }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex shrink-0">
        <SidebarContent clinicName={clinicName} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
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
