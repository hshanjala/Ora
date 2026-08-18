'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddAppointmentModal from '@/components/modals/AddAppointmentModal'
import AppointmentListModal from '@/components/schedule/appointment-list-modal'
import { STATUS_FILTERS, statusPill } from '@/components/schedule/status'
import { format, addDays, subDays } from 'date-fns'
import {
  Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle2, Trash2, Clock, List,
} from 'lucide-react'
import {
  Button, IconButton, Tooltip, Card, PageHeader, DateInput,
  DataTable, FilterBar, ConfirmDialog, useToast,
} from '@/components/ui'

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
  const [showList, setShowList] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  useEffect(() => { loadAppointments() }, [selectedDate])

  async function updateStatus(id, status, patientId) {
    await supabase.from('appointments').update({ status }).eq('id', id)

    if (status === 'completed' && patientId) {
      await supabase.from('patients')
        .update({ is_active: true })
        .eq('id', patientId)
    }

    loadAppointments()
    toast.success(`Marked ${status.replace('-', ' ')}`)
  }

  async function confirmDelete() {
    setDeleting(true)
    await supabase.from('appointments').delete().eq('id', pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
    loadAppointments()
    toast.success('Appointment deleted')
  }

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter)

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')

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
            <Button variant="secondary" onClick={() => setShowList(true)}>
              <List size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">All appointments</span>
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">Add appointment</span>
            </Button>
          </>
        }
      />

      {/* Day navigator */}
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

      <FilterBar
        value={filter}
        onChange={setFilter}
        options={STATUS_FILTERS}
        aria-label="Filter by status"
        className="mb-4"
      />

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

      <AppointmentListModal open={showList} onOpenChange={setShowList} />

      {showModal && (
        <AddAppointmentModal
          defaultDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSuccess={loadAppointments}
        />
      )}
    </div>
  )
}
