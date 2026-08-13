'use client'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const Spinner = forwardRef(function Spinner({ className, size = 16, ...props }, ref) {
  return (
    <Loader2
      ref={ref}
      size={size}
      strokeWidth={2}
      aria-hidden="true"
      className={cn('animate-spin text-current motion-reduce:animate-none', className)}
      {...props}
    />
  )
})

// Centered block spinner for page/section loading.
const SpinnerBlock = forwardRef(function SpinnerBlock({ className, label = 'Loading…', ...props }, ref) {
  return (
    <div
      ref={ref}
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center py-12 text-tertiary', className)}
      {...props}
    >
      <Spinner size={20} />
    </div>
  )
})

export { Spinner, SpinnerBlock }
