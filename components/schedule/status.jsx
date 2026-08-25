import { StatusPill } from '@/components/ui'

// One source of truth for appointment status presentation — previously
// duplicated as a statusBadge() switch in dashboard, schedule and invoices.
export const APPOINTMENT_STATUS = {
  scheduled: { label: 'Scheduled', status: 'info' },
  'checked-in': { label: 'Checked In', status: 'warning' },
  completed: { label: 'Completed', status: 'success' },
  cancelled: { label: 'Cancelled', status: 'danger' },
}

// Whole calendar periods, not rolling windows: a clinic browsing "this month"
// wants the appointments still to come as much as the ones already seen, which
// a trailing 30 days would hide.
export const PERIOD_FILTERS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
]

export const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'checked-in', label: 'Checked in' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function statusPill(status) {
  const cfg = APPOINTMENT_STATUS[status]
  return <StatusPill status={cfg?.status || 'neutral'}>{cfg?.label || status}</StatusPill>
}
