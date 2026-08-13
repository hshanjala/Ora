'use client'
import { forwardRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './button'

const Pagination = forwardRef(function Pagination(
  { className, page, pageCount, onPageChange, totalLabel, ...props },
  ref
) {
  if (pageCount <= 1 && !totalLabel) return null
  return (
    <nav
      ref={ref}
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-3 px-4 py-3', className)}
      {...props}
    >
      <p className="text-label text-tertiary">
        {totalLabel || (
          <>
            Page <span className="tabular text-secondary">{page}</span> of{' '}
            <span className="tabular text-secondary">{pageCount}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
          Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange?.(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={14} strokeWidth={1.75} />
        </Button>
      </div>
    </nav>
  )
})

export { Pagination }
