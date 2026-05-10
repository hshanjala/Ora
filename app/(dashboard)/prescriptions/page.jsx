'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddPrescriptionModal from '@/components/modals/AddPrescriptionModal'
import { Plus, Search, Pill, X, Printer, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

function PrescriptionDetailModal({ prescription, onClose }) {
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
    win.document.write(`<!DOCTYPE html><html><head><title>Prescription - ${prescription.patients?.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;font-size:14px}
.clinic{font-size:22px;font-weight:800;color:#065f46}
.sub{color:#64748b;font-size:13px;margin-top:2px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0}
.section{margin-bottom:16px}
.field-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;font-weight:600}
.field-value{font-size:14px;font-weight:600;color:#1e293b}
.patient-row{display:flex;gap:32px;background:#f8fafc;border-radius:8px;padding:10px 14px;margin-bottom:16px}
.patient-item{font-size:13px;color:#475569}
.patient-item strong{color:#1e293b}
.rx-symbol{font-size:22px;font-weight:800;color:#065f46;margin-bottom:8px}
.med-row{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
.med-name{font-weight:700;color:#1e293b;margin-bottom:3px}
.med-detail{color:#64748b;font-size:12px}
.adv-box{background:#fefce8;border-left:3px solid #eab308;padding:10px 14px;border-radius:0 8px 8px 0;margin-top:16px;font-size:13px}
.sig{margin-top:48px;display:flex;justify-content:flex-end}
.sig-line{border-top:1px solid #1e293b;width:180px;text-align:center;padding-top:6px;font-size:11px;color:#94a3b8}
.footer{text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:12px;margin-top:32px}
</style></head><body>
<div class="clinic">Ora Dental Clinic</div>
<div class="sub">Prescription</div>
<div class="patient-row">
  <span class="patient-item">Patient: <strong>${prescription.patients?.name || '—'}</strong></span>
  <span class="patient-item">Date: <strong>${format(new Date(prescription.date), 'MMMM d, yyyy')}</strong></span>
</div>
${prescription.chief_complaint ? `<div class="section"><div class="field-label">C/C — Chief Complaint</div><div class="field-value">${prescription.chief_complaint}</div></div>` : ''}
${prescription.diagnosis ? `<div class="section"><div class="field-label">O/E — On Examination</div><div class="field-value">${prescription.diagnosis}</div></div>` : ''}
<div class="rx-symbol">℞</div>
${items.map((item, i) => `
  <div class="med-row">
    <div class="med-name">${i + 1}. ${item.medicine}</div>
    <div class="med-detail">${[item.frequency, item.duration, item.instructions].filter(Boolean).join(' &nbsp;·&nbsp; ')}</div>
  </div>
`).join('')}
${prescription.advice ? `<div class="adv-box"><strong>Adv:</strong> ${prescription.advice}</div>` : ''}
${prescription.notes ? `<div class="section" style="margin-top:16px"><div class="field-label">Doctor's Notes</div><div class="field-value">${prescription.notes}</div></div>` : ''}
<div class="sig"><div class="sig-line">Doctor's Signature</div></div>
<div class="footer">Powered by Ora &middot; Dental Clinic Management</div>
</body></html>`)
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

          {/* C/C and O/E */}
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

          {/* Medicines */}
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
                      {item.frequency && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{item.frequency}</span>
                      )}
                      {item.duration && (
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.duration}</span>
                      )}
                      {item.instructions && (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{item.instructions}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adv */}
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

export default function PrescriptionsPage() {
  const supabase = createClient()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)

  async function loadPrescriptions() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('prescriptions')
      .select('*, patients(name), prescription_items(id)')
      .eq('clinic_id', user.id)
      .order('created_at', { ascending: false })
    setPrescriptions(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPrescriptions() }, [])

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
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} /> New Prescription
        </button>
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

      {showModal && (
        <AddPrescriptionModal onClose={() => setShowModal(false)} onSuccess={loadPrescriptions} />
      )}
      {selected && (
        <PrescriptionDetailModal prescription={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
