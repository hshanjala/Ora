'use client'
import { ToastProvider } from '@/components/ui'
import Sidebar from './sidebar'
import Topbar from './topbar'
import MobileTabBar from './mobile-tab-bar'
import SubscriptionStrip from './subscription-strip'

// The app frame: white sidebar + topbar on canvas, bottom tab bar on mobile.
// Content max-width and page padding are applied per page (legacy pages keep
// their own wrappers until they migrate).
export default function AppShell({ settings, children }) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-canvas">
        <Sidebar clinicName={settings?.clinic_name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar settings={settings} />
          <SubscriptionStrip settings={settings} />
          {/* pb clears the mobile tab bar */}
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </div>
      </div>
      <MobileTabBar />
    </ToastProvider>
  )
}
