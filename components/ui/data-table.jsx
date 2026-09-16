'use client'
import { forwardRef, useMemo, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SkeletonTable } from './skeleton'
import { EmptyState, ErrorState } from './empty-state'
import { Button } from './button'

/**
 * The one table. Light header row, hairline row dividers, no vertical grid
 * lines, dense but breathing. Under `md` it collapses to a stacked card list
 * when `renderCard` is provided.
 *
 * columns: [{
 *   key            unique id
 *   header         node
 *   cell(row)      node
 *   align          'left' (default) | 'right' | 'center'
 *   sortable       boolean — enables client-side sorting
 *   sortValue(row) value used for sorting (defaults to cell text-ish access by key)
 *   hideBelow      'sm' | 'md' | 'lg' — responsive column hiding
 *   tabular        boolean — Geist Mono tabular figures (money, IDs, dates)
 *   width          optional className for the header cell (e.g. 'w-24')
 * }]
 */
const HIDE = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

const DataTable = forwardRef(function DataTable(
  {
    className,
    columns = [],
    data = [],
    rowKey = (row) => row.id,
    onRowClick,
    loading = false,
    error = null,
    onRetry,
    emptyState = {},
    renderCard,
    initialSort = null, // { key, dir: 'asc' | 'desc' }
    footer,
    stickyHeader = false,
    ...props
  },
  ref
) {
  const [sort, setSort] = useState(initialSort)

  const sorted = useMemo(() => {
    if (!sort) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return data
    const val = col.sortValue || ((row) => row[col.key])
    return [...data].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      if (av == null) return 1
      if (bv == null) return -1
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort, columns])

  function toggleSort(col) {
    if (!col.sortable) return
    setSort((prev) =>
      prev?.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'asc' }
    )
  }

  if (loading) return <SkeletonTable cols={Math.min(columns.length, 5)} className={className} />
  if (error) {
    return (
      <ErrorState
        description={typeof error === 'string' ? error : undefined}
        action={
          onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )
        }
        className={className}
      />
    )
  }
  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title || 'Nothing here yet'}
        description={emptyState.description}
        action={emptyState.action}
        className={className}
      />
    )
  }

  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      {/* Mobile: stacked card list */}
      {renderCard && (
        <ul className="md:hidden">
          {sorted.map((row) => (
            <li
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b px-4 py-3 last:border-0',
                onRowClick && 'cursor-pointer transition-colors duration-fast hover:bg-surface-hover'
              )}
            >
              {renderCard(row)}
            </li>
          ))}
        </ul>
      )}

      {/* Desktop table (always shown when no card renderer) */}
      <div className={cn('overflow-x-auto', renderCard && 'hidden md:block')}>
        <table className="w-full border-collapse">
          <thead>
            <tr className={cn('border-b bg-surface-subtle', stickyHeader && 'sticky top-0 z-10')}>
              {columns.map((col) => {
                const sortedHere = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={sortedHere ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'px-4 py-2.5 text-label text-secondary font-medium',
                      ALIGN[col.align || 'left'],
                      HIDE[col.hideBelow],
                      col.width
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-sm transition-colors duration-fast hover:text-primary',
                          sortedHere && 'text-primary'
                        )}
                      >
                        {col.header}
                        {sortedHere &&
                          (sort.dir === 'asc' ? (
                            <ChevronUp size={12} strokeWidth={2} />
                          ) : (
                            <ChevronDown size={12} strokeWidth={2} />
                          ))}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b last:border-0 transition-colors duration-fast',
                  onRowClick && 'cursor-pointer hover:bg-surface-hover'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-small text-primary',
                      ALIGN[col.align || 'left'],
                      HIDE[col.hideBelow],
                      col.tabular && 'tabular whitespace-nowrap'
                    )}
                  >
                    {col.cell ? col.cell(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
    </div>
  )
})

export { DataTable }
