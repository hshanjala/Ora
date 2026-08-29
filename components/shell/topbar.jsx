'use client'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, Settings, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Avatar,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui'
import NotificationButton from './notification-button'
import { pageTitle } from './nav-items'

export default function Topbar({ settings }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const title = pageTitle(pathname)
  const personName = settings?.doctor_name || settings?.clinic_name || 'Ora'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-surface px-4 md:px-6">
      {/* Left: mobile brand + current page */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Image src="/logo-icon-sm.png" alt="Ora" width={24} height={24} className="shrink-0 md:hidden" />
        <h1 className="truncate text-body-md text-primary">{title}</h1>
      </div>

      {/* Right: notifications + avatar menu */}
      <div className="flex shrink-0 items-center gap-1.5">
        <NotificationButton />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="rounded-full transition-opacity duration-fast hover:opacity-80"
          >
            <Avatar name={personName} size="sm" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="normal-case">
              <span className="block text-body-md text-primary">{personName}</span>
              {settings?.clinic_name && settings?.doctor_name && (
                <span className="block truncate text-label font-normal text-tertiary">
                  {settings.clinic_name}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings size={14} strokeWidth={1.75} /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="https://mail.google.com/mail/?view=cm&to=orabdpro@gmail.com&su=Problem%20Report%20-%20Ora">
                <AlertCircle size={14} strokeWidth={1.75} /> Report a Problem
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={handleSignOut}>
              <LogOut size={14} strokeWidth={1.75} /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
