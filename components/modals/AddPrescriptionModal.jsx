'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AddPrescriptionModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [patientQuery, setPatientQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    diagnosis: '',
    notes: '',
  })
  const [medicines, setMedicines] = useState([
    { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ])

  useEffect(() => {
    async function loadPatients() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('patients').select('id, name')
        .eq('clinic_id', user.id).order('name')
      setPatients(data || [])
    }
    loadPatients()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePatientInput(e) {
    setPatientQuery(e.target.value)
    setSelectedPatientId(null)
    setShowSuggestions(true)
  }

  function handleSelectPatient(patient) {
    setPatientQuery(patient.name)
    setSelectedPatientId(patient.id)
    setShowSuggestions(false)
  }

  function handleMedChange(index, field, value) {
    setMedicines(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function addMed() {
    setMedicines(prev => [...prev, { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  function removeMed(index) {
    if (medicines.length === 1) return
    setMedicines(prev => prev.filter((_, i) => i !== index))
  }

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientQuery.toLowerCase())
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!patientQuery.trim()) { setError('Please enter a patient name.'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    let patientId = selectedPatientId
    if (!patientId && patientQuery.trim()) {
      const { data: newPatient } = await supabase
        .from('patients')
        .insert({ clinic_id: user.id, name: patientQuery.trim() })
        .select().single()
      patientId = newPatient?.id || null
    }

    const { data: rx, error: rxErr } = await supabase
      .from('prescriptions')
      .insert({
        clinic_id: user.id,
        patient_id: patientId,
        date: form.date,
        diagnosis: form.diagnosis || null,
        notes: form.notes || null,
      })
      .select().single()

    if (rxErr) {
      setError('Failed to create prescription.')
      setLoading(false)
      return
    }

    const hasMeds = medicines.some(m => m.medicine.trim())
    if (rx && hasMeds) {
      const medItems = medicines
        .filter(m => m.medicine.trim())
        .map(m => ({ prescription_id: rx.id, ...m }))
      await supabase.from('prescription_items').insert(medItems)
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">New Prescription</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            {/* Patient combobox */}
            <div className="relative">
              <label className="label">Patient *</label>
              <input
                ref={inputRef}
                type="text"
                className="input"
                placeholder="Type patient name..."
                value={patientQuery}
                onChange={handlePatientInput}
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
              />
              {showSuggestions && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto"
                >
                  {filteredPatients.length > 0 ? (
                    <>
                      {filteredPatients.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors first:rounded-t-xl last:rounded-b-xl font-medium"
                        >
                          {p.name}
                        </button>
                      ))}
                      {patientQuery.trim() &&
                        !filteredPatients.some(p => p.name.toLowerCase() === patientQuery.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => setShowSuggestions(false)}
                            className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 border-t border-slate-100 transition-colors last:rounded-b-xl font-semibold"
                          >
                            + Add &quot;{patientQuery}&quot; as new patient
                          </button>
                        )}
                    </>
                  ) : patientQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors rounded-xl font-semibold"
                    >
                      + Add &quot;{patientQuery}&quot; as new patient
                    </button>
                  ) : (
                    <p className="px-4 py-3 text-sm text-slate-400">Start typing to search patients...</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" value={form.date} onChange={handleFormChange} />
            </div>

            <div className="col-span-2">
              <label className="label">Diagnosis</label>
              <input name="diagnosis" className="input" placeholder="e.g. Dental Caries, Gum Disease..." value={form.diagnosis} onChange={handleFormChange} />
            </div>
          </div>

          {/* Medicines */}
          <div>
            <label className="label">Medicines</label>
            <div className="space-y-3">
              {medicines.map((med, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Medicine {i + 1}</span>
                    <button type="button" onClick={() => removeMed(i)} disabled={medicines.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <input className="input text-sm" placeholder="Medicine name" value={med.medicine} onChange={e => handleMedChange(i, 'medicine', e.target.value)} />
                    </div>
                    <input className="input text-sm" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={e => handleMedChange(i, 'dosage', e.target.value)} />
                    <input className="input text-sm" placeholder="Frequency (e.g. 3x daily)" value={med.frequency} onChange={e => handleMedChange(i, 'frequency', e.target.value)} />
                    <input className="input text-sm" placeholder="Duration (e.g. 5 days)" value={med.duration} onChange={e => handleMedChange(i, 'duration', e.target.value)} />
                    <input className="input text-sm" placeholder="Special instructions" value={med.instructions} onChange={e => handleMedChange(i, 'instructions', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addMed} className="mt-2 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold hover:text-emerald-700">
              <Plus size={16} /> Add Medicine
            </button>
          </div>

          <div>
            <label className="label">Doctor&apos;s Notes</label>
            <textarea name="notes" className="input min-h-[70px] resize-none" placeholder="Additional instructions for patient..." value={form.notes} onChange={handleFormChange} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
