'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

// Surface on canvas: hairline border does the work, no shadow by default.
const Card = forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-surface', className)}
      {...props}
    />
  )
})

const CardHeader = forwardRef(function CardHeader(
  { className, title, subtitle, actions, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-start justify-between gap-3 px-5 pt-4 pb-3', className)}
      {...props}
    >
      {children ?? (
        <>
          <div className="min-w-0">
            {title && <h2 className="text-h3 text-primary">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-small text-secondary">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </>
      )}
    </div>
  )
})

const CardBody = forwardRef(function CardBody({ className, ...props }, ref) {
  return <div ref={ref} className={cn('px-5 py-4', className)} {...props} />
})

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 border-t px-5 py-3', className)}
      {...props}
    />
  )
})

export { Card, CardHeader, CardBody, CardFooter }
