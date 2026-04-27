'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CreateInvoiceModal from '@/components/modals/CreateInvoiceModal'
import { Plus, Search, FileText, Loader2, X, Printer, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

function InvoiceDetailModal({ invoice, onClose, onUpdate }) {
  const supabase = createClient()
  const [items, setItems] = useState([])
  const [payAmount, setPayAmount] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('invoice_items').select('*')
        .eq('invoice_id', invoice.id)
      setItems(data || [])
    }
    load()
  }, [invoice.id])

  async function markPaid(amount) {
    setUpdating(true)
    const paid = parseFloat(amount)
    const status = paid >= invoice.total ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
    await supabase.from('invoices').update({
      paid_amount: paid,
      status,
    }).eq('id', invoice.id)
    setUpdating(false)
    onUpdate()
    onClose()
  }

  const remaining = invoice.total - (invoice.paid_amount || 0)

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
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Invoice Date</p>
              <p className="font-semibold text-sm">{format(new Date(invoice.date), 'MMM d, yyyy')}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Due Date</p>
              <p className="font-semibold text-sm">{invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '—'}</p>
            </div>
          </div>

          {/* Items */}
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
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2.5 font-bold text-right">Total</td>
                    <td className="px-3 py-2.5 font-black text-right">৳{invoice.total?.toLocaleString()}</td>
                  </tr>
                  {invoice.paid_amount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-emerald-600 font-semibold text-sm">Paid</td>
                      <td className="px-3 py-2 text-right text-emerald-600 font-bold text-sm">৳{invoice.paid_amount?.toLocaleString()}</td>
                    </tr>
                  )}
                  {remaining > 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-red-600 font-semibold text-sm">Remaining</td>
                      <td className="px-3 py-2 text-right text-red-600 font-bold text-sm">৳{remaining.toLocaleString()}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-slate-50 rounded-xl p-3 mb-5">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Mark as Paid */}
          {invoice.status !== 'paid' && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-700 mb-3">Record Payment</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input flex-1"
                  placeholder={`Amount (max ৳${remaining.toLocaleString()})`}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  min="0"
                  max={remaining}
                />
                <button
                  onClick={() => markPaid(payAmount || remaining)}
                  disabled={updating}
                  className="btn-primary shrink-0"
                >
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {payAmount ? 'Record' : 'Full Payment'}
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

  async function loadInvoices() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('invoices')
      .select('*, patients(name)')
      .eq('clinic_id', user.id)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  useEffect(() => { loadInvoices() }, [])

  const filtered = invoices.filter(inv => {
    const matchSearch =
      (inv.patients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number || '').includes(search)
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchSearch && matchStatus
  })

  function statusBadge(status) {
    const map = {
      paid: <span className="badge-green">Paid</span>,
      unpaid: <span className="badge-red">Unpaid</span>,
      partial: <span className="badge-yellow">Partial</span>,
    }
    return map[status] || <span className="badge-gray">{status}</span>
  }

  const totalIncome = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalDues = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + ((i.total || 0) - (i.paid_amount || 0)), 0)

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

      {/* Summary Cards */}
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

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search patient or invoice number..." value={search} onChange={e => setSearch(e.target.value)} />
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

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">{search || filterStatus !== 'all' ? 'No invoices match your filters' : 'No invoices yet'}</p>
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
                <th className="table-th">Due Date</th>
                <th className="table-th">Total</th>
                <th className="table-th">Paid</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="table-tr cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                  <td className="table-td font-mono font-semibold text-slate-600">{inv.invoice_number}</td>
                  <td className="table-td font-semibold">{inv.patients?.name || '—'}</td>
                  <td className="table-td text-slate-500">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                  <td className="table-td text-slate-500">{inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}</td>
                  <td className="table-td font-bold">৳{inv.total?.toLocaleString()}</td>
                  <td className="table-td text-emerald-600 font-semibold">৳{(inv.paid_amount || 0).toLocaleString()}</td>
                  <td className="table-td">{statusBadge(inv.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} onSuccess={loadInvoices} />
      )}
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onUpdate={loadInvoices} />
      )}
    </div>
  )
}
