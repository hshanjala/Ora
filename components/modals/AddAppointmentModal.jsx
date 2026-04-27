'use client'
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AddAppointmentModal({ onClose, onSuccess, defaultDate }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    patient_id: '',
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
    if (!form.patient_id) { setError('Please select a patient'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('appointments').insert({
      clinic_id: user.id,
      patient_id: form.patient_id,
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

    onSuccess()
    onClose()
  }

  const procedures = [
    'General Checkup', 'Cleaning & Scaling', 'Tooth Extraction',
    'Root Canal', 'Filling', 'Crown & Bridge', 'Teeth Whitening',
    'Braces / Orthodontics', 'Dentures', 'X-Ray', 'Consultation', 'Other'
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Add Appointment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div>
            <label className="label">Patient *</label>
            <select name="patient_id" className="input" value={form.patient_id} onChange={handleChange} required>
              <option value="">Select patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {patients.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No patients found. <a href="/patients" className="underline">Add a patient first.</a></p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input name="date" type="date" className="input" value={form.date} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Time *</label>
              <input name="time" type="time" className="input" value={form.time} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="label">Procedure</label>
            <select name="procedure" className="input" value={form.procedure} onChange={handleChange}>
              <option value="">Select procedure</option>
              {procedures.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select name="status" className="input" value={form.status} onChange={handleChange}>
              <option value="scheduled">Scheduled</option>
              <option value="checked-in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input min-h-[70px] resize-none" placeholder="Any additional notes..." value={form.notes} onChange={handleChange} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Adding...' : 'Add Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
