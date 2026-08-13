'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MoreHorizontal, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'
import { Sheet, SheetContent, SheetHeader, SheetBody } from '@/components/ui'
import { NAV_MOBILE, NAV_MOBILE_MORE, isActivePath } from './nav-items'

function Tab({ href, icon: Icon, label, active, onClick }) {
  // ≥44px touch targets throughout.
  const classes = cn(
    'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md py-1.5 transition-colors duration-fast ease-out',
    active ? 'text-primary' : 'text-tertiary'
  )
  const inner = (
    <>
      <Icon size={18} strokeWidth={active ? 2 : 1.75} />
      <span className="text-micro">{label}</span>
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} aria-label={label}>
        {inner}
      </button>
    )
  }
  return (
    <Link href={href} className={classes} aria-current={active ? 'page' : undefined}>
      {inner}
    </Link>
  )
}

export default function MobileTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = NAV_MOBILE_MORE.some(
    (item) => !item.external && isActivePath(pathname, item.href)
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-0.5 border-t bg-surface px-1.5 pt-0.5 pb-safe md:hidden"
      >
        {NAV_MOBILE.map((item) => (
          <Tab
            key={item.label}
            href={item.href}
            icon={item.icon}
            label={item.label === 'Invoice & Billing' ? 'Invoices' : item.label}
            active={isActivePath(pathname, item.href)}
          />
        ))}
        <Tab
          icon={MoreHorizontal}
          label="More"
          active={moreActive}
          onClick={() => setMoreOpen(true)}
        />
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader title="More" />
          <SheetBody className="pb-6">
            <div className="space-y-0.5">
              {NAV_MOBILE_MORE.map(({ label, href, icon: Icon, external }) =>
                external ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-md px-2.5 text-body-md text-primary transition-colors duration-fast hover:bg-surface-hover"
                  >
                    <Icon size={16} strokeWidth={1.75} className="text-secondary" />
                    {label}
                  </a>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-md px-2.5 text-body-md transition-colors duration-fast hover:bg-surface-hover',
                      isActivePath(pathname, href)
                        ? 'bg-surface-active text-primary'
                        : 'text-primary'
                    )}
                  >
                    <Icon size={16} strokeWidth={1.75} className="text-secondary" />
                    {label}
                  </Link>
                )
              )}
              <button
                onClick={handleSignOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 text-body-md text-danger transition-colors duration-fast hover:bg-danger-subtle"
              >
                <LogOut size={16} strokeWidth={1.75} />
                Sign Out
              </button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}
