'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Account created!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Please check your email <strong>{formData.email}</strong> and click the confirmation link to activate your account.
          </p>
          <Link href="/login" className="btn-primary justify-center w-full">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4">
            <span className="text-3xl font-black text-emerald-700">O</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Ora</h1>
          <p className="text-emerald-300 mt-1 text-sm">Start your 14-day free trial</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Create your clinic</h2>
          <p className="text-slate-500 text-sm mb-6">No payment required to start</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="label">Clinic Name</label>
              <input name="clinicName" type="text" className="input" placeholder="Smile Dental BD" value={formData.clinicName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Doctor / Owner Name</label>
              <input name="doctorName" type="text" className="input" placeholder="Dr. Rahman" value={formData.doctorName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input name="phone" type="tel" className="input" placeholder="01XXXXXXXXX" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" className="input" placeholder="doctor@clinic.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} required minLength={6} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Start Free Trial →'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            ৳299/month after 14-day trial • Cancel anytime
          </p>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
