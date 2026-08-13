'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './card'
import { IconTile } from './icon-tile'
import { StatusPill } from './badge'

// Label + big tabular number + optional delta chip + IconTile.
// Muted gray label over strong near-black value: contrast from weight and
// color, never size alone.
const StatCard = forwardRef(function StatCard(
  { className, label, value, icon, tone = 'neutral', delta, deltaStatus = 'neutral', hint, ...props },
  ref
) {
  return (
    <Card ref={ref} className={cn('p-4', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-label text-secondary">{label}</p>
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="tabular text-display text-primary">{value}</p>
        {delta && <StatusPill status={deltaStatus}>{delta}</StatusPill>}
      </div>
      {hint && <p className="mt-1 text-label text-tertiary">{hint}</p>}
    </Card>
  )
})

export { StatCard }
