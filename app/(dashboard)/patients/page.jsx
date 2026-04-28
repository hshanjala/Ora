'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddPatientModal from '@/components/modals/AddPatientModal'
import { Plus, Search, User, Phone, Mail, Trash2, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'

function PatientDetailModal({ patient, onClose }) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    async function load() {
      const { data: appts } = await supabase
        .from('appointments').select('*')
        .eq('patient_id', patient.id)
        .order('date', { ascending: false }).limit(5)
      setAppointments(appts || [])

      const { data: invs } = await supabase
        .from('invoices').select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false }).limit(5)
      setInvoices(invs || [])
    }
    load()
  }, [patient.id])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <User size={24} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                <p className="text-sm text-slate-500">
                  {patient.gender} {patient.age ? `• Age ${patient.age}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {patient.phone && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                <p className="font-semibold text-sm">{patient.phone}</p>
              </div>
            )}
            {patient.email && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="font-semibold text-sm truncate">{patient.email}</p>
              </div>
            )}
            {patient.address && (
              <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Address</p>
                <p className="font-semibold text-sm">{patient.address}</p>
              </div>
            )}
            {patient.medical_history && (
              <div className="bg-amber-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-amber-600 font-semibold mb-0.5">Medical History</p>
                <p className="text-sm text-slate-700">{patient.medical_history}</p>
              </div>
            )}
          </div>

          {appointments.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-bold text-slate-700 mb-2">Recent Appointments</p>
              <div className="space-y-1.5">
                {appointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span>{format(new Date(a.date), 'MMM d, yyyy')} — {a.procedure || 'N/A'}</span>
                    <span className={`text-xs font-semibold ${a.status === 'completed' ? 'text-emerald-600' : a.status === 'cancelled' ? 'text-red-500' : 'text-blue-600'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoices.length > 0 && (
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Recent Invoices</p>
              <div className="space-y-1.5">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span>{inv.invoice_number} — {format(new Date(inv.date), 'MMM d, yyyy')}</span>
                    <span className="font-semibold text-slate-700">৳{inv.total?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const supabase = createClient()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  async function loadPatients() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', user.id)
      .order('created_at', { ascending: false })
    setPatients(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPatients() }, [])

  async function deletePatient(id) {
    if (!confirm('Delete this patient and all their data? This cannot be undone.')) return
    await supabase.from('patients').delete().eq('id', id)
    loadPatients()
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Patients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{patients.length} patient{patients.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Patients Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              {search ? 'No patients match your search' : 'No patients yet'}
            </p>
            {!search && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={16} /> Add First Patient
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-th">Patient</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Email</th>
                <th className="table-th">Gender</th>
                <th className="table-th">Age</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(patient => (
                <tr key={patient.id} className="table-tr cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <User size={16} className="text-emerald-600" />
                      </div>
                      <span className="font-semibold text-slate-800">{patient.name}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {patient.phone ? <><Phone size={13} />{patient.phone}</> : '—'}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {patient.email ? <><Mail size={13} /><span className="truncate max-w-[150px]">{patient.email}</span></> : '—'}
                    </div>
                  </td>
                  <td className="table-td text-slate-500">{patient.gender || '—'}</td>
                  <td className="table-td text-slate-500">
                    {patient.age ? `${patient.age} yrs` : '—'}
                  </td>
                  <td className="table-td text-slate-400 text-xs">
                    {format(new Date(patient.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="table-td" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <Calendar size={15} />
                      </button>
                      <button
                        onClick={() => deletePatient(patient.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadPatients}
        />
      )}

      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  )
}
