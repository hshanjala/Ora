'use client'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Button, FormField, Input, Label, SpinnerBlock, FileUpload, Eyebrow, useToast,
} from '@/components/ui'

const TEMPLATES = [
  { id: 1, label: 'T1', desc: 'Logo + doctor' },
  { id: 2, label: 'T2', desc: 'Two doctors' },
  { id: 3, label: 'T3', desc: 'Clinic right' },
]

export default function TemplateSetupModal({ open, onOpenChange, onSaved }) {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tpl, setTpl] = useState({
    prescription_template: 1,
    doctor_name: '', doctor_designation: '', doctor_subtext: '',
    doctor_reg_no: '', doctor_phone: '', doctor_email: '',
    doctor2_name: '', doctor2_designation: '', doctor2_subtext: '',
    doctor2_email: '', doctor2_reg_no: '',
    clinic_name: '', clinic_address: '', clinic_logo_url: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('clinic_settings')
        .select('*').eq('clinic_id', user.id).single()
      if (data) {
        setTpl({
          prescription_template: data.prescription_template || 1,
          doctor_name: data.doctor_name || '',
          doctor_designation: data.doctor_designation || '',
          doctor_subtext: data.doctor_subtext || '',
          doctor_reg_no: data.doctor_reg_no || '',
          doctor_phone: data.doctor_phone || '',
          doctor_email: data.doctor_email || '',
          doctor2_name: data.doctor2_name || '',
          doctor2_designation: data.doctor2_designation || '',
          doctor2_subtext: data.doctor2_subtext || '',
          doctor2_email: data.doctor2_email || '',
          doctor2_reg_no: data.doctor2_reg_no || '',
          clinic_name: data.clinic_name || '',
          clinic_address: data.clinic_address || '',
          clinic_logo_url: data.clinic_logo_url || '',
        })
        if (data.clinic_logo_url) setLogoPreview(data.clinic_logo_url)
      }
      setLoading(false)
    }
    if (open) load()
  }, [open])

  function handleChange(e) {
    setTpl(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleLogoFile(file) {
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    let logo_url = tpl.clinic_logo_url
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${user.id}/logo-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('patient-photos').upload(path, logoFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('patient-photos').getPublicUrl(path)
        logo_url = publicUrl
      }
    }
    await supabase.from('clinic_settings').update({
      prescription_template: tpl.prescription_template,
      doctor_name: tpl.doctor_name || null,
      doctor_designation: tpl.doctor_designation || null,
      doctor_subtext: tpl.doctor_subtext || null,
      doctor_reg_no: tpl.doctor_reg_no || null,
      doctor_phone: tpl.doctor_phone || null,
      doctor_email: tpl.doctor_email || null,
      doctor2_name: tpl.doctor2_name || null,
      doctor2_designation: tpl.doctor2_designation || null,
      doctor2_subtext: tpl.doctor2_subtext || null,
      doctor2_email: tpl.doctor2_email || null,
      doctor2_reg_no: tpl.doctor2_reg_no || null,
      clinic_address: tpl.clinic_address || null,
      clinic_logo_url: logo_url || null,
    }).eq('clinic_id', user.id)
    setSaving(false)
    onSaved({ ...tpl, clinic_logo_url: logo_url })
    toast.success('Prescription template saved')
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl">
        <ModalHeader
          title="Prescription template"
          subtitle="Letterhead used on every printed prescription"
        />
        {loading ? (
          <ModalBody><SpinnerBlock /></ModalBody>
        ) : (
          <>
            <ModalBody className="space-y-6">
              {/* Template picker */}
              <div>
                <Label className="mb-2">Template style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPLATES.map(t => {
                    const active = tpl.prescription_template === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setTpl(prev => ({ ...prev, prescription_template: t.id }))}
                        className={cn(
                          'relative rounded-lg border p-4 text-center transition-colors duration-fast ease-out',
                          active
                            ? 'border-accent bg-accent-subtle'
                            : 'hover:border-strong hover:bg-surface-hover'
                        )}
                      >
                        {active && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-inverse">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                        <span className={cn('block text-h3', active ? 'text-accent-text' : 'text-primary')}>
                          {t.label}
                        </span>
                        <span className="mt-0.5 block text-label text-secondary">{t.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Doctor 1 */}
                <div className="space-y-3">
                  <Eyebrow className="border-b pb-2">
                    {tpl.prescription_template === 2 ? 'Doctor 1' : 'Doctor'}
                  </Eyebrow>
                  <FormField label="Full name">
                    <Input name="doctor_name" placeholder="Dr. Hanjala Hossen" value={tpl.doctor_name} onChange={handleChange} />
                  </FormField>
                  <FormField label="Designation">
                    <Input name="doctor_designation" placeholder="Dental Surgeon" value={tpl.doctor_designation} onChange={handleChange} />
                  </FormField>
                  <FormField label="Sub text">
                    <Input name="doctor_subtext" placeholder="BDS (SSAMML, Dhaka), FCPS…" value={tpl.doctor_subtext} onChange={handleChange} />
                  </FormField>
                  <FormField label="Reg. no">
                    <Input name="doctor_reg_no" placeholder="343333" value={tpl.doctor_reg_no} onChange={handleChange} />
                  </FormField>
                  <FormField label="Phone">
                    <Input name="doctor_phone" placeholder="+8801629775303" value={tpl.doctor_phone} onChange={handleChange} />
                  </FormField>
                  <FormField label="Email">
                    <Input name="doctor_email" type="email" placeholder="dr@email.com" value={tpl.doctor_email} onChange={handleChange} />
                  </FormField>
                </div>

                {/* Clinic */}
                <div className="space-y-3">
                  <Eyebrow className="border-b pb-2">Clinic</Eyebrow>
                  <FormField label="Clinic name">
                    <Input name="clinic_name" placeholder="Ora Dental Clinic" value={tpl.clinic_name} onChange={handleChange} />
                  </FormField>
                  <FormField label="Address">
                    <Input name="clinic_address" placeholder="Kabir Khan Market, Dhaka" value={tpl.clinic_address} onChange={handleChange} />
                  </FormField>
                  <FormField label="Clinic logo" hint="Appears on the printed letterhead">
                    <FileUpload
                      accept="image/*"
                      onFile={handleLogoFile}
                      label={logoPreview ? 'Tap to change logo' : 'Upload logo'}
                      compact
                    >
                      {logoPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoPreview}
                          alt="Clinic logo"
                          className="mb-1.5 h-14 w-14 rounded-md border object-contain"
                        />
                      )}
                    </FileUpload>
                  </FormField>
                </div>
              </div>

              {/* Doctor 2 — template 2 only */}
              {tpl.prescription_template === 2 && (
                <div className="space-y-3 rounded-lg border border-dashed p-4">
                  <Eyebrow className="border-b pb-2">Doctor 2 — template 2 only</Eyebrow>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Full name">
                      <Input name="doctor2_name" placeholder="Dr. Second Doctor" value={tpl.doctor2_name} onChange={handleChange} />
                    </FormField>
                    <FormField label="Designation">
                      <Input name="doctor2_designation" placeholder="Dental Surgeon" value={tpl.doctor2_designation} onChange={handleChange} />
                    </FormField>
                    <FormField label="Sub text" className="sm:col-span-2">
                      <Input name="doctor2_subtext" placeholder="BDS (SSAMML, Dhaka), FCPS…" value={tpl.doctor2_subtext} onChange={handleChange} />
                    </FormField>
                    <FormField label="Email">
                      <Input name="doctor2_email" type="email" placeholder="dr2@email.com" value={tpl.doctor2_email} onChange={handleChange} />
                    </FormField>
                    <FormField label="Reg. no">
                      <Input name="doctor2_reg_no" placeholder="343334" value={tpl.doctor2_reg_no} onChange={handleChange} />
                    </FormField>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="secondary">Cancel</Button>
              </ModalClose>
              <Button onClick={handleSave} loading={saving}>
                {saving ? 'Saving…' : 'Save template'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
