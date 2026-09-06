'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'
import { Button, Card, FormField, Input, Alert, Divider } from '@/components/ui'

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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) {
      setError('Google sign-up failed. Please try again.')
      setGoogleLoading(false)
    }
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

      <Button
        variant="secondary"
        size="lg"
        className="mt-5 w-full"
        onClick={handleGoogleSignUp}
        loading={googleLoading}
      >
        {!googleLoading && (
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
          </svg>
        )}
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </Button>

      <div className="my-5 flex items-center gap-3">
        <Divider className="flex-1" />
        <span className="text-label text-tertiary">or register with email</span>
        <Divider className="flex-1" />
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
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
        ৳350/month after the 14-day trial · cancel anytime
      </p>
      <p className="mt-3 text-center text-small text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-accent-text hover:underline">Sign in</Link>
      </p>
    </Card>
  )
}
