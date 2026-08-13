'use client'
import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// The 24–28px tinted square from the benchmark — the only real color moments
// outside status pills. Pass a lucide icon as `icon`.
const iconTileVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-md',
  {
    variants: {
      tone: {
        accent: 'bg-accent-subtle text-accent-text',
        neutral: 'bg-surface-hover text-secondary',
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        danger: 'bg-danger-subtle text-danger',
        info: 'bg-info-subtle text-info',
      },
      size: {
        sm: 'h-6 w-6',
        md: 'h-7 w-7',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  }
)

const IconTile = forwardRef(function IconTile(
  { className, tone, size, icon: Icon, ...props },
  ref
) {
  return (
    <span ref={ref} className={cn(iconTileVariants({ tone, size }), className)} aria-hidden="true" {...props}>
      {Icon && <Icon size={size === 'sm' ? 13 : 14} strokeWidth={1.75} />}
    </span>
  )
})

export { IconTile }
