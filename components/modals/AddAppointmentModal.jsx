'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AddAppointmentModal({ onClose, onSuccess, defaultDate }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [patientQuery, setPatientQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const [form, setForm] = useState({
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePatientInput(e) {
    setPatientQuery(e.target.value)
    setSelectedPatientId(null)
    setShowSuggestions(true)
  }

  function handleSelectPatient(patient) {
    setPatientQuery(patient.name)
    setSelectedPatientId(patient.id)
    setShowSuggestions(false)
  }

  function handlePatientFocus() {
    if (patientQuery.length >= 0) setShowSuggestions(true)
  }

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientQuery.toLowerCase())
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!patientQuery.trim()) {
      setError('Please enter a patient name.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    let patientId = selectedPatientId

    // If no existing patient selected, create a new one — is_active: false
    // so they don't appear in Patients list until appointment is completed
    if (!patientId && patientQuery.trim()) {
      const { data: newPatient } = await supabase
        .from('patients')
        .insert({ clinic_id: user.id, name: patientQuery.trim(), is_active: false })
        .select()
        .single()
      patientId = newPatient?.id || null
    }

    const { error } = await supabase.from('appointments').insert({
      clinic_id: user.id,
      patient_id: patientId,
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="relative">
            <label className="label">Patient *</label>
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Type patient name..."
              value={patientQuery}
              onChange={handlePatientInput}
              onFocus={handlePatientFocus}
              autoComplete="off"
            />
            {showSuggestions && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto"
              >
                {filteredPatients.length > 0 ? (
                  <>
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors first:rounded-t-xl last:rounded-b-xl font-medium"
                      >
                        {p.name}
                      </button>
                    ))}
                    {patientQuery.trim() &&
                      !filteredPatients.some(p => p.name.toLowerCase() === patientQuery.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => { setShowSuggestions(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 border-t border-slate-100 transition-colors last:rounded-b-xl font-semibold"
                        >
                          + Add &quot;{patientQuery}&quot; as new patient
                        </button>
                      )}
                  </>
                ) : patientQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => { setShowSuggestions(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors rounded-xl font-semibold"
                  >
                    + Add &quot;{patientQuery}&quot; as new patient
                  </button>
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-400">
                    Start typing to search patients...
                  </p>
                )}
              </div>
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
            <textarea name="notes" className="input min-h-[70px] resize-none"
              placeholder="Any additional notes..." value={form.notes} onChange={handleChange} />
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
