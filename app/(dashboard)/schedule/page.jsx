'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddAppointmentModal from '@/components/modals/AddAppointmentModal'
import { periodRange } from '@/components/schedule/appointment-list-modal'
import { STATUS_FILTERS, statusPill } from '@/components/schedule/status'
import { format, addDays, subDays } from 'date-fns'
import {
  Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle2, Trash2, Clock,
  ChevronDown, CalendarDays,
} from 'lucide-react'
import {
  Button, IconButton, Tooltip, Card, PageHeader, DateInput, Avatar, Eyebrow,
  DataTable, FilterBar, ConfirmDialog, useToast,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui'

const MAX_ROWS = 2000

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
]

function fmtTime(time) {
  return time ? format(new Date(`2000-01-01T${time}`), 'h:mm a') : '—'
}

export default function SchedulePage() {
  const supabase = createClient()
  const toast = useToast()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [viewMode, setViewMode] = useState('day')
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [periodAppointments, setPeriodAppointments] = useState([])
  const [periodLoading, setPeriodLoading] = useState(false)
  const [periodError, setPeriodError] = useState(null)

  async function loadAppointments() {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: qErr } = await supabase
        .from('appointments')
        .select('*, patients(name, phone)')
        .eq('clinic_id', user.id)
        .eq('date', selectedDate)
        .order('time')
      if (qErr) throw qErr
      setAppointments(data || [])
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  async function loadPeriodAppointments(period) {
    const { from, to } = periodRange(period)
    setPeriodLoading(true)
    setPeriodError(null)
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
      setPeriodAppointments(data || [])
    } catch (err) {
      setPeriodError(err)
    }
    setPeriodLoading(false)
  }

  useEffect(() => {
    if (viewMode === 'day') {
      loadAppointments()
    } else {
      loadPeriodAppointments(viewMode)
    }
  }, [selectedDate, viewMode])

  async function updateStatus(id, status, patientId) {
    await supabase.from('appointments').update({ status }).eq('id', id)

    if (status === 'completed' && patientId) {
      await supabase.from('patients')
        .update({ is_active: true })
        .eq('id', patientId)
    }

    if (viewMode === 'day') {
      loadAppointments()
    } else {
      loadPeriodAppointments(viewMode)
    }
    toast.success(`Marked ${status.replace('-', ' ')}`)
  }

  async function confirmDelete() {
    setDeleting(true)
    await supabase.from('appointments').delete().eq('id', pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
    if (viewMode === 'day') {
      loadAppointments()
    } else {
      loadPeriodAppointments(viewMode)
    }
    toast.success('Appointment deleted')
  }

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter)

  const periodFiltered = filter === 'all'
    ? periodAppointments
    : periodAppointments.filter(a => a.status === filter)

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')
  const range = viewMode !== 'day' ? periodRange(viewMode) : null

  const grouped = periodFiltered.reduce((acc, appt) => {
    if (!acc[appt.date]) acc[appt.date] = []
    acc[appt.date].push(appt)
    return acc
  }, {})

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentViewLabel = VIEW_OPTIONS.find(o => o.value === viewMode)?.label || 'Day'

  function rowActions(appt) {
    return (
      <div className="flex items-center justify-end gap-0.5">
        {appt.status === 'scheduled' && (
          <>
            <Tooltip label="Check in">
              <IconButton aria-label="Check in" size="sm" onClick={() => updateStatus(appt.id, 'checked-in', appt.patient_id)}>
                <Clock size={14} strokeWidth={1.75} />
              </IconButton>
            </Tooltip>
            <Tooltip label="Complete">
              <IconButton aria-label="Complete" size="sm" onClick={() => updateStatus(appt.id, 'completed', appt.patient_id)}>
                <CheckCircle2 size={14} strokeWidth={1.75} />
              </IconButton>
            </Tooltip>
          </>
        )}
        {appt.status === 'checked-in' && (
          <Tooltip label="Mark done">
            <IconButton aria-label="Mark done" size="sm" onClick={() => updateStatus(appt.id, 'completed', appt.patient_id)}>
              <CheckCircle2 size={14} strokeWidth={1.75} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip label="Delete">
          <IconButton aria-label="Delete appointment" size="sm" onClick={() => setPendingDelete(appt)}>
            <Trash2 size={14} strokeWidth={1.75} />
          </IconButton>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-content p-4 md:p-6">
      <PageHeader
        title="Schedule"
        subtitle="Manage all appointments"
        inlineActions
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" aria-label="View mode">
                  <CalendarDays size={15} strokeWidth={1.75} />
                  <span className="hidden sm:inline">{currentViewLabel}</span>
                  <ChevronDown size={13} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {VIEW_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onSelect={() => setViewMode(opt.value)}
                    className={opt.value === viewMode ? 'bg-accent-subtle text-accent-text' : undefined}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button aria-label="Add appointment" onClick={() => setShowModal(true)}>
              <Plus size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">Add appointment</span>
            </Button>
          </>
        }
      />

      {viewMode === 'day' && (
        <Card className="mb-4 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <IconButton
                aria-label="Previous day"
                variant="secondary"
                onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              >
                <ChevronLeft size={16} strokeWidth={1.75} />
              </IconButton>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-h3 text-primary">
                  {format(new Date(selectedDate), 'EEE, MMM d, yyyy')}
                </p>
                <p className="mt-0.5 text-label text-secondary">
                  {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <IconButton
                aria-label="Next day"
                variant="secondary"
                onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              >
                <ChevronRight size={16} strokeWidth={1.75} />
              </IconButton>
            </div>
            <div className="flex items-center gap-2">
              <DateInput
                aria-label="Jump to date"
                className="w-40"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <Button
                variant="secondary"
                disabled={isToday}
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              >
                Today
              </Button>
            </div>
          </div>
        </Card>
      )}

      {viewMode !== 'day' && range && (
        <Card className="mb-4 px-4 py-3">
          <p className="text-h3 text-primary">{range.label}</p>
          <p className="mt-0.5 text-label text-secondary">
            {periodFiltered.length} appointment{periodFiltered.length !== 1 ? 's' : ''}
            {periodAppointments.length === MAX_ROWS ? ` (first ${MAX_ROWS})` : ''}
          </p>
        </Card>
      )}

      <FilterBar
        value={filter}
        onChange={setFilter}
        options={STATUS_FILTERS}
        aria-label="Filter by status"
        className="mb-4"
      />

      {viewMode === 'day' ? (
        <Card>
          <DataTable
            columns={[
              { key: 'time', header: 'Time', tabular: true, sortable: true, cell: (a) => fmtTime(a.time) },
              {
                key: 'patient', header: 'Patient',
                cell: (a) => <span className="text-body-md text-primary">{a.patients?.name || '—'}</span>,
              },
              {
                key: 'phone', header: 'Phone', hideBelow: 'md', tabular: true,
                cell: (a) => a.patients?.phone || <span className="text-tertiary">—</span>,
              },
              {
                key: 'procedure', header: 'Procedure', hideBelow: 'sm',
                cell: (a) => <span className="text-secondary">{a.procedure || '—'}</span>,
              },
              { key: 'status', header: 'Status', cell: (a) => statusPill(a.status) },
              {
                key: 'notes', header: 'Notes', hideBelow: 'lg',
                cell: (a) => (
                  <span className="block max-w-cell truncate text-secondary">{a.notes || '—'}</span>
                ),
              },
              { key: 'actions', header: '', align: 'right', cell: rowActions },
            ]}
            data={filtered}
            loading={loading}
            error={error}
            onRetry={() => { setLoading(true); loadAppointments() }}
            emptyState={{
              icon: Calendar,
              title: filter === 'all' ? 'No appointments for this day' : 'No appointments match this filter',
              description: filter === 'all'
                ? 'Book one and it will appear here.'
                : 'Try a different status filter.',
              action: filter === 'all' && (
                <Button size="sm" onClick={() => setShowModal(true)}>
                  <Plus size={14} strokeWidth={1.75} /> Add appointment
                </Button>
              ),
            }}
            renderCard={(a) => (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-body-md text-primary">{a.patients?.name || '—'}</p>
                  <p className="mt-0.5 text-label text-secondary">
                    <span className="tabular">{fmtTime(a.time)}</span>
                    {a.procedure ? ` · ${a.procedure}` : ''}
                  </p>
                  <div className="mt-1.5">{statusPill(a.status)}</div>
                </div>
                {rowActions(a)}
              </div>
            )}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {periodLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent-text" />
            </div>
          ) : periodError ? (
            <div className="px-5 py-12 text-center">
              <p className="text-body-md text-primary">Could not load appointments</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => loadPeriodAppointments(viewMode)}>
                Try again
              </Button>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <Calendar size={32} strokeWidth={1.25} className="mb-3 text-tertiary" />
              <p className="text-body-md text-primary">
                {filter === 'all' ? `No appointments in ${range?.label}` : 'No appointments match this filter'}
              </p>
              <p className="mt-1 text-label text-secondary">
                {filter === 'all' ? 'Try a longer period or book an appointment.' : 'Try a different status filter.'}
              </p>
            </div>
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
                        <div className="flex items-center gap-2">
                          {statusPill(appt.status)}
                          {rowActions(appt)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(v) => { if (!v) setPendingDelete(null) }}
        title="Delete this appointment?"
        description={
          pendingDelete
            ? `${pendingDelete.patients?.name || 'This appointment'} · ${fmtTime(pendingDelete.time)}. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      {showModal && (
        <AddAppointmentModal
          defaultDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            if (viewMode === 'day') loadAppointments()
            else loadPeriodAppointments(viewMode)
          }}
        />
      )}
    </div>
  )
}
