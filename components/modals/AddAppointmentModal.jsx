'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Button, FormField, Combobox, DateInput, TimeInput, Textarea, Alert,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from '@/components/ui'

const PROCEDURES = [
  'General Checkup', 'Cleaning & Scaling', 'Tooth Extraction',
  'Root Canal', 'Filling', 'Crown & Bridge', 'Teeth Whitening',
  'Braces / Orthodontics', 'Dentures', 'X-Ray', 'Consultation', 'Other',
]

const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'checked-in', label: 'Checked In' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AddAppointmentModal({ onClose, onSuccess, defaultDate, defaultPatient }) {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [patientQuery, setPatientQuery] = useState(defaultPatient?.name || '')
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatient?.id || null)

  const [form, setForm] = useState({
    date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    procedure: '',
    notes: '',
    status: 'scheduled',
  })

  useEffect(() => {
    async function loadPatients() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('patients')
        .select('id, name')
        .eq('clinic_id', user.id)
        .order('name')
      setPatients(data || [])
    }
    loadPatients()
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!patientQuery.trim()) {
      setError('Please enter a patient name.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    let patientId = selectedPatientId

    // If no existing patient selected, create a new one — is_active: false
    // so they don't appear in Patients list until appointment is completed
    if (!patientId && patientQuery.trim()) {
      const { data: newPatient } = await supabase
        .from('patients')
        .insert({ clinic_id: user.id, name: patientQuery.trim(), is_active: false })
        .select()
        .single()
      patientId = newPatient?.id || null
    }

    const { error } = await supabase.from('appointments').insert({
      clinic_id: user.id,
      patient_id: patientId,
      date: form.date,
      time: form.time,
      procedure: form.procedure || null,
      notes: form.notes || null,
      status: form.status,
    })

    if (error) {
      setError('Failed to add appointment.')
      setLoading(false)
      return
    }

    toast.success('Appointment added', `${patientQuery.trim()} · ${form.date}`)
    onSuccess()
    onClose()
  }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent>
        <ModalHeader title="Add appointment" />
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-4">
            {error && <Alert status="danger">{error}</Alert>}

            <FormField
              label="Patient"
              required
              hint="Type a new name to register a patient with this booking"
            >
              <Combobox
                items={patients.map(p => ({ value: p.id, label: p.name }))}
                query={patientQuery}
                onQueryChange={(q) => { setPatientQuery(q); setSelectedPatientId(null) }}
                onSelect={(item) => { setPatientQuery(item.label); setSelectedPatientId(item.value) }}
                onCreate={(q) => { setPatientQuery(q); setSelectedPatientId(null) }}
                createLabel={(q) => `Add “${q}” as a new patient`}
                placeholder="Type patient name…"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date" required>
                <DateInput name="date" value={form.date} onChange={handleChange} required />
              </FormField>
              <FormField label="Time" required>
                <TimeInput name="time" value={form.time} onChange={handleChange} required />
              </FormField>
            </div>

            <FormField label="Procedure">
              <Select
                value={form.procedure || undefined}
                onValueChange={(v) => setForm(prev => ({ ...prev, procedure: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
                <SelectContent>
                  {PROCEDURES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Notes">
              <Textarea
                name="notes"
                placeholder="Any additional notes…"
                value={form.notes}
                onChange={handleChange}
              />
            </FormField>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </ModalClose>
            <Button type="submit" loading={loading}>
              {loading ? 'Adding…' : 'Add appointment'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
