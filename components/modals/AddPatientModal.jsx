'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AddPatientModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    date_of_birth: '', gender: '',
    address: '', medical_history: ''
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
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      address: form.address || null,
      medical_history: form.medical_history || null,
    })

    if (error) {
      setError('Failed to add patient. Please try again.')
      setLoading(false)
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Add New Patient</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input name="name" className="input" placeholder="Patient's full name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" placeholder="01XXXXXXXXX" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" placeholder="patient@email.com" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input name="date_of_birth" type="date" className="input" value={form.date_of_birth} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select name="gender" className="input" value={form.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input name="address" className="input" placeholder="Full address" value={form.address} onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="label">Medical History / Notes</label>
              <textarea name="medical_history" className="input min-h-[80px] resize-none" placeholder="Allergies, chronic conditions, previous treatments..." value={form.medical_history} onChange={handleChange} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Adding...' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
