'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Button, FormField, Input, Textarea, Alert,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from '@/components/ui'

export default function AddPatientModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    age: '', gender: '',
    address: '', medical_history: '', referred_by: '',
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('patients').insert({
      clinic_id: user.id,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      age: form.age || null,
      gender: form.gender || null,
      address: form.address || null,
      medical_history: form.medical_history || null,
      referred_by: form.referred_by || null,
    })

    if (error) {
      setError('Failed to add patient. Please try again.')
      setLoading(false)
      return
    }

    toast.success('Patient added', form.name)
    onSuccess()
    onClose()
  }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent>
        <ModalHeader title="Add new patient" />
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-4">
            {error && <Alert status="danger">{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" required className="sm:col-span-2">
                <Input name="name" placeholder="Patient's full name" value={form.name} onChange={handleChange} required />
              </FormField>
              <FormField label="Phone">
                <Input name="phone" placeholder="01XXXXXXXXX" value={form.phone} onChange={handleChange} />
              </FormField>
              <FormField label="Email">
                <Input name="email" type="email" placeholder="patient@email.com" value={form.email} onChange={handleChange} />
              </FormField>
              <FormField label="Age">
                <Input name="age" type="number" min="0" max="120" placeholder="e.g. 35" value={form.age} onChange={handleChange} />
              </FormField>
              <FormField label="Gender">
                <Select value={form.gender || undefined} onValueChange={(v) => setForm(prev => ({ ...prev, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <Input name="address" placeholder="Full address" value={form.address} onChange={handleChange} />
              </FormField>
              <FormField label="Referred by" className="sm:col-span-2">
                <Input name="referred_by" placeholder="Doctor or clinic name" value={form.referred_by} onChange={handleChange} />
              </FormField>
              <FormField
                label="Medical history / notes"
                className="sm:col-span-2"
                hint="Allergies, chronic conditions, previous treatments"
              >
                <Textarea name="medical_history" value={form.medical_history} onChange={handleChange} />
              </FormField>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </ModalClose>
            <Button type="submit" loading={loading}>
              {loading ? 'Adding…' : 'Add patient'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
