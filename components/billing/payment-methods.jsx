'use client'
// bKash / Nagad payment details — shown on the settings page, the blocked
// page and the renewal modal. Previously four near-identical hand-built
// copies with hard-coded pink/orange tiles.
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button, Card, Alert } from '@/components/ui'

export const PAYMENT_METHODS = [
  { key: 'bkash', label: 'bKash', number: '01799900323', short: 'bK' },
  { key: 'nagad', label: 'Nagad', number: '01799900323', short: 'Ng' },
]

export const SUPPORT_NUMBER = '01799900323'
export const MONTHLY_PRICE = '৳299'

export function PaymentInstructions() {
  return (
    <Alert status="warning" title="How to pay">
      <ol className="list-inside list-decimal space-y-0.5">
        <li>Send {MONTHLY_PRICE} to one of the numbers below</li>
        <li>Use the “Send Money” option</li>
        <li>Screenshot your transaction</li>
        <li>WhatsApp us the screenshot</li>
      </ol>
    </Alert>
  )
}

export function PaymentMethodCard({ method, onCopied }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(method.number)
    setCopied(true)
    onCopied?.(method)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-hover text-label text-secondary">
          {method.short}
        </span>
        <div className="min-w-0">
          <p className="text-label text-tertiary">{method.label}</p>
          <p className="tabular truncate text-h3 text-primary">{method.number}</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={copy} className="shrink-0">
        {copied
          ? <Check size={14} strokeWidth={1.75} className="text-success" />
          : <Copy size={14} strokeWidth={1.75} />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </Card>
  )
}

export function PaymentMethodList({ onCopied }) {
  return (
    <div className="space-y-2">
      {PAYMENT_METHODS.map(m => (
        <PaymentMethodCard key={m.key} method={m} onCopied={onCopied} />
      ))}
    </div>
  )
}
