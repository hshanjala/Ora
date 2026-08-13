'use client'
import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// Neutral badge: counts, categories, meta. Pills are for badges and avatars
// only — nothing else in the system is pill-shaped.
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-hover text-secondary',
        accent: 'bg-accent-subtle text-accent-text',
        outline: 'border text-secondary',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

const Badge = forwardRef(function Badge({ className, variant, ...props }, ref) {
  return (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
})

// Status pill: tinted fg-on-subtle-bg pairs. Small size, high weight —
// the only colored moments in tables.
const statusPillVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro whitespace-nowrap',
  {
    variants: {
      status: {
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        danger: 'bg-danger-subtle text-danger',
        info: 'bg-info-subtle text-info',
        neutral: 'bg-surface-hover text-secondary',
      },
    },
    defaultVariants: { status: 'neutral' },
  }
)

const StatusPill = forwardRef(function StatusPill({ className, status, ...props }, ref) {
  return (
    <span ref={ref} className={cn(statusPillVariants({ status }), className)} {...props} />
  )
})

export { Badge, StatusPill }
