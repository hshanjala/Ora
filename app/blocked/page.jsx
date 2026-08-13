'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, Clock, LogOut, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Button, Card, SpinnerBlock, ToastProvider, useToast, Eyebrow,
} from '@/components/ui'
import {
  PaymentInstructions, PaymentMethodList, MONTHLY_PRICE, SUPPORT_NUMBER,
} from '@/components/billing/payment-methods'

function BlockedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()
  const reason = searchParams.get('reason') // 'suspended' | 'expired'

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const isSuspended = reason === 'suspended'
  const Icon = isSuspended ? Lock : Clock

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="p-6">
          <div className="text-center">
            <span
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                isSuspended ? 'bg-surface-hover text-secondary' : 'bg-danger-subtle text-danger'
              }`}
            >
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <h1 className="text-h2 text-primary">
              {isSuspended ? 'Account suspended' : 'Subscription expired'}
            </h1>
            <p className="mt-1.5 text-small text-secondary">
              {isSuspended
                ? 'Your account has been suspended by the administrator. Contact support to restore access.'
                : `Your free trial or subscription has ended. Renew for ${MONTHLY_PRICE}/month to continue using Ora.`}
            </p>
          </div>

          {isSuspended ? (
            <div className="mt-5 rounded-md bg-surface-subtle p-4 text-center">
              <Eyebrow>Contact support via WhatsApp</Eyebrow>
              <p className="tabular mt-1 text-h3 text-primary">{SUPPORT_NUMBER}</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <PaymentInstructions />
              <PaymentMethodList
                onCopied={(m) => toast.success('Number copied', `${m.label} · ${m.number}`)}
              />
              <p className="text-center text-label text-tertiary">
                Your account will be restored within 24 hours after payment.
                <br />
                Questions? WhatsApp <span className="tabular">{SUPPORT_NUMBER}</span>
              </p>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <Button className="w-full" size="lg" onClick={() => router.replace('/')}>
              <RefreshCw size={15} strokeWidth={1.75} /> Try again
            </Button>
            <Button variant="secondary" className="w-full" size="lg" onClick={handleLogout}>
              <LogOut size={15} strokeWidth={1.75} /> Log out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function BlockedPage() {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-canvas">
            <SpinnerBlock />
          </div>
        }
      >
        <BlockedContent />
      </Suspense>
    </ToastProvider>
  )
}
