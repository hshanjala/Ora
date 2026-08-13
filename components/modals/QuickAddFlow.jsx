'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  User, CalendarPlus, Pill, FileText, Check,
  ChevronLeft, ChevronRight, SkipForward,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Eyebrow, useToast,
} from '@/components/ui'
import {
  Step1Patient, Step2Schedule, Step3Prescription, Step4Invoice,
} from '@/components/quick-add/steps'
import SuccessScreen from '@/components/quick-add/success-screen'

const STEPS = [
  { id: 1, label: 'Patient', icon: User },
  { id: 2, label: 'Appointment', icon: CalendarPlus },
  { id: 3, label: 'Prescription', icon: Pill },
  { id: 4, label: 'Invoice', icon: FileText },
]

function Stepper({ step }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Progress">
      {STEPS.map((s, i) => {
        const Icon = s.icon
        const done = step > s.id
        const active = step === s.id
        return (
          <li key={s.id} className="flex flex-1 items-center gap-1.5 last:flex-none">
            <span
              className="flex items-center gap-1.5"
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-fast',
                  done || active ? 'bg-accent text-inverse' : 'bg-surface-hover text-tertiary'
                )}
              >
                {done ? <Check size={12} strokeWidth={2.5} /> : <Icon size={12} strokeWidth={2} />}
              </span>
              <span
                className={cn(
                  'hidden text-label sm:block',
                  active ? 'text-primary' : done ? 'text-secondary' : 'text-tertiary'
                )}
              >
                {s.label}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'h-px flex-1 transition-colors duration-base',
                  step > s.id ? 'bg-accent' : 'bg-subtle'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function QuickAddFlow({ onClose, onSuccess }) {
  const supabase = createClient()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [patientId, setPatientId] = useState(null)
  const [savedInvoice, setSavedInvoice] = useState(null)
  const [savedRx, setSavedRx] = useState(null)
  const [tplSettings, setTplSettings] = useState(null)
  const [ccLabel, setCcLabel] = useState('C/C')
  const [oeLabel, setOeLabel] = useState('O/E')
  const [advLabel, setAdvLabel] = useState('Adv')
  const [extraFields, setExtraFields] = useState([])

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

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
    name: '', phone: '', email: '', age: '', gender: '', address: '', medical_history: '', referred_by: '',
  })
  const [scheduleForm, setScheduleForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', procedure: '', notes: '',
  })
  const [rxForm, setRxForm] = useState({
    chief_complaint: '', on_examination: '', advice: '', follow_up_date: '',
  })
  const [medicines, setMedicines] = useState([
    { medicine: '', frequency: '', duration: '', instructions: '' },
  ])
  const [invoiceForm, setInvoiceForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'), notes: '', paid_now: '', discount: '', discountType: 'flat',
  })
  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', quantity: 1, unit_price: '' },
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
    return true
  }

  async function saveSchedule() {
    if (!scheduleForm.date || !scheduleForm.time) return true
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
    return true
  }

  async function savePrescription() {
    const hasMeds = medicines.some(m => m.medicine.trim())
    if (!rxForm.chief_complaint && !rxForm.on_examination && !rxForm.advice && !hasMeds) return true
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const extraNotes = extraFields.filter(f => f.value).map(f => `${f.label}: ${f.value}`).join('\n')
    const { data: rx } = await supabase.from('prescriptions').insert({
      clinic_id: user.id,
      patient_id: patientId,
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
        prescription_id: rx.id,
        medicine: m.medicine,
        dosage: null,
        frequency: m.frequency || null,
        duration: m.duration || null,
        instructions: m.instructions || null,
      }))
      await supabase.from('prescription_items').insert(medItems)
    }
    if (rx) {
      setSavedRx({
        ...rx,
        prescription_items: medItems,
        patients: {
          name: patientForm.name,
          age: patientForm.age || null,
          gender: patientForm.gender || null,
        },
      })
    }
    setLoading(false)
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
      clinic_id: user.id,
      patient_id: patientId,
      invoice_number: invoiceNum,
      date: invoiceForm.date,
      due_date: null,
      status,
      total,
      discount: discountAmount,
      paid_amount: paidNow,
      notes: invoiceForm.notes || null,
    }).select().single()
    if (inv) {
      const items = invoiceItems.filter(i => i.description.trim() && i.unit_price).map(i => ({
        invoice_id: inv.id,
        description: i.description,
        quantity: parseInt(i.quantity),
        unit_price: parseFloat(i.unit_price),
        total: parseFloat(i.unit_price) * parseInt(i.quantity),
      }))
      await supabase.from('invoice_items').insert(items)
      setLoading(false)
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
    toast.success('Patient added', patientForm.name)
  }

  function handleSkip() { setStep(prev => prev + 1) }
  function handleBack() { setStep(prev => prev - 1) }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent size="lg">
        {done ? (
          <SuccessScreen
            patientName={patientForm.name}
            patientPhone={patientForm.phone}
            savedInvoice={savedInvoice}
            savedRx={savedRx}
            tplSettings={tplSettings}
            onClose={() => { onSuccess?.(); onClose() }}
          />
        ) : (
          <>
            <ModalHeader title={STEPS[step - 1].label}>
              <Eyebrow className="mt-0.5">Step {step} of {STEPS.length}</Eyebrow>
              <div className="mt-3">
                <Stepper step={step} />
              </div>
            </ModalHeader>

            <ModalBody>
              {step === 1 && (
                <Step1Patient
                  form={patientForm}
                  setForm={setPatientForm}
                  error={error}
                  photoPreview={photoPreview}
                  onPhotoChange={handlePhotoChange}
                />
              )}
              {step === 2 && (
                <Step2Schedule
                  form={scheduleForm}
                  setForm={setScheduleForm}
                  patientName={patientForm.name}
                />
              )}
              {step === 3 && (
                <Step3Prescription
                  form={rxForm}
                  setForm={setRxForm}
                  medicines={medicines}
                  setMedicines={setMedicines}
                  patientName={patientForm.name}
                  extraFields={extraFields}
                  setExtraFields={setExtraFields}
                  ccLabel={ccLabel} setCcLabel={setCcLabel}
                  oeLabel={oeLabel} setOeLabel={setOeLabel}
                  advLabel={advLabel} setAdvLabel={setAdvLabel}
                />
              )}
              {step === 4 && (
                <Step4Invoice
                  items={invoiceItems}
                  setItems={setInvoiceItems}
                  form={invoiceForm}
                  setForm={setInvoiceForm}
                  patientName={patientForm.name}
                />
              )}
            </ModalBody>

            <ModalFooter className="justify-between">
              <div>
                {step > 1 && (
                  <Button variant="secondary" onClick={handleBack}>
                    <ChevronLeft size={15} strokeWidth={1.75} /> Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <Button variant="ghost" onClick={handleSkip}>
                    <SkipForward size={15} strokeWidth={1.75} /> Skip
                  </Button>
                )}
                {step < 4 ? (
                  <Button onClick={handleNext} loading={loading}>
                    {step === 1 ? 'Save & continue' : 'Next'}
                    <ChevronRight size={15} strokeWidth={1.75} />
                  </Button>
                ) : (
                  <Button onClick={handleFinish} loading={loading}>
                    <Check size={15} strokeWidth={2} /> Finish
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
