'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddPrescriptionModal from '@/components/modals/AddPrescriptionModal'
import { Plus, Search, Pill, X, Printer, Trash2, Settings2, Check } from 'lucide-react'
import { format } from 'date-fns'

// ── Build print HTML ──────────────────────────────────────────────────────────
function buildPrintHtml(template, tpl, prescription, items) {
  const clinic  = tpl.clinic_name || 'Ora Dental Clinic'
  const doctor  = tpl.doctor_name || ''
  const desig   = tpl.doctor_designation || ''
  const sub     = tpl.doctor_subtext || ''
  const reg     = tpl.doctor_reg_no || ''
  const phone   = tpl.doctor_phone || ''
  const email   = tpl.doctor_email || ''
  const addr    = tpl.clinic_address || ''
  const logo    = tpl.clinic_logo_url || ''
  const d2name  = tpl.doctor2_name || ''
  const d2desig = tpl.doctor2_designation || ''
  const d2sub   = tpl.doctor2_subtext || ''
  const d2email = tpl.doctor2_email || ''
  const d2reg   = tpl.doctor2_reg_no || ''
  const pat     = prescription.patients?.name || '—'
  const age     = prescription.patients?.age || ''
  const gender  = prescription.patients?.gender || ''
  const date    = format(new Date(prescription.date), 'dd/MM/yyyy')

  const baseStyle = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;font-size:13px}
    .page{padding:32px 40px;min-height:100vh;position:relative}
    .patient-row{display:flex;gap:24px;background:#f8fafc;border:1px solid #e2e8f0;padding:8px 14px;margin-bottom:20px;font-size:12px;color:#475569}
    .patient-row strong{color:#1e293b}
    .body-cols{display:flex;min-height:420px}
    .left-col{width:140px;padding-right:16px;border-right:1px solid #cbd5e1;padding-top:8px}
    .right-col{flex:1;padding-left:20px;padding-top:8px}
    .cl-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;margin-top:16px}
    .cl-label:first-child{margin-top:0}
    .cl-value{font-size:12px;color:#1e293b}
    .rx{font-size:20px;font-weight:800;color:#065f46;margin-bottom:10px;font-style:italic}
    .med-row{margin-bottom:10px}
    .med-name{font-weight:700;font-size:13px;color:#1e293b}
    .med-detail{font-size:12px;color:#64748b;margin-top:1px}
    .adv-box{background:#fefce8;border-left:3px solid #eab308;padding:8px 12px;margin-top:14px;font-size:12px}
    .fl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;font-weight:600}
    .fv{font-size:13px;font-weight:600;color:#1e293b;margin-bottom:10px}
    .sig{margin-top:48px;display:flex;justify-content:flex-end}
    .sig-line{border-top:1px solid #1e293b;width:180px;text-align:center;padding-top:5px;font-size:10px;color:#94a3b8}
    .footer-bar{border-top:1px solid #e2e8f0;padding:8px 14px;display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-top:32px}`

  // Patient row (used in T1, T2, T3)
  const patRow = `
    <div class="patient-row">
      <span>Name: <strong>${pat}</strong></span>
      ${age ? `<span>Age: <strong>${age}y</strong></span>` : ''}
      ${gender ? `<span>Gender: <strong>${gender}</strong></span>` : ''}
      <span>Date: <strong>${date}</strong></span>
    </div>`

  // Two-column body (T1 and T2)
  const twoColBody = `
    <div class="body-cols">
      <div class="left-col">
        ${prescription.chief_complaint ? `<div class="cl-label">C/C</div><div class="cl-value">${prescription.chief_complaint}</div>` : ''}
        ${prescription.diagnosis ? `<div class="cl-label" style="margin-top:20px">O/E</div><div class="cl-value">${prescription.diagnosis}</div>` : ''}
        ${prescription.advice ? `<div class="cl-label" style="margin-top:20px">Adv</div><div class="cl-value">${prescription.advice}</div>` : ''}
      </div>
      <div class="right-col">
        <div class="rx">R<sub>x</sub></div>
        ${items.map((item, i) => `
          <div class="med-row">
            <div class="med-name">${i + 1}. ${item.medicine}</div>
            <div class="med-detail">${[item.frequency, item.duration, item.instructions].filter(Boolean).join(' , ')}</div>
          </div>`).join('')}
      </div>
    </div>`

  // Single column body (T3)
  const singleColBody = `
    <div style="padding-top:4px">
      ${prescription.chief_complaint ? `<div class="fl">C/C — Chief Complaint</div><div class="fv">${prescription.chief_complaint}</div>` : ''}
      ${prescription.diagnosis ? `<div class="fl">O/E — On Examination</div><div class="fv">${prescription.diagnosis}</div>` : ''}
      <div class="rx" style="margin-top:8px">R<sub>x</sub></div>
      ${items.map((item, i) => `
        <div class="med-row">
          <div class="med-name">${i + 1}. ${item.medicine}</div>
          <div class="med-detail">${[item.frequency, item.duration, item.instructions].filter(Boolean).join(' , ')}</div>
        </div>`).join('')}
      ${prescription.advice ? `<div class="adv-box"><strong>Adv:</strong> ${prescription.advice}</div>` : ''}
      ${prescription.notes ? `<div style="margin-top:14px"><div class="fl">Doctor's Notes</div><div class="fv">${prescription.notes}</div></div>` : ''}
      <div class="sig"><div class="sig-line">Doctor's Signature</div></div>
    </div>`

  // Doctor info block helper
  function drBlock(name, dg, sb, em, rg, align = 'left') {
    const ta = align === 'right' ? 'text-align:right' : ''
    return `
      <div style="${ta}">
        <div style="font-size:16px;font-weight:800;color:#1e293b">${name}</div>
        ${dg ? `<div style="font-size:12px;color:#475569;margin-top:1px">${dg}</div>` : ''}
        ${sb ? `<div style="font-size:11px;color:#64748b;margin-top:1px">${sb}</div>` : ''}
        ${em ? `<div style="font-size:11px;color:#64748b">${em}</div>` : ''}
        ${rg ? `<div style="font-size:11px;color:#94a3b8">Reg No: ${rg}</div>` : ''}
      </div>`
  }

  let header = ''

  // ── TEMPLATE 1 ──────────────────────────────────────────────────────────────
  // Logo+Address LEFT | Doctor info RIGHT
  if (template === 1) {
    header = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px">
        <div style="display:flex;flex-direction:column;gap:6px">
          ${logo ? `<img src="${logo}" style="height:56px;object-fit:contain;object-position:left" />` : `<div style="font-size:18px;font-weight:800;color:#065f46">${clinic}</div>`}
          ${addr ? `<div style="font-size:11px;color:#64748b">${addr}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:17px;font-weight:800;color:#1e293b">${doctor}</div>
          ${desig ? `<div style="font-size:12px;color:#475569;margin-top:1px">${desig}</div>` : ''}
          ${sub ? `<div style="font-size:11px;color:#64748b;margin-top:1px">${sub}</div>` : ''}
          ${phone ? `<div style="font-size:11px;color:#64748b">${phone}</div>` : ''}
          ${email ? `<div style="font-size:11px;color:#64748b">${email}</div>` : ''}
          ${reg ? `<div style="font-size:11px;color:#94a3b8">Reg No: ${reg}</div>` : ''}
        </div>
      </div>`
    return `<!DOCTYPE html><html><head><title>Prescription - ${pat}</title>
<style>${baseStyle}</style></head><body><div class="page">
${header}${patRow}${twoColBody}
</div></body></html>`
  }

  // ── TEMPLATE 2 ──────────────────────────────────────────────────────────────
  // Doctor1 LEFT | Logo CENTER | Doctor2 RIGHT | Footer: Address + Phone
  if (template === 2) {
    header = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px">
        ${drBlock(doctor, desig, sub, email, reg, 'left')}
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 16px">
          ${logo ? `<img src="${logo}" style="width:72px;height:72px;object-fit:contain" />` : `<div style="width:72px;height:72px;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8">Logo</div>`}
        </div>
        ${drBlock(d2name, d2desig, d2sub, d2email, d2reg, 'right')}
      </div>`
    const footer = `
      <div class="footer-bar">
        <span>${addr}</span>
        <span>${phone}</span>
      </div>`
    return `<!DOCTYPE html><html><head><title>Prescription - ${pat}</title>
<style>${baseStyle}</style></head><body><div class="page">
${header}${patRow}${twoColBody}${footer}
</div></body></html>`
  }

  // ── TEMPLATE 3 ──────────────────────────────────────────────────────────────
  // Doctor LEFT | Clinic Name+Address+Phone RIGHT | Single col body
  if (template === 3) {
    header = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px">
        <div>
          <div style="font-size:17px;font-weight:800;color:#1e293b">${doctor}</div>
          ${desig ? `<div style="font-size:12px;color:#475569;margin-top:1px">${desig}</div>` : ''}
          ${sub ? `<div style="font-size:11px;color:#64748b;margin-top:1px">${sub}</div>` : ''}
          ${email ? `<div style="font-size:11px;color:#64748b">${email}</div>` : ''}
          ${reg ? `<div style="font-size:11px;color:#94a3b8">Reg No: ${reg}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:800;color:#065f46">${clinic}</div>
          ${addr ? `<div style="font-size:11px;color:#64748b;margin-top:3px">${addr}</div>` : ''}
          ${phone ? `<div style="font-size:11px;color:#64748b">${phone}</div>` : ''}
        </div>
      </div>`
    return `<!DOCTYPE html><html><head><title>Prescription - ${pat}</title>
<style>${baseStyle}</style></head><body><div class="page">
${header}${patRow}${singleColBody}
</div></body></html>`
  }

  return ''
}

// ── Template Setup Modal ──────────────────────────────────────────────────────
function TemplateSetupModal({ onClose, onSaved }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
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
    load()
  }, [])

  function handleChange(e) {
    setTpl(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    let logo_url = tpl.clinic_logo_url
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${user.id}/logo.${ext}`
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
    onClose()
  }

  const TEMPLATES = [
    { id: 1, label: 'T1', desc: 'Logo + Doctor' },
    { id: 2, label: 'T2', desc: '2 Doctors' },
    { id: 3, label: 'T3', desc: 'Clinic Right' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Prescription Template</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">

            {/* Template picker */}
            <div>
              <label className="label">Template Style</label>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.id} type="button"
                    onClick={() => setTpl(prev => ({ ...prev, prescription_template: t.id }))}
                    className={`relative border-2 rounded-xl p-4 text-center transition-all ${
                      tpl.prescription_template === t.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    {tpl.prescription_template === t.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                    <div className="text-xl font-black text-slate-700 mb-1">{t.label}</div>
                    <div className="text-xs text-slate-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor 1 + Clinic info — always shown */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                  {tpl.prescription_template === 2 ? 'Doctor 1 Info' : 'Doctor Info'}
                </p>
                <div>
                  <label className="label">Full Name</label>
                  <input name="doctor_name" className="input" placeholder="Dr. Hanjala Hossen" value={tpl.doctor_name} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Designation</label>
                  <input name="doctor_designation" className="input" placeholder="Dental Surgeon" value={tpl.doctor_designation} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Sub Text</label>
                  <input name="doctor_subtext" className="input" placeholder="BDS(SSAMML,Dhaka), FCPS..." value={tpl.doctor_subtext} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Reg. No</label>
                  <input name="doctor_reg_no" className="input" placeholder="343333" value={tpl.doctor_reg_no} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="doctor_phone" className="input" placeholder="+8801629775303" value={tpl.doctor_phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input name="doctor_email" className="input" placeholder="dr@email.com" value={tpl.doctor_email} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Clinic Info</p>
                <div>
                  <label className="label">Clinic Name</label>
                  <input name="clinic_name" className="input" placeholder="Ora Dental Clinic" value={tpl.clinic_name} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input name="clinic_address" className="input" placeholder="Kabir Khan Market, Dhaka" value={tpl.clinic_address} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Clinic Logo</label>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} className="w-14 h-14 rounded-xl object-contain border border-slate-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">Logo</div>
                    )}
                    <label className="btn-secondary cursor-pointer text-sm">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor 2 — only shown for Template 2 */}
            {tpl.prescription_template === 2 && (
              <div className="border border-dashed border-emerald-300 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-emerald-700 pb-2 border-b border-emerald-100">Doctor 2 Info <span className="text-xs font-normal text-slate-400">(Template 2 only)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Full Name</label>
                    <input name="doctor2_name" className="input" placeholder="Dr. Second Doctor" value={tpl.doctor2_name} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="label">Designation</label>
                    <input name="doctor2_designation" className="input" placeholder="Dental Surgeon" value={tpl.doctor2_designation} onChange={handleChange} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Sub Text</label>
                    <input name="doctor2_subtext" className="input" placeholder="BDS(SSAMML,Dhaka), FCPS..." value={tpl.doctor2_subtext} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input name="doctor2_email" className="input" placeholder="dr2@email.com" value={tpl.doctor2_email} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="label">Reg. No</label>
                    <input name="doctor2_reg_no" className="input" placeholder="343334" value={tpl.doctor2_reg_no} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Prescription Detail Modal ─────────────────────────────────────────────────
function PrescriptionDetailModal({ prescription, onClose, tplSettings }) {
  const supabase = createClient()
  const [items, setItems] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('prescription_items').select('*')
        .eq('prescription_id', prescription.id)
      setItems(data || [])
    }
    load()
  }, [prescription.id])

  function handlePrint() {
    const win = window.open('', '_blank')
    win.document.write(buildPrintHtml(
      tplSettings?.prescription_template || 1,
      tplSettings || {},
      prescription,
      items
    ))
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Prescription</h2>
            <p className="text-sm text-slate-500">{prescription.patients?.name} · {format(new Date(prescription.date), 'MMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary !px-3 !py-2">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {(prescription.chief_complaint || prescription.diagnosis) && (
            <div className="grid grid-cols-2 gap-3">
              {prescription.chief_complaint && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-600 mb-1">C/C — Chief Complaint</p>
                  <p className="text-sm text-slate-700">{prescription.chief_complaint}</p>
                </div>
              )}
              {prescription.diagnosis && (
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-emerald-600 mb-1">O/E — On Examination</p>
                  <p className="text-sm text-slate-700">{prescription.diagnosis}</p>
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-3">℞ Prescribed Medicines</p>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">No medicines listed</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-3">
                    <p className="font-bold text-slate-800 text-sm mb-1">{i + 1}. {item.medicine}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {item.frequency && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{item.frequency}</span>}
                      {item.duration && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.duration}</span>}
                      {item.instructions && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{item.instructions}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {prescription.advice && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl p-3">
              <p className="text-xs font-bold text-yellow-700 mb-1">Adv — Advice</p>
              <p className="text-sm text-slate-700">{prescription.advice}</p>
            </div>
          )}
          {prescription.notes && (
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-600 mb-1">Doctor&apos;s Notes</p>
              <p className="text-sm text-slate-700">{prescription.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PrescriptionsPage() {
  const supabase = createClient()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [tplSettings, setTplSettings] = useState(null)

  async function loadPrescriptions() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('prescriptions')
      .select('*, patients(name, age, gender), prescription_items(id)')
      .eq('clinic_id', user.id)
      .order('created_at', { ascending: false })
    setPrescriptions(data || [])
    setLoading(false)
  }

  async function loadTplSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('clinic_settings')
      .select('*').eq('clinic_id', user.id).single()
    if (data) setTplSettings(data)
  }

  useEffect(() => {
    loadPrescriptions()
    loadTplSettings()
  }, [])

  async function deletePrescription(id) {
    if (!confirm('Delete this prescription?')) return
    await supabase.from('prescriptions').delete().eq('id', id)
    loadPrescriptions()
  }

  const filtered = prescriptions.filter(rx =>
    (rx.patients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (rx.diagnosis || '').toLowerCase().includes(search.toLowerCase()) ||
    (rx.chief_complaint || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Prescriptions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplate(true)} className="btn-secondary flex items-center gap-1.5">
            <Settings2 size={16} /> Template
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /> New Prescription
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Search by patient name, complaint or findings..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Pill size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">{search ? 'No prescriptions match your search' : 'No prescriptions yet'}</p>
            {!search && (
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={16} /> New Prescription
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-th">Date</th>
                <th className="table-th">Patient</th>
                <th className="table-th">C/C</th>
                <th className="table-th">O/E</th>
                <th className="table-th">Medicines</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rx => (
                <tr key={rx.id} className="table-tr cursor-pointer" onClick={() => setSelected(rx)}>
                  <td className="table-td text-slate-500 whitespace-nowrap">{format(new Date(rx.date), 'MMM d, yyyy')}</td>
                  <td className="table-td font-semibold">{rx.patients?.name || '—'}</td>
                  <td className="table-td text-slate-500 max-w-[140px] truncate">{rx.chief_complaint || <span className="text-slate-300">—</span>}</td>
                  <td className="table-td text-slate-500 max-w-[140px] truncate">{rx.diagnosis || <span className="text-slate-300">—</span>}</td>
                  <td className="table-td">
                    <span className="badge-blue">{rx.prescription_items?.length || 0} medicine{rx.prescription_items?.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="table-td" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(rx)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View & Print">
                        <Printer size={15} />
                      </button>
                      <button onClick={() => deletePrescription(rx.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showTemplate && (
        <TemplateSetupModal
          onClose={() => setShowTemplate(false)}
          onSaved={data => setTplSettings(prev => ({ ...prev, ...data }))}
        />
      )}
      {showModal && (
        <AddPrescriptionModal onClose={() => setShowModal(false)} onSuccess={loadPrescriptions} />
      )}
      {selected && (
        <PrescriptionDetailModal
          prescription={selected}
          onClose={() => setSelected(null)}
          tplSettings={tplSettings}
        />
      )}
    </div>
  )
}
