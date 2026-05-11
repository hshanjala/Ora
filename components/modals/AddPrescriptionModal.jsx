'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Plus, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { searchMedicines } from '@/lib/medicines'

const CC_OPTIONS    = ['C/C', 'P/C', 'Hx', 'Complaint', 'Chief Complaint']
const OE_OPTIONS    = ['O/E', 'Dx', 'Findings', 'Ix', 'On Examination']
const ADV_OPTIONS   = ['Adv', 'Rx Note', 'Follow-up', 'Instructions', 'Plan']
const EXTRA_OPTIONS = ['BP', 'Weight', 'Temperature', 'Sugar Level', 'SpO2', 'Pulse', 'Referral', 'Investigation', 'Diet', 'Next Visit']
const FREQ_OPTIONS  = ['1+1+1', '1+0+1', '1+0+0', '0+1+0', '0+0+1', '1+1+0']
const DUR_OPTIONS   = ['3 days', '5 days', '7 days', '1 month']
const INSTR_OPTIONS = ['After meal', 'Before meal', 'Empty stomach']

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  return { open, setOpen, ref }
}

function LabelDropdown({ label, options, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors">
        {label} <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          {options.map(opt => (
            <button key={opt} type="button" onMouseDown={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-50 hover:text-emerald-700 ${label === opt ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Combo: free text input + dropdown button
function ComboInput({ value, onChange, options, placeholder }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <div className="flex">
        <input
          className="input text-sm rounded-r-none border-r-0 flex-1"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="border border-slate-200 border-l-0 rounded-r-xl px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
          {options.map(opt => (
            <button key={opt} type="button"
              onMouseDown={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-50 hover:text-emerald-700 border-b border-slate-50 last:border-0 ${
                value === opt ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'
              }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MedicineInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([])
  const [show, setShow] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  function handleChange(e) {
    const val = e.target.value
    onChange(val)
    if (val.length >= 2) { setSuggestions(searchMedicines(val)); setShow(true) }
    else { setSuggestions([]); setShow(false) }
  }
  function handleSelect(med) { onChange(med); setShow(false); setSuggestions([]) }
  return (
    <div ref={ref} className="relative">
      <input className="input text-sm w-full" placeholder="Type medicine name..."
        value={value} onChange={handleChange}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setShow(true)}
        autoComplete="off" />
      {show && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((med, i) => (
            <button key={i} type="button" onMouseDown={() => handleSelect(med)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 border-b border-slate-50 last:border-0 transition-colors">
              {med}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
      <MedicineInput value={med.medicine} onChange={val => onChange(index, 'medicine', val)} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Frequency</label>
          <ComboInput value={med.frequency} options={FREQ_OPTIONS}
            onChange={val => onChange(index, 'frequency', val)} placeholder="e.g. 1+1+1" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration</label>
          <ComboInput value={med.duration} options={DUR_OPTIONS}
            onChange={val => onChange(index, 'duration', val)} placeholder="e.g. 5 days" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Special Instructions</label>
        <ComboInput value={med.instructions} options={INSTR_OPTIONS}
          onChange={val => onChange(index, 'instructions', val)} placeholder="e.g. After meal..." />
      </div>
    </div>
  )
}

function AddFieldButton({ onAdd, existingLabels }) {
  const { open, setOpen, ref } = useDropdown()
  const available = EXTRA_OPTIONS.filter(o => !existingLabels.includes(o))
  return (
    <div ref={ref} className="relative flex items-center justify-center h-full border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
      onClick={() => setOpen(o => !o)}>
      <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 py-2">
        <Plus size={14} /> Add field
      </button>
      {open && available.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
          {available.map(opt => (
            <button key={opt} type="button" onMouseDown={() => { onAdd(opt); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 border-b border-slate-50 last:border-0 transition-colors text-slate-600">
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AddPrescriptionModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')

  const [ccLabel,  setCcLabel]  = useState('C/C')
  const [oeLabel,  setOeLabel]  = useState('O/E')
  const [advLabel, setAdvLabel] = useState('Adv')
  const [extraFields, setExtraFields] = useState([])

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
      const { data } = await supabase.from('patients').select('id, name')
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
  function addExtraField(label) {
    setExtraFields(prev => [...prev, { id: Date.now(), label, value: '' }])
  }
  function removeExtraField(id) {
    setExtraFields(prev => prev.filter(f => f.id !== id))
  }
  function updateExtraField(id, value) {
    setExtraFields(prev => prev.map(f => f.id === id ? { ...f, value } : f))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patient_id) { setError('Please select a patient'); return }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const extraNotes = extraFields.filter(f => f.value).map(f => `${f.label}: ${f.value}`).join('\n')
    const { data: rx, error: rxErr } = await supabase.from('prescriptions').insert({
      clinic_id: user.id,
      patient_id: form.patient_id,
      date: form.date,
      diagnosis: form.on_examination || null,
      chief_complaint: form.chief_complaint || null,
      advice: form.advice || null,
      notes: extraNotes || null,
    }).select().single()
    if (rxErr) { setError('Failed to create prescription.'); setLoading(false); return }
    const medItems = medicines.filter(m => m.medicine.trim()).map(m => ({
      prescription_id: rx.id,
      medicine: m.medicine,
      dosage: null,
      frequency: m.frequency || null,
      duration: m.duration || null,
      instructions: m.instructions || null,
    }))
    if (medItems.length > 0) await supabase.from('prescription_items').insert(medItems)
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

          {/* C/C and O/E */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1"><LabelDropdown label={ccLabel} options={CC_OPTIONS} onChange={setCcLabel} /></div>
              <textarea name="chief_complaint" className="input min-h-[72px] resize-none text-sm"
                placeholder="Chief complaint..." value={form.chief_complaint} onChange={handleFormChange} />
            </div>
            <div>
              <div className="mb-1"><LabelDropdown label={oeLabel} options={OE_OPTIONS} onChange={setOeLabel} /></div>
              <textarea name="on_examination" className="input min-h-[72px] resize-none text-sm"
                placeholder="Examination findings..." value={form.on_examination} onChange={handleFormChange} />
            </div>
          </div>

          {/* Adv + Add field */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1"><LabelDropdown label={advLabel} options={ADV_OPTIONS} onChange={setAdvLabel} /></div>
              <textarea name="advice" className="input min-h-[72px] resize-none text-sm"
                placeholder="Advice given to patient..." value={form.advice} onChange={handleFormChange} />
            </div>
            <div className="mt-6">
              <AddFieldButton onAdd={addExtraField} existingLabels={extraFields.map(f => f.label)} />
            </div>
          </div>

          {/* Extra fields */}
          {extraFields.length > 0 && (
            <div className="space-y-3">
              {extraFields.map(field => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="shrink-0 text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{field.label}:</span>
                  <input className="input text-sm flex-1" placeholder={`Enter ${field.label}...`}
                    value={field.value} onChange={e => updateExtraField(field.id, e.target.value)} />
                  <button type="button" onClick={() => removeExtraField(field.id)}
                    className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Medicines */}
          <div>
            <label className="label">Medicines</label>
            <div className="space-y-3">
              {medicines.map((med, i) => (
                <MedicineRow key={i} med={med} index={i}
                  onChange={handleMedChange} onRemove={removeMed}
                  disableRemove={medicines.length === 1} />
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
