'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  X, ChevronRight, ChevronLeft, Check,
  User, Calendar, Pill, FileText, Plus, Trash2, Loader2, SkipForward
} from 'lucide-react'

// ─── Step indicators ───────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Patient',      icon: User },
  { id: 2, label: 'Schedule',     icon: Calendar },
  { id: 3, label: 'Prescription', icon: Pill },
  { id: 4, label: 'Invoice',      icon: FileText },
]

// ─── Shared header ─────────────────────────────────────────────────────────
function StepHeader({ step, onClose }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-100">
      {/* Progress bar */}
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

      {/* Title row */}
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
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

// ─── Footer buttons ─────────────────────────────────────────────────────────
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

// ─── STEP 1: Add Patient ────────────────────────────────────────────────────
function Step1Patient({ form, setForm, error }) {
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  return (
    <div className="p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Full Name *</label>
          <input name="name" className="input" placeholder="Patient's full name" value={form.name} onChange={handleChange} required />
        </div>
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
          <input name="date_of_birth" type="number" min="0" max="120" className="input" placeholder="e.g. 35" value={form.date_of_birth} onChange={handleChange} />
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
          <label className="label">Medical History / Allergies</label>
          <textarea name="medical_history" className="input min-h-[70px] resize-none" placeholder="Allergies, chronic conditions, previous treatments..." value={form.medical_history} onChange={handleChange} />
        </div>
      </div>
    </div>
  )
}

// ─── STEP 2: Add Schedule ───────────────────────────────────────────────────
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
    <div className="p-6 space-y-4">
      {/* Patient pill */}
      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
        <div className="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center">
          <User size={14} className="text-emerald-700" />
        </div>
        <span className="text-sm font-semibold text-emerald-800">{patientName}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

// ─── STEP 3: Add Prescription ───────────────────────────────────────────────
function Step3Prescription({ form, setForm, medicines, setMedicines, patientName }) {
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  function handleMedChange(i, field, value) {
    setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }
  function addMed() {
    setMedicines(prev => [...prev, { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }
  function removeMed(i) {
    if (medicines.length === 1) return
    setMedicines(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="p-6 space-y-4">
      {/* Patient pill */}
      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
        <div className="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center">
          <User size={14} className="text-emerald-700" />
        </div>
        <span className="text-sm font-semibold text-emerald-800">{patientName}</span>
      </div>

      <div>
        <label className="label">Diagnosis</label>
        <input name="diagnosis" className="input" placeholder="e.g. Dental Caries, Gum Disease..." value={form.diagnosis} onChange={handleFormChange} />
      </div>

      <div>
        <label className="label">Medicines</label>
        <div className="space-y-3">
          {medicines.map((med, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Medicine {i + 1}</span>
                <button type="button" onClick={() => removeMed(i)} disabled={medicines.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30">
                  <Trash2 size={14} />
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
          <Plus size={15} /> Add Medicine
        </button>
      </div>

      <div>
        <label className="label">Doctor&apos;s Notes</label>
        <textarea name="notes" className="input min-h-[60px] resize-none" placeholder="Additional instructions for patient..." value={form.notes} onChange={handleFormChange} />
      </div>
    </div>
  )
}

// ─── STEP 4: Create Invoice ─────────────────────────────────────────────────
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

  const total = items.reduce((sum, item) =>
    sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)), 0)

  return (
    <div className="p-6 space-y-4">
      {/* Patient pill */}
      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5">
        <div className="w-7 h-7 bg-emerald-200 rounded-full flex items-center justify-center">
          <User size={14} className="text-emerald-700" />
        </div>
        <span className="text-sm font-semibold text-emerald-800">{patientName}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Invoice Date</label>
          <input name="date" type="date" className="input" value={form.date} onChange={handleFormChange} />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input name="due_date" type="date" className="input" value={form.due_date} onChange={handleFormChange} />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <label className="label">Services / Items</label>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-1">
            <span className="col-span-5">Description</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-3">Price (৳)</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="input col-span-5 text-sm"
                placeholder="e.g. Root Canal"
                value={item.description}
                onChange={e => handleItemChange(i, 'description', e.target.value)}
              />
              <input
                className="input col-span-2 text-sm"
                type="number" min="1"
                value={item.quantity}
                onChange={e => handleItemChange(i, 'quantity', e.target.value)}
              />
              <input
                className="input col-span-3 text-sm"
                type="number" min="0" step="0.01"
                placeholder="0.00"
                value={item.unit_price}
                onChange={e => handleItemChange(i, 'unit_price', e.target.value)}
              />
              <div className="col-span-1 text-right text-xs font-bold text-slate-700">
                ৳{(parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)).toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="col-span-1 text-red-400 hover:text-red-600 flex justify-center disabled:opacity-30"
                disabled={items.length === 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold hover:text-emerald-700">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Total */}
      <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-600 text-sm">Total Amount</span>
        <span className="text-xl font-black text-slate-800">৳{total.toLocaleString()}</span>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea name="notes" className="input min-h-[55px] resize-none" placeholder="Payment terms, notes to patient..." value={form.notes} onChange={handleFormChange} />
      </div>
    </div>
  )
}

// ─── SUCCESS screen ─────────────────────────────────────────────────────────
function SuccessScreen({ patientName, onClose, completed }) {
  return (
    <div className="p-8 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <Check size={36} className="text-emerald-600" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">All Done!</h2>
      <p className="text-slate-500 mb-6">
        <span className="font-bold text-slate-700">{patientName}</span> has been added successfully.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {completed.map(item => (
          <span key={item} className="badge-green px-3 py-1.5">
            <Check size={12} className="mr-1" /> {item}
          </span>
        ))}
      </div>
      <button onClick={onClose} className="btn-primary mx-auto justify-center px-8">
        Back to Dashboard
      </button>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function QuickAddFlow({ onClose, onSuccess }) {
  const supabase = createClient()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)
  const [completed, setCompleted] = useState([])

  // Saved IDs
  const [patientId, setPatientId] = useState(null)

  // Step 1 — patient form
  const [patientForm, setPatientForm] = useState({
    name: '', phone: '', email: '',
    date_of_birth: '', gender: '', address: '', medical_history: ''
  })

  // Step 2 — schedule form
  const [scheduleForm, setScheduleForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    procedure: '',
    notes: '',
  })

  // Step 3 — prescription
  const [rxForm, setRxForm] = useState({ diagnosis: '', notes: '' })
  const [medicines, setMedicines] = useState([
    { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ])

  // Step 4 — invoice
  const [invoiceForm, setInvoiceForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
    notes: '',
  })
  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', quantity: 1, unit_price: '' }
  ])

  // ── Step 1: Save patient ────────────────────────────────────────────────
  async function savePatient() {
    if (!patientForm.name.trim()) {
      setError('Please enter the patient\'s full name.')
      return false
    }
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: err } = await supabase.from('patients').insert({
      clinic_id: user.id,
      name: patientForm.name.trim(),
      phone: patientForm.phone || null,
      email: patientForm.email || null,
      date_of_birth: patientForm.date_of_birth || null,
      gender: patientForm.gender || null,
      address: patientForm.address || null,
      medical_history: patientForm.medical_history || null,
    }).select().single()

    setLoading(false)

    if (err) {
      setError('Failed to save patient. Please try again.')
      return false
    }

    setPatientId(data.id)
    setCompleted(prev => [...prev, 'Patient Added'])
    return true
  }

  // ── Step 2: Save appointment ────────────────────────────────────────────
  async function saveSchedule() {
    if (!scheduleForm.date || !scheduleForm.time) return true // skip if empty
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('appointments').insert({
      clinic_id: user.id,
      patient_id: patientId,
      date: scheduleForm.date,
      time: scheduleForm.time,
      procedure: scheduleForm.procedure || null,
      notes: scheduleForm.notes || null,
      status: 'scheduled',
    })

    setLoading(false)
    setCompleted(prev => [...prev, 'Appointment Booked'])
    return true
  }

  // ── Step 3: Save prescription ───────────────────────────────────────────
  async function savePrescription() {
    const hasMeds = medicines.some(m => m.medicine.trim())
    if (!rxForm.diagnosis && !hasMeds) return true // skip if totally empty

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: rx } = await supabase.from('prescriptions').insert({
      clinic_id: user.id,
      patient_id: patientId,
      date: format(new Date(), 'yyyy-MM-dd'),
      diagnosis: rxForm.diagnosis || null,
      notes: rxForm.notes || null,
    }).select().single()

    if (rx && hasMeds) {
      const medItems = medicines
        .filter(m => m.medicine.trim())
        .map(m => ({ prescription_id: rx.id, ...m }))
      await supabase.from('prescription_items').insert(medItems)
    }

    setLoading(false)
    setCompleted(prev => [...prev, 'Prescription Written'])
    return true
  }

  // ── Step 4: Save invoice ────────────────────────────────────────────────
  async function saveInvoice() {
    const hasItems = invoiceItems.some(i => i.description.trim() && i.unit_price)
    if (!hasItems) return true // skip if empty

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const total = invoiceItems.reduce((sum, item) =>
      sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)), 0)

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`

    const { data: inv } = await supabase.from('invoices').insert({
      clinic_id: user.id,
      patient_id: patientId,
      invoice_number: invoiceNum,
      date: invoiceForm.date,
      due_date: invoiceForm.due_date || null,
      status: 'unpaid',
      total,
      paid_amount: 0,
      notes: invoiceForm.notes || null,
    }).select().single()

    if (inv) {
      const items = invoiceItems
        .filter(i => i.description.trim() && i.unit_price)
        .map(i => ({
          invoice_id: inv.id,
          description: i.description,
          quantity: parseInt(i.quantity),
          unit_price: parseFloat(i.unit_price),
          total: parseFloat(i.unit_price) * parseInt(i.quantity),
        }))
      await supabase.from('invoice_items').insert(items)
    }

    setLoading(false)
    setCompleted(prev => [...prev, 'Invoice Created'])
    return true
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  async function handleNext() {
    if (step === 1) {
      const ok = await savePatient()
      if (!ok) return
      setStep(2)
    } else if (step === 2) {
      await saveSchedule()
      setStep(3)
    } else if (step === 3) {
      await savePrescription()
      setStep(4)
    }
  }

  async function handleFinish() {
    await saveInvoice()
    setDone(true)
    onSuccess?.()
  }

  function handleSkip() {
    if (step === 2) setCompleted(prev => prev) // no entry for skipped
    setStep(prev => prev + 1)
  }

  function handleBack() {
    setStep(prev => prev - 1)
  }

  // ── Close with outside click ────────────────────────────────────────────
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        style={{ animation: 'slideUp 0.25s ease' }}
      >
        {done ? (
          <SuccessScreen
            patientName={patientForm.name}
            completed={completed}
            onClose={onClose}
          />
        ) : (
          <>
            <StepHeader step={step} onClose={onClose} />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {step === 1 && (
                <Step1Patient form={patientForm} setForm={setPatientForm} error={error} />
              )}
              {step === 2 && (
                <Step2Schedule form={scheduleForm} setForm={setScheduleForm} patientName={patientForm.name} />
              )}
              {step === 3 && (
                <Step3Prescription
                  form={rxForm} setForm={setRxForm}
                  medicines={medicines} setMedicines={setMedicines}
                  patientName={patientForm.name}
                />
              )}
              {step === 4 && (
                <Step4Invoice
                  items={invoiceItems} setItems={setInvoiceItems}
                  form={invoiceForm} setForm={setInvoiceForm}
                  patientName={patientForm.name}
                />
              )}
            </div>

            <StepFooter
              step={step}
              onBack={handleBack}
              onNext={handleNext}
              onSkip={step > 1 ? handleSkip : null}
              onFinish={handleFinish}
              loading={loading}
              nextLabel={step === 1 ? 'Save & Continue' : 'Next'}
            />
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
      `}</style>
    </div>
  )
}
