'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildPrintHtml } from '@/lib/buildPrescriptionPrint'
import { format } from 'date-fns'
import {
  X, ChevronRight, ChevronLeft, Check,
  User, Calendar, Pill, FileText, Plus, Trash2, Loader2, SkipForward, Camera, Printer, Phone, ChevronDown
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Patient',      icon: User },
  { id: 2, label: 'Schedule',     icon: Calendar },
  { id: 3, label: 'Prescription', icon: Pill },
  { id: 4, label: 'Invoice',      icon: FileText },
]

const FREQ_OPTIONS  = ['1+1+1', '1+0+1', '1+0+0', '0+1+0', '0+0+1', '1+1+0']
const DUR_OPTIONS   = ['3 days', '5 days', '7 days', '1 month']
const INSTR_OPTIONS = ['After meal', 'Before meal', 'Empty stomach']
const CC_OPTIONS    = ['C/C', 'P/C', 'Hx', 'Complaint', 'Chief Complaint']
const OE_OPTIONS    = ['O/E', 'Dx', 'Findings', 'Ix', 'On Examination', 'Investigation']
const ADV_OPTIONS   = ['Adv', 'Rx Note', 'Follow-up', 'Instructions', 'Plan']
const EXTRA_OPTIONS = ['BP', 'Weight', 'Temperature', 'Sugar Level', 'SpO2', 'Pulse', 'Referral', 'Investigation', 'Diet', 'Next Visit']

