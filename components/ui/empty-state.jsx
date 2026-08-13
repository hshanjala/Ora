'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

// Icon + title + one-line guidance + primary action. One implementation,
// used by every list and table in the product.
const EmptyState = forwardRef(function EmptyState(
  { className, icon: Icon, title, description, action, compact = false, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className
      )}
      {...props}
    >
      {Icon && (
        <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-hover text-tertiary">
          <Icon size={20} strokeWidth={1.5} />
        </span>
      )}
      <p className="text-body-md text-primary">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-small text-secondary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
})

// Error twin of EmptyState, with a retry affordance.
const ErrorState = forwardRef(function ErrorState(
  { className, title = 'Something went wrong', description = 'Could not load this data. Check your connection and try again.', action, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
      {...props}
    >
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-danger-subtle text-danger">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <p className="text-body-md text-primary">{title}</p>
      <p className="mt-1 max-w-sm text-small text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
})

export { EmptyState, ErrorState }
