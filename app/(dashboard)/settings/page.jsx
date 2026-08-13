'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import {
  Button, IconButton, Card, CardHeader, CardBody, PageHeader,
  FormField, Input, Textarea, Skeleton, SkeletonText, Eyebrow, useToast,
} from '@/components/ui'
import {
  PaymentInstructions, PaymentMethodList, MONTHLY_PRICE, SUPPORT_NUMBER,
} from '@/components/billing/payment-methods'

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-5"><SkeletonText lines={4} /></Card>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [user, setUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [form, setForm] = useState({
    clinic_name: '',
    doctor_name: '',
    doctor_phone: '',
    clinic_address: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('clinic_id', user.id)
        .single()

      if (data) {
        setForm({
          clinic_name: data.clinic_name || '',
          doctor_name: data.doctor_name || '',
          doctor_phone: data.doctor_phone || '',
          clinic_address: data.clinic_address || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    await supabase
      .from('clinic_settings')
      .update({
        clinic_name: form.clinic_name,
        doctor_name: form.doctor_name,
        doctor_phone: form.doctor_phone,
        clinic_address: form.clinic_address,
      })
      .eq('clinic_id', user.id)

    setSaving(false)
    setSaved(true)
    toast.success('Clinic information saved')
    setTimeout(() => setSaved(false), 3000)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) return
    setChangingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setChangingPassword(false)
    if (error) {
      setPasswordError(error.message)
      return
    }
    setNewPassword('')
    toast.success('Password updated')
  }

  const page = (content) => (
    <div className="mx-auto max-w-3xl p-4 md:p-6">{content}</div>
  )

  if (loading) return page(<SettingsSkeleton />)

  return page(
    <>
      <PageHeader title="Settings" subtitle="Manage your clinic information" />

      <div className="space-y-4">
        {/* Clinic info */}
        <Card>
          <CardHeader title="Clinic information" subtitle="Appears on invoices and prescriptions" />
          <CardBody>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Clinic name">
                  <Input name="clinic_name" placeholder="Your clinic name" value={form.clinic_name} onChange={handleChange} />
                </FormField>
                <FormField label="Doctor / owner name">
                  <Input name="doctor_name" placeholder="Dr. Your Name" value={form.doctor_name} onChange={handleChange} />
                </FormField>
                <FormField label="Phone number">
                  <Input name="doctor_phone" placeholder="01XXXXXXXXX" value={form.doctor_phone} onChange={handleChange} />
                </FormField>
                <FormField label="Clinic address" className="sm:col-span-2">
                  <Textarea name="clinic_address" rows={2} placeholder="Full clinic address" value={form.clinic_address} onChange={handleChange} />
                </FormField>
              </div>
              <Button type="submit" loading={saving}>
                {saved && !saving
                  ? <CheckCircle2 size={15} strokeWidth={1.75} />
                  : !saving && <Save size={15} strokeWidth={1.75} />}
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader title="Account" />
          <CardBody>
            <div className="rounded-md bg-surface-subtle p-3.5">
              <Eyebrow>Login email</Eyebrow>
              <p className="mt-0.5 text-body-md text-primary">{user?.email}</p>
            </div>
          </CardBody>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader title="Change password" />
          <CardBody>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <FormField
                label="New password"
                hint="Minimum 6 characters"
                error={passwordError || undefined}
                className="max-w-sm"
              >
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    className="pr-10"
                    required
                  />
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    {showPassword
                      ? <EyeOff size={15} strokeWidth={1.75} />
                      : <Eye size={15} strokeWidth={1.75} />}
                  </IconButton>
                </div>
              </FormField>
              <Button
                type="submit"
                loading={changingPassword}
                disabled={newPassword.length < 6}
              >
                {changingPassword ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader
            title="Subscription"
            subtitle={`Ora monthly plan · ${MONTHLY_PRICE}/month`}
          />
          <CardBody className="space-y-3">
            <PaymentInstructions />
            <PaymentMethodList onCopied={(m) => toast.success('Number copied', `${m.label} · ${m.number}`)} />
            <p className="text-center text-label text-tertiary">
              Send {MONTHLY_PRICE} via bKash or Nagad, then WhatsApp your transaction screenshot to{' '}
              <span className="tabular">{SUPPORT_NUMBER}</span>. Your subscription is activated within 24 hours.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
