'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AddPrescriptionModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    patient_id: '',
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

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patient_id) { setError('Please select a patient'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: rx, error: rxErr } = await supabase
      .from('prescriptions')
      .insert({
        clinic_id: user.id,
        patient_id: form.patient_id,
        date: form.date,
        diagnosis: form.diagnosis || null,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (rxErr) {
      setError('Failed to create prescription.')
      setLoading(false)
      return
    }

    const medItems = medicines
      .filter(m => m.medicine.trim())
      .map(m => ({ prescription_id: rx.id, ...m }))

    if (medItems.length > 0) {
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
            <div>
              <label className="label">Patient *</label>
              <select name="patient_id" className="input" value={form.patient_id} onChange={handleFormChange} required>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
