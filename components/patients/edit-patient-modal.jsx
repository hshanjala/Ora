'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Button, FormField, Input, Textarea, Avatar, Spinner,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from '@/components/ui'

export default function EditPatientModal({ patient, open, onOpenChange, onSaved }) {
  const supabase = createClient()
  const toast = useToast()
  const photoRef = useRef(null)
  const [form, setForm] = useState({
    name: patient.name || '',
    phone: patient.phone || '',
    email: patient.email || '',
    age: patient.age || '',
    gender: patient.gender || '',
    address: patient.address || '',
    medical_history: patient.medical_history || '',
    referred_by: patient.referred_by || '',
  })
  const [photoUrl, setPhotoUrl] = useState(patient.photo_url || null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${patient.id}/photo.${ext}`
    await supabase.storage.from('patient-images').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('patient-images').getPublicUrl(path)
    await supabase.from('patients').update({ photo_url: publicUrl }).eq('id', patient.id)
    setPhotoUrl(publicUrl)
    setUploadingPhoto(false)
    e.target.value = ''
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('patients').update({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      age: form.age || null,
      gender: form.gender || null,
      address: form.address || null,
      medical_history: form.medical_history || null,
      referred_by: form.referred_by || null,
    }).eq('id', patient.id)
    setSaving(false)
    onSaved({ ...form, photo_url: photoUrl })
    toast.success('Patient updated')
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader title="Edit patient" />
        <form onSubmit={handleSave} className="contents">
          <ModalBody className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                aria-label="Change patient photo"
                className="relative shrink-0 rounded-full transition-opacity duration-fast hover:opacity-80"
              >
                {uploadingPhoto
                  ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
                      <Spinner size={16} className="text-accent-text" />
                    </span>
                  )
                  : <Avatar name={form.name} src={photoUrl} size="lg" />}
              </button>
              <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => photoRef.current?.click()}>
                  {photoUrl ? 'Change photo' : 'Upload photo'}
                </Button>
                <p className="mt-0.5 text-label text-tertiary">JPG or PNG — shown in the patient list</p>
              </div>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" required className="sm:col-span-2">
                <Input name="name" value={form.name} onChange={handleChange} required />
              </FormField>
              <FormField label="Phone">
                <Input name="phone" value={form.phone} onChange={handleChange} />
              </FormField>
              <FormField label="Email">
                <Input name="email" type="email" value={form.email} onChange={handleChange} />
              </FormField>
              <FormField label="Age">
                <Input name="age" type="number" min="0" max="120" placeholder="e.g. 35" value={form.age} onChange={handleChange} />
              </FormField>
              <FormField label="Gender">
                <Select
                  value={form.gender || undefined}
                  onValueChange={(v) => setForm(prev => ({ ...prev, gender: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <Input name="address" value={form.address} onChange={handleChange} />
              </FormField>
              <FormField label="Referred by" className="sm:col-span-2">
                <Input name="referred_by" placeholder="Doctor or clinic name" value={form.referred_by} onChange={handleChange} />
              </FormField>
              <FormField label="Medical history / allergies" className="sm:col-span-2">
                <Textarea name="medical_history" value={form.medical_history} onChange={handleChange} />
              </FormField>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </ModalClose>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
