'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * Segmented filter row (the "all / unpaid / partial / paid" pattern).
 *
 * <FilterBar
 *   value={status}
 *   onChange={setStatus}
 *   options={[{ value: 'all', label: 'All' }, …]}
 * />
 */
const FilterBar = forwardRef(function FilterBar(
  { className, options = [], value, onChange, 'aria-label': ariaLabel = 'Filter', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      {...props}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-label transition-colors duration-fast ease-out',
              active
                ? 'bg-surface-active text-primary'
                : 'text-secondary hover:bg-surface-hover hover:text-primary'
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span className={cn('tabular text-micro', active ? 'text-secondary' : 'text-tertiary')}>
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
})

export { FilterBar }
