'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

// Vertical activity/visit timeline: dot + hairline rail, content to the right.
const Timeline = forwardRef(function Timeline({ className, children, ...props }, ref) {
  return (
    <ol ref={ref} className={cn('relative', className)} {...props}>
      {children}
    </ol>
  )
})

const TimelineItem = forwardRef(function TimelineItem(
  { className, marker, title, meta, children, last = false, ...props },
  ref
) {
  return (
    <li ref={ref} className={cn('relative flex gap-3 pb-5', last && 'pb-0', className)} {...props}>
      <div className="flex flex-col items-center">
        <span className="z-10 mt-1 flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border-2 border-strong bg-surface">
          {marker}
        </span>
        {!last && <span className="w-px flex-1 bg-subtle" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-baseline justify-between gap-2">
          {title && <p className="text-body-md text-primary">{title}</p>}
          {meta && <p className="tabular shrink-0 text-label text-tertiary">{meta}</p>}
        </div>
        {children && <div className="mt-1 text-small text-secondary">{children}</div>}
      </div>
    </li>
  )
})

export { Timeline, TimelineItem }
