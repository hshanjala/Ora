'use client'
import { useEffect, useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Modal, ModalContent, ModalHeader, ModalBody,
  Button, DateInput, Label, FilterBar, Avatar, StatusPill,
  EmptyState, ErrorState, SpinnerBlock, Eyebrow,
} from '@/components/ui'
import { STATUS_FILTERS, statusPill } from './status'

// Browse appointments across a date range, grouped by day.
export default function AppointmentListModal({ open, onOpenChange }) {
  const supabase = createClient()
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  async function load() {
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
      if (qErr) throw qErr
      setAppointments(data || [])
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) load()
  }, [open])

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
          subtitle={`${filtered.length} appointment${filtered.length !== 1 ? 's' : ''} in this range`}
        />

        <div className="space-y-3 border-b px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0">
              <Label htmlFor="range-from">From</Label>
              <DateInput id="range-from" className="mt-1 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="min-w-0">
              <Label htmlFor="range-to">To</Label>
              <DateInput id="range-to" className="mt-1 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button variant="secondary" onClick={load} loading={loading}>Apply</Button>
          </div>
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
              title="No appointments in this range"
              description="Try widening the dates or clearing the status filter."
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
