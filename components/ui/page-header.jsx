'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * Used by every page: title + subtitle + actions slot.
 *
 * By default the actions drop below the title on mobile, which is right when
 * a page has several full-width actions. Pass `inlineActions` when the actions
 * collapse to icons on small screens and should stay on the title row instead.
 */
const PageHeader = forwardRef(function PageHeader(
  { className, title, subtitle, actions, inlineActions = false, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'mb-6 flex gap-3',
        inlineActions
          ? 'flex-row items-start justify-between'
          : 'flex-col sm:flex-row sm:items-start sm:justify-between',
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="text-h1 text-primary">{title}</h1>
        {subtitle && <p className="mt-0.5 text-small text-secondary">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
})

const SectionHeader = forwardRef(function SectionHeader(
  { className, title, subtitle, actions, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('mb-3 flex items-center justify-between gap-3', className)}
      {...props}
    >
      <div className="min-w-0">
        <h2 className="text-h3 text-primary">{title}</h2>
        {subtitle && <p className="mt-0.5 text-small text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
})

// Uppercase 11px eyebrow for sidebar sections / grouped lists.
const Eyebrow = forwardRef(function Eyebrow({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn('text-micro uppercase text-tertiary', className)}
      {...props}
    />
  )
})

export { PageHeader, SectionHeader, Eyebrow }
