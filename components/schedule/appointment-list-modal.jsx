'use client'
import { useEffect, useState } from 'react'
import {
  format,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
} from 'date-fns'
import { Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Modal, ModalContent, ModalHeader, ModalBody,
  Button, FilterBar, Avatar,
  EmptyState, ErrorState, SpinnerBlock, Eyebrow,
} from '@/components/ui'
import { PERIOD_FILTERS, STATUS_FILTERS, statusPill } from './status'

const ISO = (d) => format(d, 'yyyy-MM-dd')

// A year of a busy clinic is a few thousand rows, each joined to a patient.
// Capped so the modal cannot pull an unbounded payload onto a phone; the header
// says plainly when the cap is reached rather than quietly showing less.
const MAX_ROWS = 2000

/** Whole calendar week / month / year containing `now`. */
export function periodRange(period, now = new Date()) {
  if (period === 'week') {
    return {
      from: ISO(startOfWeek(now, { weekStartsOn: 0 })),
      to: ISO(endOfWeek(now, { weekStartsOn: 0 })),
      label: `${format(startOfWeek(now, { weekStartsOn: 0 }), 'MMM d')} – ${format(endOfWeek(now, { weekStartsOn: 0 }), 'MMM d, yyyy')}`,
    }
  }
  if (period === 'year') {
    return {
      from: ISO(startOfYear(now)),
      to: ISO(endOfYear(now)),
      label: format(now, 'yyyy'),
    }
  }
  return {
    from: ISO(startOfMonth(now)),
    to: ISO(endOfMonth(now)),
    label: format(now, 'MMMM yyyy'),
  }
}

// Browse appointments across a whole week, month or year, grouped by day.
export default function AppointmentListModal({ open, onOpenChange }) {
  const supabase = createClient()
  const [period, setPeriod] = useState('month')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const range = periodRange(period)

  async function load(forPeriod = period) {
    const { from, to } = periodRange(forPeriod)
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: qErr } = await supabase
        .from('appointments')
        .select('*, patients(name, phone)')
        .eq('clinic_id', user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date')
        .order('time')
        .limit(MAX_ROWS)
      if (qErr) throw qErr
      setAppointments(data || [])
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) load(period)
  }, [open, period])

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter)

  const grouped = filtered.reduce((acc, appt) => {
    if (!acc[appt.date]) acc[appt.date] = []
    acc[appt.date].push(appt)
    return acc
  }, {})

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader
          title="All appointments"
          subtitle={
            `${range.label} · ${filtered.length} appointment${filtered.length !== 1 ? 's' : ''}` +
            (appointments.length === MAX_ROWS ? ` (first ${MAX_ROWS})` : '')
          }
        />

        <div className="space-y-3 border-b px-5 py-3">
          <FilterBar
            value={period}
            onChange={setPeriod}
            options={PERIOD_FILTERS}
            aria-label="Filter by period"
          />
          <FilterBar
            value={filter}
            onChange={setFilter}
            options={STATUS_FILTERS}
            aria-label="Filter by status"
          />
        </div>

        <ModalBody className="p-0">
          {loading ? (
            <SpinnerBlock />
          ) : error ? (
            <ErrorState
              title="Could not load appointments"
              action={<Button variant="secondary" size="sm" onClick={load}>Try again</Button>}
            />
          ) : Object.keys(grouped).length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={`No appointments in ${range.label}`}
              description="Try a longer period or clear the status filter."
            />
          ) : (
            <div className="divide-y">
              {Object.keys(grouped).sort().map(date => (
                <div key={date}>
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-surface-subtle px-5 py-2">
                    <Eyebrow className={date === today ? 'text-accent-text' : undefined}>
                      {date === today ? 'Today · ' : ''}
                      {format(new Date(date + 'T00:00:00'), 'EEE, MMM d')}
                    </Eyebrow>
                  </div>
                  <ul>
                    {grouped[date].map(appt => (
                      <li key={appt.id} className="flex items-center gap-3 border-b px-5 py-2.5 last:border-0">
                        <Avatar name={appt.patients?.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body-md text-primary">
                            {appt.patients?.name || '—'}
                          </p>
                          <p className="mt-0.5 truncate text-label text-tertiary">
                            {appt.procedure || 'General'}
                            {' · '}
                            <span className="tabular">
                              {appt.time ? format(new Date(`2000-01-01T${appt.time}`), 'h:mm a') : '—'}
                            </span>
                            {appt.patients?.phone && <> · <span className="tabular">{appt.patients.phone}</span></>}
                          </p>
                        </div>
                        {statusPill(appt.status)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
