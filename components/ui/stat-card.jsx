'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './card'
import { IconTile } from './icon-tile'
import { StatusPill } from './badge'

// Label + big tabular number + optional delta chip + IconTile.
// Muted gray label over strong near-black value: contrast from weight and
// color, never size alone.
//
// `compact` is for grids that stay multi-column on phones. Three cards across
// a 360px screen leave ~80px of usable width per card, which a 30px number and
// a 24px icon tile do not fit — so below `sm` the padding tightens, the icon
// tile drops (it is decorative, the label carries the meaning) and the value
// steps down to 18px. From `sm` up the card is byte-identical to the default,
// so opting in costs nothing on tablet and desktop.
const StatCard = forwardRef(function StatCard(
  { className, label, value, icon, tone = 'neutral', delta, deltaStatus = 'neutral', hint, compact = false, ...props },
  ref
) {
  return (
    <Card ref={ref} className={cn(compact ? 'px-2.5 py-3 sm:p-4' : 'p-4', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-label text-secondary">{label}</p>
        {icon && (
          <IconTile
            icon={icon}
            tone={tone}
            size="sm"
            className={compact ? 'hidden sm:inline-flex' : undefined}
          />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p
          className={cn(
            'tabular min-w-0 truncate text-primary',
            compact ? 'text-h2 sm:text-display' : 'text-display'
          )}
        >
          {value}
        </p>
        {delta && <StatusPill status={deltaStatus}>{delta}</StatusPill>}
      </div>
      {hint && <p className="mt-1 text-label text-tertiary">{hint}</p>}
    </Card>
  )
})

export { StatCard }
