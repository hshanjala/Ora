'use client'
import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
}

const alertVariants = cva('flex items-start gap-2.5 rounded-md p-3', {
  variants: {
    status: {
      success: 'bg-success-subtle text-success',
      warning: 'bg-warning-subtle text-warning',
      danger: 'bg-danger-subtle text-danger',
      info: 'bg-info-subtle text-info',
    },
  },
  defaultVariants: { status: 'info' },
})

// Inline alert / banner: form errors, contextual warnings. Quiet until it
// matters — status color stays inside this box.
const Alert = forwardRef(function Alert(
  { className, status = 'info', title, children, hideIcon = false, ...props },
  ref
) {
  const Icon = ICONS[status]
  return (
    <div ref={ref} role="alert" className={cn(alertVariants({ status }), className)} {...props}>
      {!hideIcon && <Icon size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" />}
      <div className="min-w-0 text-small">
        {title && <p className="text-body-md">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  )
})

export { Alert }
