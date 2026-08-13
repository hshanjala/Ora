'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

// Per-shape skeletons, not a gray blob. Compose them into the shape of the
// content they stand in for.
const Skeleton = forwardRef(function Skeleton({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-hover motion-reduce:animate-none', className)}
      {...props}
    />
  )
})

function SkeletonText({ className, lines = 1, ...props }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

function SkeletonCircle({ className, ...props }) {
  return <Skeleton className={cn('h-9 w-9 rounded-full', className)} {...props} />
}

// Table stand-in: header row + n rows of cells.
function SkeletonTable({ rows = 5, cols = 4, className, ...props }) {
  return (
    <div className={cn('w-full', className)} {...props}>
      <div className="flex gap-4 border-b bg-surface-subtle px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3.5 flex-1', c === 0 && 'h-4')} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Stat card stand-in.
function SkeletonStat({ className, ...props }) {
  return (
    <div className={cn('rounded-lg border bg-surface p-4', className)} {...props}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonTable, SkeletonStat }
