import {
  LayoutDashboard, CalendarDays, Users, FileText,
  TrendingDown, Pill, Settings, AlertCircle,
} from 'lucide-react'

// Labels and destinations are unchanged from the previous sidebar — the
// redesign does not alter information architecture.
export const NAV_MAIN = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Schedule', href: '/schedule', icon: CalendarDays },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Invoice & Billing', href: '/invoices', icon: FileText },
  { label: 'Expenses', href: '/expenses', icon: TrendingDown },
  { label: 'Prescriptions', href: '/prescriptions', icon: Pill },
]

export const NAV_WORKSPACE = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Report a Problem', href: 'mailto:support@ora.app', icon: AlertCircle, external: true },
]

// Bottom tab bar: the 4 most-used destinations; the rest live in "More".
export const NAV_MOBILE = NAV_MAIN.slice(0, 4)
export const NAV_MOBILE_MORE = [...NAV_MAIN.slice(4), ...NAV_WORKSPACE]

export function isActivePath(pathname, href) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function pageTitle(pathname) {
  const all = [...NAV_MAIN, ...NAV_WORKSPACE]
  const hit = all.find((item) => !item.external && isActivePath(pathname, item.href))
  return hit?.label || 'Ora'
}
