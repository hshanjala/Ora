'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
    setTimeout(() => setSaved(false), 3000)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (newPassword.length < 6) return
    setChangingPassword(true)

    await supabase.auth.updateUser({ password: newPassword })

    setChangingPassword(false)
    setPasswordSaved(true)
    setNewPassword('')
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="spinner" /></div>
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your clinic information</p>
      </div>

      {/* Clinic Info */}
      <div className="card mb-5">
        <h2 className="font-bold text-slate-800 mb-5 text-lg">Clinic Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Clinic Name</label>
            <input name="clinic_name" className="input" placeholder="Your Clinic Name" value={form.clinic_name} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Doctor / Owner Name</label>
            <input name="doctor_name" className="input" placeholder="Dr. Your Name" value={form.doctor_name} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input name="doctor_phone" className="input" placeholder="01XXXXXXXXX" value={form.doctor_phone} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Clinic Address</label>
            <textarea name="clinic_address" className="input min-h-[80px] resize-none" placeholder="Full clinic address" value={form.clinic_address} onChange={handleChange} />
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="card mb-5">
        <h2 className="font-bold text-slate-800 mb-4 text-lg">Account</h2>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Login Email</p>
          <p className="font-semibold text-slate-800">{user?.email}</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="card mb-5">
        <h2 className="font-bold text-slate-800 mb-4 text-lg">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-11"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={changingPassword || newPassword.length < 6} className="btn-primary">
            {changingPassword ? <Loader2 size={16} className="animate-spin" /> : passwordSaved ? <CheckCircle size={16} /> : null}
            {changingPassword ? 'Updating...' : passwordSaved ? 'Password Updated!' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Subscription Info */}
      <div className="card">
        <h2 className="font-bold text-slate-800 mb-4 text-lg">Subscription</h2>
        <div className="bg-emerald-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-800">Ora Monthly Plan</p>
              <p className="text-xl font-black text-emerald-700">৳299 / month</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 font-semibold">Payment Methods</p>
              <p className="text-sm font-bold text-emerald-800">bKash • Nagad</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <span className="text-pink-600 font-black text-sm">bK</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">bKash</p>
                  <p className="font-bold text-slate-800">01629775202</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-orange-600 font-black text-sm">Ng</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nagad</p>
                  <p className="font-bold text-slate-800">01799900323</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Send ৳299 via bKash or Nagad, then WhatsApp your transaction screenshot to 01629775202.
          Your subscription will be activated within 24 hours.
        </p>
      </div>
    </div>
  )
}
