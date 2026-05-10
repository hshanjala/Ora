'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const FREQ_PILLS = ['1+1+1', '1+0+1', '1+0+0', '0+1+0', '0+0+1', '1+1+0']

function MedicineRow({ med, index, onChange, onRemove, disableRemove }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-600">Medicine {index + 1}</span>
        <button type="button" onClick={() => onRemove(index)} disabled={disableRemove}
          className="text-red-400 hover:text-red-600 disabled:opacity-30">
          <Trash2 size={14} />
        </button>
      </div>

      <input
        className="input text-sm"
        placeholder="Medicine name"
        value={med.medicine}
        onChange={e => onChange(index, 'medicine', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Frequency</label>
          <input
            className="input text-sm mb-1.5"
            placeholder="e.g. 1+1+1 or 3x daily"
            value={med.frequency}
            onChange={e => onChange(index, 'frequency', e.target.value)}
          />
          <div className="flex flex-wrap gap-1">
            {FREQ_PILLS.map(pill => (
              <button
                key={pill}
                type="button"
                onClick={() => onChange(index, 'frequency', pill)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  med.frequency === pill
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration</label>
          <input
            className="input text-sm"
            placeholder="e.g. 5 days"
            value={med.duration}
            onChange={e => onChange(index, 'duration', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Special Instructions</label>
        <input
          className="input text-sm"
          placeholder="e.g. After meal, At bedtime..."
          value={med.instructions}
          onChange={e => onChange(index, 'instructions', e.target.value)}
        />
      </div>
    </div>
  )
}

export default function AddPrescriptionModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    patient_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    chief_complaint: '',
    on_examination: '',
    advice: '',
  })

  const [medicines, setMedicines] = useState([
    { medicine: '', frequency: '', duration: '', instructions: '' }
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
    setMedicines(prev => [...prev, { medicine: '', frequency: '', duration: '', instructions: '' }])
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
        diagnosis: form.on_examination || null,
        chief_complaint: form.chief_complaint || null,
        advice: form.advice || null,
        notes: null,
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
      .map(m => ({
        prescription_id: rx.id,
        medicine: m.medicine,
        dosage: null,
        frequency: m.frequency || null,
        duration: m.duration || null,
        instructions: m.instructions || null,
      }))

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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Patient *</label>
              <select name="patient_id" className="input" value={form.patient_id} onChange={handleFormChange} required>
                <option value="">Select patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" value={form.date} onChange={handleFormChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="label !mb-0">C/C</label>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Chief Complaint</span>
              </div>
              <textarea
                name="chief_complaint"
                className="input min-h-[72px] resize-none text-sm"
                placeholder="What is the patient complaining of..."
                value={form.chief_complaint}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="label !mb-0">O/E</label>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">On Examination</span>
              </div>
              <textarea
                name="on_examination"
                className="input min-h-[72px] resize-none text-sm"
                placeholder="Examination findings..."
                value={form.on_examination}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="label !mb-0">Adv</label>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Advice</span>
            </div>
            <textarea
              name="advice"
              className="input min-h-[56px] resize-none text-sm"
              placeholder="Advice given to patient..."
              value={form.advice}
              onChange={handleFormChange}
            />
          </div>

          <div>
            <label className="label">Medicines</label>
            <div className="space-y-3">
              {medicines.map((med, i) => (
                <MedicineRow
                  key={i}
                  med={med}
                  index={i}
                  onChange={handleMedChange}
                  onRemove={removeMed}
                  disableRemove={medicines.length === 1}
                />
              ))}
            </div>
            <button type="button" onClick={addMed}
              className="mt-3 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold hover:text-emerald-700">
              <Plus size={16} /> Add Medicine
            </button>
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
