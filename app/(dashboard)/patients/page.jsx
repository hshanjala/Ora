'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddPatientModal from '@/components/modals/AddPatientModal'
import PatientPanel from '@/components/PatientPanel'
import AddPrescriptionModal from '@/components/modals/AddPrescriptionModal'
import CreateInvoiceModal from '@/components/modals/CreateInvoiceModal'
import { Plus, Search, User, Phone, Mail, Trash2, Users, Pill, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function PatientsPage() {
  const supabase = createClient()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [rxPatient, setRxPatient] = useState(null)
  const [invoicePatient, setInvoicePatient] = useState(null)

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

  async function deletePatient(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this patient and all their data? This cannot be undone.')) return
    await supabase.from('patients').delete().eq('id', id)
    if (selectedPatient?.id === id) setSelectedPatient(null)
    loadPatients()
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Patients</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Add Patient
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

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
                <tr
                  key={patient.id}
                  className="table-tr cursor-pointer"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <User size={16} className="text-emerald-600" />
                      </div>
                      <span className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors">
                        {patient.name}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {patient.phone ? <><Phone size={13} />{patient.phone}</> : '—'}
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {patient.email
                        ? <><Mail size={13} /><span className="truncate max-w-[140px]">{patient.email}</span></>
                        : '—'}
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
                        onClick={e => { e.stopPropagation(); setRxPatient(patient) }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="New Prescription"
                      >
                        <Pill size={15} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setInvoicePatient(patient) }}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        title="New Invoice"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        onClick={e => deletePatient(e, patient.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <PatientPanel
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {rxPatient && (
        <AddPrescriptionModal
          patientId={rxPatient.id}
          patientName={rxPatient.name}
          onClose={() => setRxPatient(null)}
          onSuccess={() => setRxPatient(null)}
        />
      )}

      {invoicePatient && (
        <CreateInvoiceModal
          patientId={invoicePatient.id}
          patientName={invoicePatient.name}
          onClose={() => setInvoicePatient(null)}
          onSuccess={() => setInvoicePatient(null)}
        />
      )}
    </div>
  )
}
