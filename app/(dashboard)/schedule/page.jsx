'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddAppointmentModal from '@/components/modals/AddAppointmentModal'
import { format, addDays, subDays } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function SchedulePage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filter, setFilter] = useState('all')

  async function loadAppointments() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('appointments')
      .select('*, patients(name, phone)')
      .eq('clinic_id', user.id)
      .eq('date', selectedDate)
      .order('time')
    setAppointments(data || [])
    setLoading(false)
  }

  useEffect(() => { loadAppointments() }, [selectedDate])

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    loadAppointments()
  }

  async function deleteAppointment(id) {
    if (!confirm('Delete this appointment?')) return
    await supabase.from('appointments').delete().eq('id', id)
    loadAppointments()
  }

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter)

  function statusBadge(status) {
    const map = {
      scheduled: <span className="badge-blue">Scheduled</span>,
      'checked-in': <span className="badge-yellow">Checked In</span>,
      completed: <span className="badge-green">Completed</span>,
      cancelled: <span className="badge-red">Cancelled</span>,
    }
    return map[status] || <span className="badge-gray">{status}</span>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Schedule</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all appointments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} /> Add Appointment
        </button>
      </div>

      {/* Date Navigator */}
      <div className="card mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <p className="font-bold text-slate-800 text-lg">
              {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-slate-500">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <input
            type="date"
            className="input w-40"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <button
            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            className="btn-secondary"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'scheduled', 'checked-in', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No appointments for this day</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
              <Plus size={16} /> Add Appointment
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-th">Time</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Procedure</th>
                <th className="table-th">Status</th>
                <th className="table-th">Notes</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(appt => (
                <tr key={appt.id} className="table-tr">
                  <td className="table-td font-bold text-slate-600 whitespace-nowrap">
                    {appt.time ? format(new Date(`2000-01-01T${appt.time}`), 'h:mm a') : '—'}
                  </td>
                  <td className="table-td font-semibold">{appt.patients?.name || '—'}</td>
                  <td className="table-td text-slate-500">{appt.patients?.phone || '—'}</td>
                  <td className="table-td">{appt.procedure || '—'}</td>
                  <td className="table-td">{statusBadge(appt.status)}</td>
                  <td className="table-td text-slate-500 max-w-[150px] truncate">{appt.notes || '—'}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {appt.status === 'scheduled' && (
                        <>
                          <button onClick={() => updateStatus(appt.id, 'checked-in')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Check In"><CheckCircle size={16} /></button>
                          <button onClick={() => updateStatus(appt.id, 'completed')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Complete"><Clock size={16} /></button>
                        </>
                      )}
                      {appt.status === 'checked-in' && (
                        <button onClick={() => updateStatus(appt.id, 'completed')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Mark Done"><CheckCircle size={16} /></button>
                      )}
                      <button onClick={() => deleteAppointment(appt.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete"><XCircle size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
