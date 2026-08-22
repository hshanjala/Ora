'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Button, FormField, DateInput, Alert, Input, Label,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from '@/components/ui'
import { ClinicalNotes, MedicineRow } from '@/components/prescriptions/fields'

export default function AddPrescriptionModal({ onClose, onSuccess, patientId, patientName }) {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')

  const [ccLabel, setCcLabel] = useState('C/C')
  const [oeLabel, setOeLabel] = useState('O/E')
  const [advLabel, setAdvLabel] = useState('Adv')
  const [extraFields, setExtraFields] = useState([])

  const [form, setForm] = useState({
    patient_id: patientId || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    follow_up_date: '',
    chief_complaint: '',
    on_examination: '',
    advice: '',
  })
  const [medicines, setMedicines] = useState([
    { medicine: '', frequency: '', duration: '', instructions: '' },
  ])

  useEffect(() => {
    if (patientId) return
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
      follow_up_date: form.follow_up_date || null,
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
    toast.success('Prescription saved', `${medItems.length} medicine${medItems.length === 1 ? '' : 's'}`)
    onSuccess()
    onClose()
  }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent size="lg">
        <ModalHeader title="New prescription" subtitle={patientName || undefined} />
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-5">
            {error && <Alert status="danger">{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Patient" required>
                {patientId && patientName ? (
                  <Input value={patientName} readOnly className="bg-surface-subtle" />
                ) : (
                  <Select
                    value={form.patient_id || undefined}
                    onValueChange={(v) => setForm(prev => ({ ...prev, patient_id: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select patient…" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
              <FormField label="Date">
                <DateInput name="date" value={form.date} onChange={handleFormChange} />
              </FormField>
              <FormField label="Follow-up date">
                <DateInput name="follow_up_date" value={form.follow_up_date} onChange={handleFormChange} />
              </FormField>
            </div>

            {/* Clinical notes */}
            <div>
              <Label className="mb-1.5">Clinical notes</Label>
              <ClinicalNotes
                ccLabel={ccLabel}
                oeLabel={oeLabel}
                advLabel={advLabel}
                onCcLabelChange={setCcLabel}
                onOeLabelChange={setOeLabel}
                onAdvLabelChange={setAdvLabel}
                form={form}
                onFormChange={handleFormChange}
                extraFields={extraFields}
                onAddField={addExtraField}
                onUpdateField={updateExtraField}
                onRemoveField={removeExtraField}
              />
            </div>

            {/* Medicines */}
            <div>
              <Label className="mb-1.5">Medicines</Label>
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
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addMed}>
                <Plus size={14} strokeWidth={1.75} /> Add medicine
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </ModalClose>
            <Button type="submit" loading={loading}>
              {loading ? 'Saving…' : 'Save prescription'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
