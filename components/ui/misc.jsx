'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

// ── Divider ─────────────────────────────────────────────────────────────────
const Divider = forwardRef(function Divider({ className, ...props }, ref) {
  return (
    <hr
      ref={ref}
      className={cn('border-0 border-t border-subtle', className)}
      {...props}
    />
  )
})

// ── Kbd ─────────────────────────────────────────────────────────────────────
const Kbd = forwardRef(function Kbd({ className, ...props }, ref) {
  return (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-surface-subtle px-1 font-mono text-micro text-secondary',
        className
      )}
      {...props}
    />
  )
})

// ── Progress ────────────────────────────────────────────────────────────────
const Progress = forwardRef(function Progress(
  { className, value = 0, max = 100, tone = 'accent', ...props },
  ref
) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-hover', className)}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-base ease-out',
          tone === 'accent' && 'bg-accent',
          tone === 'warning' && 'bg-warning',
          tone === 'danger' && 'bg-danger'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
})

export { Divider, Kbd, Progress }
