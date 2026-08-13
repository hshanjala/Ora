'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

const Label = forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn('block text-label text-secondary', className)}
      {...props}
    />
  )
})

export { Label }
