'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  X, Edit2, ChevronDown, ChevronUp,
  Plus, Loader2, Save, Upload, Image
} from 'lucide-react'

// ── Initials avatar ──────────────────────────────────────────────────────────
function Avatar({ name, size = 50 }) {
  const initials = name
    ? name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#d1fae5', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 600, color: '#065f46',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// ── Single visit row + expandable detail ────────────────────────────────────
function VisitRow({ visit, clinicId }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [images, setImages] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileRef = useRef(null)

  async function loadDetail() {
    if (detail) return
    setLoadingDetail(true)

    const dateStr = visit.date

    // prescription for this patient on this date
    const { data: rx } = await supabase
      .from('prescriptions')
      .select('*, prescription_items(*)')
      .eq('patient_id', visit.patient_id)
      .eq('date', dateStr)
      .limit(1)
      .maybeSingle()

    // invoice for this patient on this date
    const { data: inv } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('patient_id', visit.patient_id)
      .eq('date', dateStr)
      .limit(1)
      .maybeSingle()

    // images
    const { data: imgs } = await supabase
      .from('patient_images')
      .select('*')
      .eq('patient_id', visit.patient_id)
      .eq('visit_date', dateStr)
      .order('created_at')

    setDetail({ rx, inv })
    setImages(imgs || [])
    setLoadingDetail(false)
  }

  async function handleToggle() {
    if (!open) await loadDetail()
    setOpen(o => !o)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)

    const ext = file.name.split('.').pop()
    const path = `${clinicId}/${visit.patient_id}/${visit.date}-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('patient-images')
      .upload(path, file)

    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage
        .from('patient-images')
        .getPublicUrl(path)

      await supabase.from('patient_images').insert({
        clinic_id: clinicId,
        patient_id: visit.patient_id,
        visit_date: visit.date,
        url: publicUrl,
        label: file.name,
        path,
      })

      setImages(prev => [...prev, { url: publicUrl, label: file.name }])
    }

    setUploadingImage(false)
    e.target.value = ''
  }

  // Build subtitle chips
  const chips = []
  if (visit.procedure) chips.push(visit.procedure)
  // We'll show these after load; for now just show procedure

  return (
    <div>
      {/* Row header */}
      <button
        onClick={handleToggle}
        className="w-full text-left"
        style={{
          padding: '12px 18px',
          borderBottom: open ? 'none' : '0.5px solid #e2e8f0',
          borderLeft: open ? '3px solid #059669' : '3px solid transparent',
          background: open ? '#f0fdf4' : 'transparent',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Date square */}
          <div style={{
            width: 38, height: 38,
            background: open ? '#d1fae5' : '#f8fafc',
            border: open ? 'none' : '0.5px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: open ? '#065f46' : '#1e293b', lineHeight: 1.1 }}>
              {format(new Date(visit.date), 'd')}
            </span>
            <span style={{ fontSize: 9, color: open ? '#059669' : '#94a3b8', lineHeight: 1.1, textTransform: 'uppercase' }}>
              {format(new Date(visit.date), 'MMM')}
            </span>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              {visit.procedure || 'Visit'}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
              {visit.time ? format(new Date(`2000-01-01T${visit.time}`), 'h:mm a') : ''}{' '}
              {visit.status && <span style={{
                background: visit.status === 'completed' ? '#d1fae5' : '#f1f5f9',
                color: visit.status === 'completed' ? '#065f46' : '#64748b',
                padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600,
              }}>{visit.status}</span>}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp size={14} color="#059669" />
          : <ChevronDown size={14} color="#94a3b8" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{
          background: '#f8fafc',
          borderBottom: '0.5px solid #e2e8f0',
          padding: '14px 18px 16px 22px',
        }}>
          {loadingDetail ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <Loader2 size={18} className="animate-spin" style={{ color: '#059669' }} />
            </div>
          ) : (
            <>
              {/* Treatment */}
              {visit.notes && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 5px' }}>Treatment notes</p>
                  <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px' }}>
                    <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{visit.notes}</p>
                  </div>
                </div>
              )}

              {/* Prescription */}
              {detail?.rx ? (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 5px' }}>Prescription</p>
                  <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px' }}>
                    {detail.rx.diagnosis && (
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: '0 0 6px' }}>
                        Diagnosis: {detail.rx.diagnosis}
                      </p>
                    )}
                    {detail.rx.prescription_items?.map((med, i) => (
                      <p key={i} style={{ fontSize: 12, color: '#475569', margin: '0 0 3px' }}>
                        • {med.medicine}{med.dosage ? ` ${med.dosage}` : ''}{med.frequency ? ` — ${med.frequency}` : ''}{med.duration ? ` · ${med.duration}` : ''}
                      </p>
                    ))}
                    {detail.rx.notes && (
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, marginBottom: 0, fontStyle: 'italic' }}>
                        Note: {detail.rx.notes}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 12 }}>No prescription for this visit</p>
              )}

              {/* Invoice */}
              {detail?.inv ? (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 5px' }}>Invoice</p>
                  <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                        {detail.inv.invoice_number} · ৳{detail.inv.total?.toLocaleString()}
                      </p>
                      {detail.inv.invoice_items?.map((item, i) => (
                        <p key={i} style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                          {item.description} × {item.quantity}
                        </p>
                      ))}
                    </div>
                    <span style={{
                      background: detail.inv.status === 'paid' ? '#d1fae5' : detail.inv.status === 'partial' ? '#fef3c7' : '#fee2e2',
                      color: detail.inv.status === 'paid' ? '#065f46' : detail.inv.status === 'partial' ? '#854d0e' : '#991b1b',
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    }}>
                      {detail.inv.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 12 }}>No invoice for this visit</p>
              )}

              {/* Images */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 7px' }}>
                  X-rays & Oral Images
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {images.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', width: 56, height: 56 }}
                    >
                      <img
                        src={img.url}
                        alt={img.label || 'Image'}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '0.5px solid #e2e8f0' }}
                      />
                    </a>
                  ))}

                  {/* Upload button */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImage}
                    style={{
                      width: 56, height: 56,
                      background: '#fff',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 8,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 3, cursor: 'pointer',
                    }}
                  >
                    {uploadingImage
                      ? <Loader2 size={14} className="animate-spin" style={{ color: '#059669' }} />
                      : <Plus size={14} style={{ color: '#94a3b8' }} />
                    }
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>Upload</span>
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Edit patient info modal ──────────────────────────────────────────────────
function EditModal({ patient, onClose, onSaved }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    name: patient.name || '',
    phone: patient.phone || '',
    email: patient.email || '',
    age: patient.age || '',
    gender: patient.gender || '',
    address: patient.address || '',
    medical_history: patient.medical_history || '',
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
    }).eq('id', patient.id)
    setSaving(false)
    onSaved(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Edit Patient</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input name="name" className="input" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Age</label>
              <input name="age" type="number" min="0" max="120" className="input" placeholder="e.g. 35" value={form.age} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select name="gender" className="input" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input name="address" className="input" value={form.address} onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="label">Medical History / Allergies</label>
              <textarea name="medical_history" className="input min-h-[80px] resize-none" value={form.medical_history} onChange={handleChange} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── MAIN PANEL ───────────────────────────────────────────────────────────────
export default function PatientPanel({ patient: initialPatient, onClose }) {
  const supabase = createClient()
  const [patient, setPatient] = useState(initialPatient)
  const [clinicId, setClinicId] = useState(null)
  const [visits, setVisits] = useState([])
  const [stats, setStats] = useState({ visits: 0, spent: 0, dues: 0 })
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setClinicId(user.id)

      // All appointments for this patient
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patient.id)
        .order('date', { ascending: false })

      setVisits(appts || [])

      // Stats from invoices
      const { data: invs } = await supabase
        .from('invoices')
        .select('total, paid_amount, status')
        .eq('patient_id', patient.id)

      const spent = invs?.reduce((s, i) => s + (i.paid_amount || 0), 0) || 0
      const dues  = invs?.reduce((s, i) => s + (i.status !== 'paid' ? ((i.total || 0) - (i.paid_amount || 0)) : 0), 0) || 0

      setStats({ visits: appts?.length || 0, spent, dues })
      setLoading(false)
    }
    load()
  }, [patient.id])

  // Close on ESC
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const age = patient.age || null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 480,
          background: '#fff',
          zIndex: 50,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          animation: 'slideInRight 0.22s ease',
          overflowY: 'auto',
        }}
      >
        {/* ── TOP: Profile ── */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '0.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={patient.name} size={50} />
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: 0 }}>{patient.name}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
                  {[patient.gender, age ? `${age} yrs` : null, `Patient since ${format(new Date(patient.created_at), 'MMM yyyy')}`].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setShowEdit(true)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '0.5px solid #e2e8f0',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={14} color="#64748b" />
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '0.5px solid #e2e8f0',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 12 }}>
            {[
              ['Phone', patient.phone],
              ['Email', patient.email],
              ['Address', patient.address],
              ['Blood Group', null],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: val ? 600 : 400, color: val ? '#1e293b' : '#cbd5e1', margin: 0 }}>
                  {val || '—'}
                </p>
              </div>
            ))}
          </div>

          {patient.medical_history && (
            <div style={{ background: '#fff7ed', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#854d0e', margin: '0 0 3px' }}>Medical history / allergies</p>
              <p style={{ fontSize: 12, color: '#633806', margin: 0 }}>{patient.medical_history}</p>
            </div>
          )}
        </div>

        {/* ── STATS ── */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '0.5px solid #e2e8f0' }}>
          {[
            { label: 'Total visits', value: stats.visits, color: '#1e293b' },
            { label: 'Total spent', value: `৳${stats.spent.toLocaleString()}`, color: '#065f46' },
            { label: 'Dues', value: `৳${stats.dues.toLocaleString()}`, color: stats.dues > 0 ? '#b91c1c' : '#065f46' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, background: '#f8fafc', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 3px' }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 600, color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── VISIT HISTORY ── */}
        <div style={{ padding: '10px 20px 8px', background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
            Visit history · tap a date to expand
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: '#059669' }} />
          </div>
        ) : visits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
            <p style={{ fontSize: 14, margin: 0 }}>No visits recorded yet</p>
          </div>
        ) : (
          <div>
            {visits.map(visit => (
              <VisitRow
                key={visit.id}
                visit={{ ...visit, patient_id: patient.id }}
                clinicId={clinicId}
              />
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <EditModal
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setPatient(prev => ({ ...prev, ...updated }))}
        />
      )}

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
