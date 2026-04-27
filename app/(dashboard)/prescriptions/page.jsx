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
    const printContent = `
      <html>
      <head>
        <title>Prescription - ${prescription.patients?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 28px; color: #065f46; margin-bottom: 4px; }
          .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
          .section { margin-bottom: 24px; }
          .label { font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 6px; }
          .value { font-size: 15px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; background: #f0fdf4; padding: 10px 12px; font-size: 12px; color: #065f46; border: 1px solid #d1fae5; }
          td { padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 13px; }
          .footer { margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
          .signature-line { margin-top: 60px; border-top: 1px solid #111; width: 200px; text-align: center; padding-top: 6px; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Ora Clinic</h1>
        <div class="subtitle">Prescription</div>
        
        <div class="section">
          <div class="label">Patient</div>
          <div class="value">${prescription.patients?.name || '—'}</div>
        </div>
        
        <div class="section">
          <div class="label">Date</div>
          <div class="value">${format(new Date(prescription.date), 'MMMM d, yyyy')}</div>
        </div>
        
        ${prescription.diagnosis ? `<div class="section"><div class="label">Diagnosis</div><div class="value">${prescription.diagnosis}</div></div>` : ''}
        
        <div class="section">
          <div class="label">Prescribed Medicines</div>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td><strong>${item.medicine}</strong></td>
                  <td>${item.dosage || '—'}</td>
                  <td>${item.frequency || '—'}</td>
                  <td>${item.duration || '—'}</td>
                  <td>${item.instructions || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${prescription.notes ? `<div class="section"><div class="label">Doctor's Notes</div><div class="value">${prescription.notes}</div></div>` : ''}
        
        <div style="margin-top: 60px; display: flex; justify-content: flex-end;">
          <div class="signature-line">Doctor's Signature</div>
        </div>
        
        <div class="footer">Powered by Ora — Dental Clinic Management</div>
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    win.document.write(printContent)
    win.document.close()
    win.print()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Prescription</h2>
            <p className="text-sm text-slate-500">{prescription.patients?.name} • {format(new Date(prescription.date), 'MMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary !px-3 !py-2">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {prescription.diagnosis && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 mb-1">Diagnosis</p>
              <p className="text-sm font-semibold text-slate-800">{prescription.diagnosis}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-slate-700 mb-3">Prescribed Medicines</p>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">No medicines listed</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-4">
                    <p className="font-bold text-slate-800 mb-2">{i + 1}. {item.medicine}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {item.dosage && <div><span className="text-slate-500">Dosage: </span><span className="font-medium">{item.dosage}</span></div>}
                      {item.frequency && <div><span className="text-slate-500">Frequency: </span><span className="font-medium">{item.frequency}</span></div>}
                      {item.duration && <div><span className="text-slate-500">Duration: </span><span className="font-medium">{item.duration}</span></div>}
                      {item.instructions && <div className="col-span-2"><span className="text-slate-500">Instructions: </span><span className="font-medium">{item.instructions}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {prescription.notes && (
            <div className="bg-amber-50 rounded-xl p-4">
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
    (rx.diagnosis || '').toLowerCase().includes(search.toLowerCase())
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

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Search by patient name or diagnosis..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
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
                <th className="table-th">Diagnosis</th>
                <th className="table-th">Medicines</th>
                <th className="table-th">Notes</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rx => (
                <tr key={rx.id} className="table-tr cursor-pointer" onClick={() => setSelected(rx)}>
                  <td className="table-td text-slate-500 whitespace-nowrap">{format(new Date(rx.date), 'MMM d, yyyy')}</td>
                  <td className="table-td font-semibold">{rx.patients?.name || '—'}</td>
                  <td className="table-td">{rx.diagnosis || <span className="text-slate-400">—</span>}</td>
                  <td className="table-td">
                    <span className="badge-blue">{rx.prescription_items?.length || 0} medicine{rx.prescription_items?.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="table-td text-slate-500 max-w-[180px] truncate">{rx.notes || '—'}</td>
                  <td className="table-td" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(rx)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
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
