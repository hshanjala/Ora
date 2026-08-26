'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, PanelLeftClose, PanelLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'
import { IconButton, Tooltip } from '@/components/ui'
import { NAV_MAIN, NAV_WORKSPACE, isActivePath } from './nav-items'

const COLLAPSE_KEY = 'ora-sidebar-collapsed'

function NavItem({ item, collapsed, active }) {
  const { label, href, icon: Icon, external } = item
  const inner = (
    <>
      <Icon size={16} strokeWidth={1.75} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  )
  const classes = cn(
    'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-body-md transition-colors duration-fast ease-out',
    collapsed && 'justify-center px-0',
    active
      ? 'bg-sidebar-active text-sidebar-fg-active'
      : 'text-sidebar-fg hover:bg-surface-hover hover:text-sidebar-fg-active'
  )

  const node = external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={classes} aria-current={active ? 'page' : undefined}>
      {inner}
    </Link>
  )

  return collapsed ? (
    <Tooltip label={label} side="right">{node}</Tooltip>
  ) : (
    node
  )
}

export default function Sidebar({ clinicName }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  // Persisted collapse state (read after mount to stay hydration-safe).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {}
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      try { localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1') } catch {}
      return !prev
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-base ease-out md:flex',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo + collapse toggle. Collapsed, the two stack: a 64px rail has no
          room for them side by side. */}
      <div
        className={cn(
          'flex items-center gap-2.5 px-3 pb-4 pt-5',
          collapsed && 'flex-col gap-2 px-0'
        )}
      >
        <Image src="/logo-icon-sm.png" alt="Ora" width={28} height={28} className="shrink-0" />
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block text-body-md leading-none text-primary">Ora</span>
            {clinicName && (
              <span className="mt-0.5 block truncate text-micro text-tertiary">{clinicName}</span>
            )}
          </span>
        )}
        <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <IconButton
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            size="sm"
            onClick={toggleCollapsed}
            className="shrink-0 text-sidebar-fg"
          >
            {collapsed
              ? <PanelLeft size={16} strokeWidth={1.75} />
              : <PanelLeftClose size={16} strokeWidth={1.75} />}
          </IconButton>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-1">
        <div className="space-y-0.5">
          {!collapsed && <p className="mb-1.5 px-2.5 text-micro uppercase text-tertiary">Clinic</p>}
          {NAV_MAIN.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              collapsed={collapsed}
              active={isActivePath(pathname, item.href)}
            />
          ))}
        </div>
        <div className="space-y-0.5">
          {!collapsed && <p className="mb-1.5 px-2.5 text-micro uppercase text-tertiary">Workspace</p>}
          {NAV_WORKSPACE.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              collapsed={collapsed}
              active={!item.external && isActivePath(pathname, item.href)}
            />
          ))}
        </div>
      </nav>

      {/* Footer: sign out (the collapse toggle now sits beside the logo) */}
      <div className="border-t border-sidebar-border px-3 py-3">
        {collapsed ? (
          <Tooltip label="Sign out" side="right">
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex h-9 w-full items-center justify-center rounded-md text-sidebar-fg transition-colors duration-fast ease-out hover:bg-danger-subtle hover:text-danger"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-body-md text-sidebar-fg transition-colors duration-fast ease-out hover:bg-danger-subtle hover:text-danger"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  )
}
