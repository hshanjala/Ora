'use client'
import { useState } from 'react'
import { ToastProvider } from '@/components/ui'
import Sidebar from './sidebar'
import Topbar from './topbar'
import MobileTabBar from './mobile-tab-bar'
import SubscriptionStrip from './subscription-strip'
import FeedbackModal from './feedback-modal'

export default function AppShell({ settings, children }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-canvas">
        <Sidebar clinicName={settings?.clinic_name} onOpenFeedback={() => setFeedbackOpen(true)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar settings={settings} onOpenFeedback={() => setFeedbackOpen(true)} />
          <SubscriptionStrip settings={settings} />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </div>
      </div>
      <MobileTabBar onOpenFeedback={() => setFeedbackOpen(true)} />
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </ToastProvider>
  )
}
