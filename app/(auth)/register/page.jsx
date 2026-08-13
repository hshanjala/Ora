'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'
import { Button, Card, FormField, Input, Alert } from '@/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    clinicName: '',
    doctorName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // 2. Create clinic settings record
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)

      await supabase.from('clinic_settings').insert({
        clinic_id: data.user.id,
        clinic_name: formData.clinicName,
        doctor_name: formData.doctorName,
        phone: formData.phone,
        trial_end: trialEnd.toISOString().split('T')[0],
        subscription_status: 'trial',
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="p-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success">
          <CheckCircle2 size={24} strokeWidth={1.75} />
        </span>
        <h2 className="text-h2 text-primary">Account created</h2>
        <p className="mt-1 text-small text-secondary">
          Check your email <span className="text-primary">{formData.email}</span> and click the
          confirmation link to activate your account.
        </p>
        <Button className="mt-5 w-full" size="lg" onClick={() => router.push('/login')}>
          Go to login
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-h2 text-primary">Create your clinic</h2>
      <p className="mt-0.5 text-small text-secondary">
        14-day free trial · no payment required to start
      </p>

      {error && <Alert status="danger" className="mt-4">{error}</Alert>}

      <form onSubmit={handleRegister} className="mt-5 space-y-4">
        <FormField label="Clinic name" required>
          <Input name="clinicName" placeholder="Smile Dental BD" value={formData.clinicName} onChange={handleChange} required />
        </FormField>
        <FormField label="Doctor / owner name" required>
          <Input name="doctorName" placeholder="Dr. Rahman" value={formData.doctorName} onChange={handleChange} required />
        </FormField>
        <FormField label="Phone number">
          <Input name="phone" type="tel" placeholder="01XXXXXXXXX" value={formData.phone} onChange={handleChange} />
        </FormField>
        <FormField label="Email address" required>
          <Input name="email" type="email" placeholder="doctor@clinic.com" value={formData.email} onChange={handleChange} autoComplete="email" required />
        </FormField>
        <FormField label="Password" required hint="Minimum 6 characters">
          <Input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} autoComplete="new-password" minLength={6} required />
        </FormField>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? 'Creating account…' : 'Start free trial'}
        </Button>
      </form>

      <p className="mt-4 text-center text-label text-tertiary">
        ৳299/month after the 14-day trial · cancel anytime
      </p>
      <p className="mt-3 text-center text-small text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-accent-text hover:underline">Sign in</Link>
      </p>
    </Card>
  )
}
