'use client'
// Trial/subscription state, shown by the shell as quiet system UI: invisible
// while healthy, a slim strip when time is running out, firm when expired.
// Business rules (dates, statuses, payment numbers) unchanged from the
// retired components/SubscriptionBanner.jsx.
import { useState } from 'react'
import { format } from 'date-fns'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  Button, Alert,
  Modal, ModalContent, ModalHeader, ModalBody,
  useToast,
} from '@/components/ui'

const PAYMENT_METHODS = [
  { label: 'bKash', num: '01629775202', key: 'bkash' },
  { label: 'Nagad', num: '01799900323', key: 'nagad' },
]

function PaymentModal({ open, onOpenChange }) {
  const [copied, setCopied] = useState(null)
  const toast = useToast()

  function copy(num, key) {
    navigator.clipboard.writeText(num)
    setCopied(key)
    toast.success('Number copied', num)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader title="Renew Subscription" subtitle="Send ৳299 to renew for 1 month" />
        <ModalBody className="space-y-3">
          <Alert status="warning" title="How to pay">
            <ol className="list-inside list-decimal space-y-0.5">
              <li>Send ৳299 to one of the numbers below</li>
              <li>Use the “Send Money” option</li>
              <li>Screenshot your transaction</li>
              <li>WhatsApp us the screenshot</li>
            </ol>
          </Alert>
          {PAYMENT_METHODS.map(({ label, num, key }) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-lg border p-3.5">
              <div className="min-w-0">
                <p className="text-label text-tertiary">{label}</p>
                <p className="tabular text-h3 text-primary">{num}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copy(num, key)}>
                {copied === key ? (
                  <Check size={14} strokeWidth={1.75} className="text-success" />
                ) : (
                  <Copy size={14} strokeWidth={1.75} />
                )}
                {copied === key ? 'Copied' : 'Copy'}
              </Button>
            </div>
          ))}
          <p className="text-center text-label text-tertiary">
            Account extended within 24 hours after payment.
          </p>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default function SubscriptionStrip({ settings }) {
  const [showModal, setShowModal] = useState(false)

  if (!settings) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isSuspended = settings.subscription_status === 'suspended'
  const isOnTrial = settings.subscription_status === 'trial' || !settings.subscription_status
  const isActive = settings.subscription_status === 'active'

  const endDateStr = isOnTrial ? settings.trial_end : settings.subscription_end
  let daysLeft = null
  let endDateFormatted = ''
  if (endDateStr) {
    const end = new Date(endDateStr + 'T00:00:00')
    daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    endDateFormatted = format(end, 'MMM d, yyyy')
  }

  const isExpired = daysLeft !== null && daysLeft <= 0
  const isUrgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 7

  // Quiet until it matters: healthy paid subscriptions and comfortable trials
  // show nothing.
  if (!isSuspended && !isExpired && !isUrgent && (isActive || !isOnTrial)) return null
  if (isOnTrial && !isExpired && !isUrgent && daysLeft !== null && daysLeft > 7) return null

  let tone = 'warning'
  let message = ''
  if (isSuspended) {
    tone = 'danger'
    message = 'Your account has been suspended. Contact support to restore access.'
  } else if (isExpired) {
    tone = 'danger'
    message = `Your ${isOnTrial ? 'trial' : 'subscription'} ended on ${endDateFormatted}. Renew to keep access.`
  } else if (endDateStr) {
    message = `${isOnTrial ? 'Free trial' : 'Subscription'} ends ${endDateFormatted} — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left.`
  } else {
    message = 'Renew for ৳299/month to continue.'
  }

  return (
    <>
      <div
        role="status"
        className={cn(
          'flex items-center justify-between gap-3 border-b px-4 py-2 md:px-6',
          tone === 'danger' ? 'bg-danger-subtle' : 'bg-warning-subtle'
        )}
      >
        <p className={cn('min-w-0 truncate text-small', tone === 'danger' ? 'text-danger' : 'text-warning')}>
          {message}
        </p>
        {!isSuspended && (
          <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setShowModal(true)}>
            Renew — ৳299/mo
          </Button>
        )}
      </div>
      <PaymentModal open={showModal} onOpenChange={setShowModal} />
    </>
  )
}
