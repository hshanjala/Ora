'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, Users, FileText,
  TrendingDown, Pill, Settings, LogOut, AlertCircle
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

export default function Sidebar({ clinicName }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 min-h-screen bg-emerald-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
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
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, external }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          if (external) {
            return (
              <a key={label} href={href} className="sidebar-link" target="_blank" rel="noopener noreferrer">
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
    </aside>
  )
}