function LabelDropdown({ label, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors">
        {label}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          {options.map(opt => (
            <button key={opt} type="button"
              onMouseDown={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-50 hover:text-emerald-700 ${
                label === opt ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'
              }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function HoverDropdown({ value, onChange, options, placeholder }) {
  const [show, setShow] = useState(false)
  const ref = useRef(null)
  return (
    <div ref={ref} className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <input
        className="input text-sm w-full"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 100)}
        autoComplete="off"
      />
      {show && options.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
          {options.map(opt => (
            <button key={opt} type="button"
              onMouseDown={() => { onChange(opt); setShow(false) }}
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

function AddFieldButton({ onAdd, existingLabels }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const available = EXTRA_OPTIONS.filter(o => !existingLabels.includes(o))
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
        <Plus size={14} /> Add field
      </button>
      {open && available.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
          {available.map(opt => (
            <button key={opt} type="button"
              onMouseDown={() => { onAdd(opt); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 border-b border-slate-50 last:border-0 transition-colors text-slate-600">
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
    if (val.length >= 2) {
      fetch(`/api/medicines?q=${encodeURIComponent(val)}`)
        .then(r => r.json())
        .then(results => { setSuggestions(results); setShow(true) })
        .catch(() => {})
    }
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

function StepHeader({ step, onClose }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-1.5 mb-5">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done  = step > s.id
          const active = step === s.id
          return (
            <div key={s.id} className="flex items-center gap-1.5 flex-1 last:flex-none">
              <div className={`flex items-center gap-1.5 ${active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors
                  ${done  ? 'bg-emerald-500 text-white'
                  : active ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'}`}>
                  {done ? <Check size={13} /> : <Icon size={13} />}
                </div>
                <span className={`text-xs font-semibold hidden sm:block
                  ${active ? 'text-emerald-700' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors
                  ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Step {step} of {STEPS.length}
          </p>
          <h2 className="text-xl font-black text-slate-800">
            {step === 1 && 'Add Patient'}
            {step === 2 && 'Book Appointment'}
            {step === 3 && 'Write Prescription'}
            {step === 4 && 'Create Invoice'}
          </h2>
        </div>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

function StepFooter({ step, onBack, onNext, onSkip, onFinish, loading, nextLabel }) {
  return (
    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
      <div>
        {step > 1 && (
          <button onClick={onBack} className="btn-secondary !py-2">
            <ChevronLeft size={16} /> Back
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {step > 1 && onSkip && (
          <button onClick={onSkip} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors">
            <SkipForward size={15} /> Skip
          </button>
        )}
        {step < 4 ? (
          <button onClick={onNext} disabled={loading} className="btn-primary !py-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {nextLabel || 'Next'} <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={onFinish} disabled={loading} className="btn-primary !py-2 bg-emerald-600">
            {loading && <Loader2 size={15} className="animate-spin" />}
            <Check size={15} /> Finish
          </button>
        )}
      </div>
    </div>
  )
}

function Step1Patient({ form, setForm, error, photoPreview, onPhotoChange }) {
  const photoRef = useRef(null)
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  return (
    <div className="p-4 sm:p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => photoRef.current?.click()}
          className="shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-slate-300 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 transition-colors overflow-hidden">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-full" />
          ) : (
            <>
              <Camera size={20} className="text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Add Photo</span>
            </>
          )}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
        <div className="flex-1">
          <label className="label">Full Name *</label>
          <input name="name" className="input" placeholder="Patient's full name" value={form.name} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" placeholder="01XXXXXXXXX" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" placeholder="patient@email.com" value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Age</label>
          <input name="age" type="number" min="0" max="120" className="input" placeholder="e.g. 35" value={form.age} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select name="gender" className="input" value={form.gender} onChange={handleChange}>
            <option value="">Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input name="address" className="input" placeholder="Full address" value={form.address} onChange={handleChange} />
        </div>
        <div className="col-span-2">
          <label className="label">Referred by</label>
          <input name="referred_by" className="input" placeholder="Doctor or clinic name" value={form.referred_by} onChange={handleChange} />
        </div>
        <div className="col-span-2">
          <label className="label">Medical History / Allergies</label>
          <textarea name="medical_history" className="input min-h-[70px] resize-none" placeholder="Allergies, chronic conditions, previous treatments..." value={form.medical_history} onChange={handleChange} />
        </div>
      </div>
    </div>
  )
}

function Step2Schedule({ form, setForm, patientName }) {
  const PROCEDURES = [
    'General Checkup','Cleaning & Scaling','Tooth Extraction',
    'Root Canal','Filling','Crown & Bridge','Teeth Whitening',
    'Braces / Orthodontics','Dentures','X-Ray','Consultation','Other'
  ]
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
        <div className="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center">
          <User size={14} className="text-emerald-700" />
        </div>
        <span className="text-sm font-semibold text-emerald-800">{patientName}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Date *</label>
          <input name="date" type="date" className="input" value={form.date} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Time *</label>
          <input name="time" type="time" className="input" value={form.time} onChange={handleChange} />
        </div>
        <div className="col-span-2">
          <label className="label">Procedure</label>
          <select name="procedure" className="input" value={form.procedure} onChange={handleChange}>
            <option value="">Select procedure</option>
            {PROCEDURES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea name="notes" className="input min-h-[70px] resize-none" placeholder="Any additional notes..." value={form.notes} onChange={handleChange} />
        </div>
      </div>
    </div>
  )
}

function Step3Prescription({ form, setForm, medicines, setMedicines, patientName, extraFields, setExtraFields, ccLabel, setCcLabel, oeLabel, setOeLabel, advLabel, setAdvLabel }) {
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleMedChange(i, field, value) {
    setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }
  function addMed() {
    setMedicines(prev => [...prev, { medicine: '', frequency: '', duration: '', instructions: '' }])
  }
  function removeMed(i) {
    if (medicines.length === 1) return
    setMedicines(prev => prev.filter((_, idx) => idx !== i))
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

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
        <div className="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center">
          <User size={14} className="text-emerald-700" />
        </div>
        <span className="text-sm font-semibold text-emerald-800">{patientName}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="mb-1"><LabelDropdown label={ccLabel} options={CC_OPTIONS} onChange={setCcLabel} /></div>
          <textarea name="chief_complaint" className="input min-h-[44px] resize-none text-sm"
            placeholder="Chief complaint..." value={form.chief_complaint} onChange={handleFormChange} />
        </div>
        <div>
          <div className="mb-1"><LabelDropdown label={oeLabel} options={OE_OPTIONS} onChange={setOeLabel} /></div>
          <textarea name="on_examination" className="input min-h-[44px] resize-none text-sm"
            placeholder="Examination findings..." value={form.on_examination} onChange={handleFormChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="mb-1"><LabelDropdown label={advLabel} options={ADV_OPTIONS} onChange={setAdvLabel} /></div>
          <textarea name="advice" className="input min-h-[44px] resize-none text-sm"
            placeholder="Advice given to patient..." value={form.advice} onChange={handleFormChange} />
        </div>
        <div className="mt-6 flex items-center justify-center h-[72px] border border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
          <AddFieldButton onAdd={addExtraField} existingLabels={extraFields.map(f => f.label)} />
        </div>
      </div>

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

      <div>
        <label className="label">Follow-up Date</label>
        <input name="follow_up_date" type="date" className="input" value={form.follow_up_date} onChange={handleFormChange} />
      </div>

      <div>
        <label className="label">Medicines</label>
        <div className="space-y-3">
          {medicines.map((med, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-600">Medicine {i + 1}</span>
                <button type="button" onClick={() => removeMed(i)} disabled={medicines.length === 1}
                  className="text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
              <MedicineInput value={med.medicine} onChange={val => handleMedChange(i, 'medicine', val)} />
              <div className="grid grid-cols-3 gap-2">
                <HoverDropdown value={med.frequency} options={FREQ_OPTIONS}
                  onChange={val => handleMedChange(i, 'frequency', val)} placeholder="Frequency" />
                <HoverDropdown value={med.duration} options={DUR_OPTIONS}
                  onChange={val => handleMedChange(i, 'duration', val)} placeholder="Duration" />
                <HoverDropdown value={med.instructions} options={INSTR_OPTIONS}
                  onChange={val => handleMedChange(i, 'instructions', val)} placeholder="Instructions" />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addMed} className="mt-2 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold hover:text-emerald-700">
          <Plus size={15} /> Add Medicine
        </button>
      </div>
    </div>
  )
}

function Step4Invoice({ items, setItems, form, setForm, patientName }) {
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  function handleItemChange(i, field, value) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }
  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: '' }])
  }
  function removeItem(i) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }
  const subtotal = items.reduce((sum, item) =>
    sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)), 0)
  const discountType = form.discountType || 'flat'
  const discountAmount = discountType === 'percent'
    ? subtotal * (parseFloat(form.discount || 0) / 100)
    : parseFloat(form.discount || 0)
  const total = Math.max(0, subtotal - discountAmount)
  const paidNow = parseFloat(form.paid_now || 0)
  const due = Math.max(0, total - paidNow)

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
        <div className="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center">
          <User size={14} className="text-emerald-700" />
        </div>
        <span className="text-sm font-semibold text-emerald-800">{patientName}</span>
      </div>
      <div>
        <label className="label">Invoice Date</label>
        <input name="date" type="date" className="input" value={form.date} onChange={handleFormChange} />
      </div>
      <div>
        <label className="label">Services / Items</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
              <input className="input text-sm" placeholder="e.g. Root Canal, Tooth Extraction" value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <span className="text-xs text-slate-500 font-medium">Qty</span>
                  <input className="input text-sm mt-0.5" type="number" min="1" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-slate-500 font-medium">Price (৳)</span>
                  <input className="input text-sm mt-0.5" type="number" min="0" step="0.01" placeholder="0.00" value={item.unit_price} onChange={e => handleItemChange(i, 'unit_price', e.target.value)} />
                </div>
                <div className="w-16 text-center">
                  <span className="text-xs text-slate-500 font-medium">Total</span>
                  <div className="text-sm font-bold text-slate-700 py-2.5">৳{(parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)).toLocaleString()}</div>
                </div>
                <button type="button" onClick={() => removeItem(i)} className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30" disabled={items.length === 1}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold hover:text-emerald-700">
          <Plus size={15} /> Add Item
        </button>
      </div>
      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="font-semibold text-slate-500 text-sm">Subtotal</span>
          <span className="font-bold text-slate-700">৳{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-600 text-sm">Discount</span>
            <button type="button"
              onClick={() => setForm(prev => ({ ...prev, discountType: prev.discountType === 'flat' ? 'percent' : 'flat' }))}
              className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200">
              {discountType === 'flat' ? '৳ Flat' : '% Off'}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-sm">{discountType === 'flat' ? '৳' : ''}</span>
            <input name="discount" type="number" min="0" step="0.01"
              max={discountType === 'percent' ? 100 : subtotal}
              placeholder="0" value={form.discount} onChange={handleFormChange}
              className="w-24 text-right border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <span className="text-slate-500 text-sm">{discountType === 'percent' ? '%' : ''}</span>
          </div>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-amber-50">
            <span className="text-xs text-amber-700 font-semibold">Discount applied</span>
            <span className="text-sm font-bold text-amber-700">−৳{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="font-semibold text-slate-600 text-sm">Total Amount</span>
          <span className="text-xl font-black text-slate-800">৳{total.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <label className="font-semibold text-emerald-700 text-sm">Paid Now</label>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">৳</span>
            <input name="paid_now" type="number" min="0" step="0.01" placeholder="0.00"
              value={form.paid_now} onChange={handleFormChange}
              className="w-28 text-right border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-red-600 text-sm">Due</span>
          <span className={`text-xl font-black ${due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            ৳{due.toLocaleString()}
          </span>
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" className="input min-h-[55px] resize-none" placeholder="Payment terms, notes to patient..." value={form.notes} onChange={handleFormChange} />
      </div>
    </div>
  )
}

function SuccessScreen({ patientName, patientPhone, onClose, savedInvoice, savedRx, tplSettings }) {
  function printInvoice() {
    if (!savedInvoice) return
    const items = savedInvoice.invoice_items || []
    const remaining = Math.max(0, (savedInvoice.total || 0) - (savedInvoice.paid_amount || 0))
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${savedInvoice.invoice_number}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;font-size:14px}
.hdr{display:flex;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}
.clinic{font-size:24px;font-weight:800;color:#065f46}
.sub{color:#64748b;font-size:13px;margin-top:4px}
.inv-num{font-size:20px;font-weight:700;text-align:right}
.inv-date{color:#64748b;font-size:12px;margin-top:4px;text-align:right}
.bill-box{background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:24px}
.bill-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.bill-name{font-size:16px;font-weight:700}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead{background:#f0fdf4}
th{padding:10px 12px;text-align:left;font-size:12px;color:#065f46;font-weight:600}
.tr{text-align:right}
td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
.totals{margin-left:auto;width:260px;margin-bottom:24px}
.trow{display:flex;justify-content:space-between;padding:8px 0;font-size:13px}
.trow.grand{border-top:2px solid #e2e8f0;padding-top:12px;margin-top:4px;font-weight:800;font-size:16px}
.trow.paid-r{color:#065f46;font-weight:600}
.trow.due-r{color:#b91c1c;font-weight:700;font-size:15px}
.footer{text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px}
</style></head><body>
<div class="hdr">
  <div><div class="clinic">${tplSettings?.clinic_name || 'Ora Dental Clinic'}</div><div class="sub">Dental Clinic</div></div>
  <div><div class="inv-num">${savedInvoice.invoice_number}</div><div class="inv-date">${format(new Date(savedInvoice.date), 'MMMM d, yyyy')}</div></div>
</div>
<div class="bill-box"><div class="bill-label">Bill To</div><div class="bill-name">${patientName}</div></div>
<table>
  <thead><tr><th>Description</th><th class="tr">Qty</th><th class="tr">Unit Price</th><th class="tr">Total</th></tr></thead>
  <tbody>${items.map(item => `<tr><td>${item.description}</td><td class="tr">${item.quantity}</td><td class="tr">&#2547;${Number(item.unit_price).toLocaleString()}</td><td class="tr">&#2547;${Number(item.total).toLocaleString()}</td></tr>`).join('')}</tbody>
</table>
<div class="totals">
  <div class="trow grand"><span>Total</span><span>&#2547;${Number(savedInvoice.total).toLocaleString()}</span></div>
  <div class="trow paid-r"><span>Paid</span><span>&#2547;${Number(savedInvoice.paid_amount || 0).toLocaleString()}</span></div>
  ${remaining > 0 ? `<div class="trow due-r"><span>Due</span><span>&#2547;${remaining.toLocaleString()}</span></div>` : ''}
</div>
<div class="footer">Thank you for choosing ${tplSettings?.clinic_name || 'Ora Dental Clinic'} &middot; Powered by Ora</div>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printRx() {
    if (!savedRx) return
    const items = savedRx.prescription_items || []
    const tpl = tplSettings || {}
    const template = tpl.prescription_template || 1
    const win = window.open('', '_blank')
    win.document.write(buildPrintHtml(template, tpl, savedRx, items))
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function waPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    const local = digits.replace(/^880/, '').replace(/^0/, '')
    return `880${local}`
  }

  function shareInvoiceWhatsApp() {
    if (!savedInvoice || !patientPhone) return
    const due = Math.max(0, (savedInvoice.total || 0) - (savedInvoice.paid_amount || 0))
    const msg = `Hello ${patientName}, your invoice ${savedInvoice.invoice_number} from ${tplSettings?.clinic_name || 'Ora Dental Clinic'}:\nTotal: ৳${savedInvoice.total?.toLocaleString()}\nPaid: ৳${(savedInvoice.paid_amount || 0).toLocaleString()}${due > 0 ? `\nDue: ৳${due.toLocaleString()}` : '\nStatus: Fully Paid'}\nThank you!`
    window.open(`https://wa.me/${waPhone(patientPhone)}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function shareRxWhatsApp() {
    if (!savedRx || !patientPhone) return
    const items = savedRx.prescription_items || []
    const medList = items.map((m, i) => `${i + 1}. ${m.medicine}${m.frequency ? ` - ${m.frequency}` : ''}${m.duration ? ` (${m.duration})` : ''}`).join('\n')
    const msg = `Hello ${patientName}, your prescription from ${tplSettings?.clinic_name || 'Ora Dental Clinic'}:${savedRx.chief_complaint ? `\nC/C: ${savedRx.chief_complaint}` : ''}${savedRx.diagnosis ? `\nO/E: ${savedRx.diagnosis}` : ''}\n\nMedicines:\n${medList}${savedRx.advice ? `\n\nAdv: ${savedRx.advice}` : ''}\n\nGet well soon!`
    window.open(`https://wa.me/${waPhone(patientPhone)}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const hasInvoice = !!savedInvoice
  const hasRx = !!savedRx
  const hasPhone = !!patientPhone

  return (
    <div>
      <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={30} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">All Done!</h2>
        <p className="text-slate-500 text-sm">
          <span className="font-bold text-slate-700">{patientName}</span> has been added successfully
        </p>
      </div>
      {hasInvoice && (
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Invoice</p>
          <div className="flex gap-2">
            <button onClick={printInvoice} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors">
              <Printer size={15} /> Print
            </button>
            <button onClick={shareInvoiceWhatsApp} disabled={!hasPhone} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Phone size={15} /> Share via WhatsApp
            </button>
          </div>
          {!hasPhone && <p className="text-xs text-slate-400 mt-2 text-center">Add a phone number to enable WhatsApp sharing</p>}
        </div>
      )}
      {hasRx && (
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Prescription</p>
          <div className="flex gap-2">
            <button onClick={printRx} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors">
              <Printer size={15} /> Print
            </button>
            <button onClick={shareRxWhatsApp} disabled={!hasPhone} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Phone size={15} /> Share via WhatsApp
            </button>
          </div>
          {!hasPhone && <p className="text-xs text-slate-400 mt-2 text-center">Add a phone number to enable WhatsApp sharing</p>}
        </div>
      )}
      <div className="px-6 py-5">
        <button onClick={onClose} className="btn-primary w-full justify-center py-3">
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default function QuickAddFlow({ onClose, onSuccess }) {
  const supabase = createClient()
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [completed, setCompleted] = useState([])
  const [photoFile, setPhotoFile]       = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const [patientId, setPatientId]       = useState(null)
  const [savedInvoice, setSavedInvoice] = useState(null)
  const [savedRx, setSavedRx]           = useState(null)
  const [tplSettings, setTplSettings]   = useState(null)
  const [ccLabel,  setCcLabel]  = useState('C/C')
  const [oeLabel,  setOeLabel]  = useState('O/E')
  const [advLabel, setAdvLabel] = useState('Adv')
  const [extraFields, setExtraFields] = useState([])

  useEffect(() => {
    async function fetchTplSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('clinic_settings').select('*').eq('clinic_id', user.id).single()
      if (data) setTplSettings(data)
    }
    fetchTplSettings()
  }, [])

  const [patientForm, setPatientForm] = useState({
    name: '', phone: '', email: '', age: '', gender: '', address: '', medical_history: '', referred_by: ''
  })
  const [scheduleForm, setScheduleForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', procedure: '', notes: '',
  })
  const [rxForm, setRxForm] = useState({
    chief_complaint: '', on_examination: '', advice: '', follow_up_date: ''
  })
  const [medicines, setMedicines] = useState([
    { medicine: '', frequency: '', duration: '', instructions: '' }
  ])
  const [invoiceForm, setInvoiceForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'), notes: '', paid_now: '', discount: '', discountType: 'flat',
  })
  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', quantity: 1, unit_price: '' }
  ])

  async function savePatient() {
    if (!patientForm.name.trim()) {
      setError("Please enter the patient's full name.")
      return false
    }
    setError('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    let photo_url = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('patient-photos').upload(path, photoFile)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('patient-photos').getPublicUrl(path)
        photo_url = publicUrl
      }
    }
    const { data, error: err } = await supabase.from('patients').insert({
      clinic_id: user.id,
      name: patientForm.name.trim(),
      phone: patientForm.phone || null,
      email: patientForm.email || null,
      age: patientForm.age || null,
      gender: patientForm.gender || null,
      address: patientForm.address || null,
      medical_history: patientForm.medical_history || null,
      referred_by: patientForm.referred_by || null,
      photo_url,
    }).select().single()
    setLoading(false)
    if (err) { setError('Failed to save patient. Please try again.'); return false }
    setPatientId(data.id)
    setCompleted(prev => [...prev, 'Patient Added'])
    return true
  }

  async function saveSchedule() {
    if (!scheduleForm.date || !scheduleForm.time) return true
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('appointments').insert({
      clinic_id: user.id, patient_id: patientId,
      date: scheduleForm.date, time: scheduleForm.time,
      procedure: scheduleForm.procedure || null, notes: scheduleForm.notes || null, status: 'scheduled',
    })
    setLoading(false)
    setCompleted(prev => [...prev, 'Appointment Booked'])
    return true
  }

  async function savePrescription() {
    const hasMeds = medicines.some(m => m.medicine.trim())
    if (!rxForm.chief_complaint && !rxForm.on_examination && !rxForm.advice && !hasMeds) return true
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const extraNotes = extraFields.filter(f => f.value).map(f => `${f.label}: ${f.value}`).join('\n')
    const { data: rx } = await supabase.from('prescriptions').insert({
      clinic_id: user.id, patient_id: patientId,
      date: format(new Date(), 'yyyy-MM-dd'),
      follow_up_date: rxForm.follow_up_date || null,
      diagnosis: rxForm.on_examination || null,
      chief_complaint: rxForm.chief_complaint || null,
      advice: rxForm.advice || null,
      notes: extraNotes || null,
    }).select().single()
    let medItems = []
    if (rx && hasMeds) {
      medItems = medicines.filter(m => m.medicine.trim()).map(m => ({
        prescription_id: rx.id, medicine: m.medicine, dosage: null,
        frequency: m.frequency || null, duration: m.duration || null, instructions: m.instructions || null,
      }))
      await supabase.from('prescription_items').insert(medItems)
    }
    if (rx) setSavedRx({ ...rx, prescription_items: medItems, patients: { name: patientForm.name, age: patientForm.age || null, gender: patientForm.gender || null } })
    setLoading(false)
    setCompleted(prev => [...prev, 'Prescription Written'])
    return true
  }

  async function saveInvoice() {
    const hasItems = invoiceItems.some(i => i.description.trim() && i.unit_price)
    if (!hasItems) return null
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const subtotal = invoiceItems.reduce((sum, item) =>
      sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)), 0)
    const discountAmount = invoiceForm.discountType === 'percent'
      ? subtotal * (parseFloat(invoiceForm.discount || 0) / 100)
      : parseFloat(invoiceForm.discount || 0)
    const total = Math.max(0, subtotal - discountAmount)
    const paidNow = parseFloat(invoiceForm.paid_now || 0)
    const status = paidNow >= total && total > 0 ? 'paid' : paidNow > 0 ? 'partial' : 'unpaid'
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`
    const { data: inv } = await supabase.from('invoices').insert({
      clinic_id: user.id, patient_id: patientId,
      invoice_number: invoiceNum, date: invoiceForm.date, due_date: null,
      status, total, discount: discountAmount, paid_amount: paidNow, notes: invoiceForm.notes || null,
    }).select().single()
    if (inv) {
      const items = invoiceItems.filter(i => i.description.trim() && i.unit_price).map(i => ({
        invoice_id: inv.id, description: i.description,
        quantity: parseInt(i.quantity), unit_price: parseFloat(i.unit_price),
        total: parseFloat(i.unit_price) * parseInt(i.quantity),
      }))
      await supabase.from('invoice_items').insert(items)
      setLoading(false)
      setCompleted(prev => [...prev, 'Invoice Created'])
      return { ...inv, invoice_items: items }
    }
    setLoading(false)
    return null
  }

  async function handleNext() {
    if (step === 1) { const ok = await savePatient(); if (!ok) return; setStep(2) }
    else if (step === 2) { await saveSchedule(); setStep(3) }
    else if (step === 3) { await savePrescription(); setStep(4) }
  }
  async function handleFinish() {
    const inv = await saveInvoice()
    if (inv) setSavedInvoice(inv)
    setDone(true)
  }
  function handleSkip() { setStep(prev => prev + 1) }
  function handleBack() { setStep(prev => prev - 1) }
  function handleOverlayClick(e) { if (e.target === e.currentTarget) onClose() }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleOverlayClick}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden" style={{ animation: 'slideUp 0.25s ease' }}>
        {done ? (
          <SuccessScreen
            patientName={patientForm.name} patientPhone={patientForm.phone}
            savedInvoice={savedInvoice} savedRx={savedRx} tplSettings={tplSettings}
            onClose={() => { onSuccess?.(); onClose() }}
          />
        ) : (
          <>
            <StepHeader step={step} onClose={onClose} />
            <div className="flex-1 overflow-y-auto">
              {step === 1 && <Step1Patient form={patientForm} setForm={setPatientForm} error={error} photoPreview={photoPreview} onPhotoChange={handlePhotoChange} />}
              {step === 2 && <Step2Schedule form={scheduleForm} setForm={setScheduleForm} patientName={patientForm.name} />}
              {step === 3 && (
                <Step3Prescription
                  form={rxForm} setForm={setRxForm}
                  medicines={medicines} setMedicines={setMedicines}
                  patientName={patientForm.name}
                  extraFields={extraFields} setExtraFields={setExtraFields}
                  ccLabel={ccLabel} setCcLabel={setCcLabel}
                  oeLabel={oeLabel} setOeLabel={setOeLabel}
                  advLabel={advLabel} setAdvLabel={setAdvLabel}
                />
              )}
              {step === 4 && <Step4Invoice items={invoiceItems} setItems={setInvoiceItems} form={invoiceForm} setForm={setInvoiceForm} patientName={patientForm.name} />}
            </div>
            <StepFooter step={step} onBack={handleBack} onNext={handleNext}
              onSkip={step > 1 ? handleSkip : null} onFinish={handleFinish}
              loading={loading} nextLabel={step === 1 ? 'Save & Continue' : 'Next'} />
          </>
        )}
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
