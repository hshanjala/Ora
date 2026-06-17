'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddAppointmentModal from '@/components/modals/AddAppointmentModal'
import { format, addDays, subDays } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock, List, X } from 'lucide-react'

export default function SchedulePage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filter, setFilter] = useState('all')

  const [showList, setShowList] = useState(false)
  const [listFrom, setListFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [listTo, setListTo] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [listAppointments, setListAppointments] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [listFilter, setListFilter] = useState('all')

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

  async function loadListAppointments() {
    setListLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('appointments')
      .select('*, patients(name, phone)')
      .eq('clinic_id', user.id)
      .gte('date', listFrom)
      .lte('date', listTo)
      .order('date')
      .order('time')
    setListAppointments(data || [])
    setListLoading(false)
  }

  useEffect(() => { loadAppointments() }, [selectedDate])

  useEffect(() => {
    if (showList) loadListAppointments()
  }, [showList])

  async function updateStatus(id, status, patientId) {
    await supabase.from('appointments').update({ status }).eq('id', id)

    if (status === 'completed' && patientId) {
      await supabase.from('patients')
        .update({ is_active: true })
        .eq('id', patientId)
    }

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

  const filteredList = listFilter === 'all'
    ? listAppointments
    : listAppointments.filter(a => a.status === listFilter)

  const grouped = filteredList.reduce((acc, appt) => {
    const d = appt.date
    if (!acc[d]) acc[d] = []
    acc[d].push(appt)
    return acc
  }, {})

  const today = format(new Date(), 'yyyy-MM-dd')

  function statusBadge(status) {
    const map = {
      scheduled: <span className="badge-blue">Scheduled</span>,
      'checked-in': <span className="badge-yellow">Checked In</span>,
      completed: <span className="badge-green">Completed</span>,
      cancelled: <span className="badge-red">Cancelled</span>,
    }
    return map[status] || <span className="badge-gray">{status}</span>
  }

  function initials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const COLORS = [
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#e0e7ff', text: '#3730a3' },
  ]
  function avatarColor(name) {
    const i = (name || '').charCodeAt(0) % COLORS.length
    return COLORS[i]
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800">Schedule</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all appointments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} /> <span className="hidden sm:inline">Add Appointment</span>
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Date nav row */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 text-center">
              <p className="font-bold text-slate-800 text-sm md:text-lg">
                {format(new Date(selectedDate), 'EEE, MMM d, yyyy')}
              </p>
              <p className="text-xs text-slate-500">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {/* Controls row */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <input
              type="date"
              className="input w-36 sm:w-40 text-sm"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="btn-secondary !px-3 !py-2 text-xs"
            >
              Today
            </button>
            <button
              onClick={() => setShowList(true)}
              className="btn-secondary !px-3 !py-2 text-xs flex items-center gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            >
              <List size={15} /> List
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'scheduled', 'checked-in', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors capitalize ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-th">Time</th>
                  <th className="table-th">Patient</th>
                  <th className="table-th hidden sm:table-cell">Phone</th>
                  <th className="table-th hidden md:table-cell">Procedure</th>
                  <th className="table-th">Status</th>
                  <th className="table-th hidden lg:table-cell">Notes</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(appt => (
                  <tr key={appt.id} className="table-tr">
                    <td className="table-td font-bold text-slate-600 whitespace-nowrap">
                      {appt.time ? format(new Date(`2000-01-01T${appt.time}`), 'h:mm a') : '—'}
                    </td>
                    <td className="table-td">
                      <div className="font-semibold">{appt.patients?.name || '—'}</div>
                      <div className="text-xs text-slate-400 md:hidden">{appt.procedure || ''}</div>
                    </td>
                    <td className="table-td text-slate-500 hidden sm:table-cell">{appt.patients?.phone || '—'}</td>
                    <td className="table-td hidden md:table-cell">{appt.procedure || '—'}</td>
                    <td className="table-td">{statusBadge(appt.status)}</td>
                    <td className="table-td text-slate-500 max-w-[150px] truncate hidden lg:table-cell">{appt.notes || '—'}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        {appt.status === 'scheduled' && (
                          <>
                            <button onClick={() => updateStatus(appt.id, 'checked-in', appt.patient_id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Check In"><CheckCircle size={16} /></button>
                            <button onClick={() => updateStatus(appt.id, 'completed', appt.patient_id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Complete"><Clock size={16} /></button>
                          </>
                        )}
                        {appt.status === 'checked-in' && (
                          <button onClick={() => updateStatus(appt.id, 'completed', appt.patient_id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Mark Done"><CheckCircle size={16} /></button>
                        )}
                        <button onClick={() => deleteAppointment(appt.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete"><XCircle size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showList && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <p className="font-bold text-slate-800 text-lg">All Appointments</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-500">From</span>
                <input type="date" className="input w-36 text-sm" value={listFrom}
                  onChange={e => setListFrom(e.target.value)} />
                <span className="text-sm text-slate-500">To</span>
                <input type="date" className="input w-36 text-sm" value={listTo}
                  onChange={e => setListTo(e.target.value)} />
                <button onClick={loadListAppointments} className="btn-primary !py-2 !px-4 text-sm">Apply</button>
                <button onClick={() => setShowList(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {['all', 'scheduled', 'checked-in', 'completed', 'cancelled'].map(f => (
                  <button key={f} onClick={() => setListFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
                      listFilter === f
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-sm text-slate-400">{filteredList.length} appointment{filteredList.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {listLoading ? (
                <div className="flex justify-center py-12"><div className="spinner" /></div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-16">
                  <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No appointments in this range</p>
                </div>
              ) : (
                Object.keys(grouped).sort().map(date => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-bold whitespace-nowrap ${date === today ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {date === today ? 'Today, ' : ''}{format(new Date(date), 'EEE, MMM d')}
                      </span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      {grouped[date].map((appt, i) => {
                        const color = avatarColor(appt.patients?.name)
                        return (
                          <div key={appt.id}
                            className={`flex items-center gap-3 px-4 py-3 ${i < grouped[date].length - 1 ? 'border-b border-slate-50' : ''}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: color.bg, color: color.text }}>
                              {initials(appt.patients?.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm">{appt.patients?.name || '—'}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {appt.procedure || 'General'} · {appt.time ? format(new Date(`2000-01-01T${appt.time}`), 'h:mm a') : '—'}
                                {appt.patients?.phone && <> · {appt.patients.phone}</>}
                              </p>
                            </div>
                            {statusBadge(appt.status)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
