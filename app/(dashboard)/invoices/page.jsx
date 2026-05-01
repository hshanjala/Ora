'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CreateInvoiceModal from '@/components/modals/CreateInvoiceModal'
import { Plus, Search, FileText, Loader2, X, Printer, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

function printInvoice(invoice, items, clinicName) {
  const remaining = Math.max(0, (invoice.total || 0) - (invoice.paid_amount || 0))
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;font-size:14px}
.hdr{display:flex;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}
.clinic{font-size:24px;font-weight:800;color:#065f46}
.sub{color:#64748b;font-size:13px;margin-top:4px}
.inv-num{font-size:20px;font-weight:700;text-align:right}
.inv-date{color:#64748b;font-size:12px;margin-top:4px;text-align:right}
.bill-box{background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:24px}
.bill-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.bill-name{font-size:16px;font-weight:700}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead{background:#f0fdf4}
th{padding:10px 12px;text-align:left;font-size:12px;color:#065f46;font-weight:600}
.tr{text-align:right}
td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
.totals{margin-left:auto;width:260px;margin-bottom:24px}
.trow{display:flex;justify-content:space-between;padding:8px 0;font-size:13px}
.trow.grand{border-top:2px solid #e2e8f0;padding-top:12px;margin-top:4px;font-weight:800;font-size:16px}
.trow.paid-row{color:#065f46;font-weight:600}
.trow.due-row{color:#b91c1c;font-weight:700;font-size:15px}
.sbadge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;margin-bottom:24px}
.spaid{background:#d1fae5;color:#065f46}
.spartial{background:#fef3c7;color:#854d0e}
.sunpaid{background:#fee2e2;color:#991b1b}
.notes{background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:32px;font-size:13px;color:#475569}
.footer{text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px}
</style></head><body>
<div class="hdr">
  <div><div class="clinic">${clinicName || 'Ora Dental Clinic'}</div><div class="sub">Dental Clinic</div></div>
  <div><div class="inv-num">${invoice.invoice_number}</div><div class="inv-date">${format(new Date(invoice.date), 'MMMM d, yyyy')}</div></div>
</div>
<div class="bill-box"><div class="bill-label">Bill To</div><div class="bill-name">${invoice.patients?.name || 'Patient'}</div></div>
<table>
  <thead><tr><th>Description</th><th class="tr">Qty</th><th class="tr">Unit Price</th><th class="tr">Total</th></tr></thead>
  <tbody>${items.map(item => `<tr><td>${item.description}</td><td class="tr">${item.quantity}</td><td class="tr">&#2547;${Number(item.unit_price).toLocaleString()}</td><td class="tr">&#2547;${Number(item.total).toLocaleString()}</td></tr>`).join('')}</tbody>
</table>
<div class="totals">
  <div class="trow grand"><span>Total</span><span>&#2547;${Number(invoice.total).toLocaleString()}</span></div>
  <div class="trow paid-row"><span>Paid</span><span>&#2547;${Number(invoice.paid_amount || 0).toLocaleString()}</span></div>
  ${remaining > 0 ? `<div class="trow due-row"><span>Due</span><span>&#2547;${remaining.toLocaleString()}</span></div>` : ''}
</div>
<span class="sbadge ${invoice.status === 'paid' ? 'spaid' : invoice.status === 'partial' ? 'spartial' : 'sunpaid'}">${(invoice.status || '').toUpperCase()}</span>
${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
<div class="footer">Thank you for choosing ${clinicName || 'Ora Dental Clinic'} &middot; Powered by Ora</div>
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

function InvoiceDetailModal({ invoice, onClose, onUpdate, clinicName }) {
  const supabase = createClient()
  const [items, setItems] = useState([])
  const [payAmount, setPayAmount] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id)
      setItems(data || [])
    }
    load()
  }, [invoice.id])

  async function recordPayment() {
    setUpdating(true)
    const addPaid = parseFloat(payAmount || 0)
    const newPaid = Math.min(invoice.total, (invoice.paid_amount || 0) + addPaid)
    const status = newPaid >= invoice.total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'
    await supabase.from('invoices').update({ paid_amount: newPaid, status }).eq('id', invoice.id)
    setUpdating(false)
    onUpdate()
    onClose()
  }

  const remaining = Math.max(0, (invoice.total || 0) - (invoice.paid_amount || 0))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-slate-500 mb-0.5 font-semibold uppercase tracking-wider">Invoice</p>
              <h2 className="text-xl font-bold text-slate-800">{invoice.invoice_number}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{invoice.patients?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printInvoice(invoice, items, clinicName)}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-semibold transition-colors"
              >
                <Printer size={14} /> Print
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-4">{format(new Date(invoice.date), 'MMMM d, yyyy')}</p>

          <div className="mb-5">
            <p className="text-sm font-bold text-slate-700 mb-2">Line Items</p>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Description</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5">{item.description}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">৳{item.unit_price?.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">৳{item.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 mb-5">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
              <span className="font-semibold text-slate-600 text-sm">Total</span>
              <span className="font-black text-slate-800 text-lg">৳{invoice.total?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
              <span className="font-semibold text-emerald-700 text-sm">Paid</span>
              <span className="font-bold text-emerald-700">৳{(invoice.paid_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="font-semibold text-red-600 text-sm">Due</span>
              <span className={`font-black text-lg ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ৳{remaining.toLocaleString()}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-slate-50 rounded-xl p-3 mb-5 text-sm text-slate-500">{invoice.notes}</div>
          )}

          {invoice.status !== 'paid' && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-700 mb-3">Record Additional Payment</p>
              <div className="flex gap-2">
                <input
                  type="number" className="input flex-1"
                  placeholder={`Max ৳${remaining.toLocaleString()} remaining`}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  min="0" max={remaining}
                />
                <button onClick={recordPayment} disabled={updating || !payAmount} className="btn-primary shrink-0">
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Record
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [clinicName, setClinicName] = useState('')

  async function loadInvoices() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: sett } = await supabase
      .from('clinic_settings').select('clinic_name').eq('clinic_id', user.id).single()
    setClinicName(sett?.clinic_name || '')
    const { data } = await supabase
      .from('invoices').select('*, patients(name)')
      .eq('clinic_id', user.id)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  useEffect(() => { loadInvoices() }, [])

  async function quickPrint(e, inv) {
    e.stopPropagation()
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id)
    printInvoice(inv, items || [], clinicName)
  }

  const filtered = invoices.filter(inv => {
    const matchSearch =
      (inv.patients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number || '').includes(search)
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchSearch && matchStatus
  })

  function statusBadge(status) {
    const map = {
      paid:    <span className="badge-green">Paid</span>,
      unpaid:  <span className="badge-red">Unpaid</span>,
      partial: <span className="badge-yellow">Partial</span>,
    }
    return map[status] || <span className="badge-gray">{status}</span>
  }

  const totalIncome = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalDues   = invoices.reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.paid_amount || 0)), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Invoices & Billing</h1>
          <p className="text-slate-500 text-sm mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} /> Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-emerald-50 rounded-2xl p-4">
          <p className="text-sm text-emerald-700 font-semibold">Total Collected</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">৳{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4">
          <p className="text-sm text-red-700 font-semibold">Total Dues</p>
          <p className="text-2xl font-black text-red-700 mt-1">৳{totalDues.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-sm text-slate-600 font-semibold">Total Invoices</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{invoices.length}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search patient or invoice number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'unpaid', 'partial', 'paid'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${filterStatus === s ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              {search || filterStatus !== 'all' ? 'No invoices match your filters' : 'No invoices yet'}
            </p>
            {!search && filterStatus === 'all' && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={16} /> Create First Invoice
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-th">Invoice #</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Date</th>
                <th className="table-th">Total</th>
                <th className="table-th">Paid</th>
                <th className="table-th">Due</th>
                <th className="table-th">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const due = Math.max(0, (inv.total || 0) - (inv.paid_amount || 0))
                return (
                  <tr key={inv.id} className="table-tr cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                    <td className="table-td font-mono font-semibold text-slate-600">{inv.invoice_number}</td>
                    <td className="table-td font-semibold">{inv.patients?.name || '—'}</td>
                    <td className="table-td text-slate-500">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                    <td className="table-td font-bold">৳{inv.total?.toLocaleString()}</td>
                    <td className="table-td text-emerald-600 font-semibold">৳{(inv.paid_amount || 0).toLocaleString()}</td>
                    <td className="table-td font-semibold text-red-500">৳{due.toLocaleString()}</td>
                    <td className="table-td">{statusBadge(inv.status)}</td>
                    <td className="table-td" onClick={e => e.stopPropagation()}>
                      <button onClick={e => quickPrint(e, inv)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg" title="Print">
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} onSuccess={loadInvoices} />
      )}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          clinicName={clinicName}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={loadInvoices}
        />
      )}
    </div>
  )
}
