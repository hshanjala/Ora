'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function CreateInvoiceModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    patient_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
    notes: '',
  })
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: '' }
  ])

  useEffect(() => {
    async function loadPatients() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('patients').select('id, name')
        .eq('clinic_id', user.id).order('name')
      setPatients(data || [])
    }
    loadPatients()
  }, [])

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleItemChange(index, field, value) {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: '' }])
  }

  function removeItem(index) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1))
  }, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patient_id) { setError('Please select a patient'); return }
    if (items.some(i => !i.description || !i.unit_price)) {
      setError('Please fill in all item fields')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    // Generate invoice number
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        clinic_id: user.id,
        patient_id: form.patient_id,
        invoice_number: invoiceNum,
        date: form.date,
        due_date: form.due_date || null,
        status: 'unpaid',
        total: total,
        paid_amount: 0,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (invErr) {
      setError('Failed to create invoice.')
      setLoading(false)
      return
    }

    // Insert items
    const invoiceItems = items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total: parseFloat(item.unit_price) * parseInt(item.quantity),
    }))

    await supabase.from('invoice_items').insert(invoiceItems)

    onSuccess()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Create Invoice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Patient *</label>
              <select name="patient_id" className="input" value={form.patient_id} onChange={handleFormChange} required>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Invoice Date</label>
              <input name="date" type="date" className="input" value={form.date} onChange={handleFormChange} />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input name="due_date" type="date" className="input" value={form.due_date} onChange={handleFormChange} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label className="label">Services / Items</label>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-1">
                <span className="col-span-5">Description</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-3">Unit Price (৳)</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="input col-span-5 text-sm"
                    placeholder="e.g. Root Canal"
                    value={item.description}
                    onChange={e => handleItemChange(i, 'description', e.target.value)}
                    required
                  />
                  <input
                    className="input col-span-2 text-sm"
                    type="number" min="1"
                    value={item.quantity}
                    onChange={e => handleItemChange(i, 'quantity', e.target.value)}
                  />
                  <input
                    className="input col-span-3 text-sm"
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={e => handleItemChange(i, 'unit_price', e.target.value)}
                    required
                  />
                  <div className="col-span-1 text-right text-sm font-semibold text-slate-700">
                    ৳{((parseFloat(item.unit_price || 0)) * parseInt(item.quantity || 1)).toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"
                    disabled={items.length === 1}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold hover:text-emerald-700">
              <Plus size={16} /> Add Line Item
            </button>
          </div>

          {/* Total */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Total Amount</span>
            <span className="text-xl font-black text-slate-800">৳{total.toLocaleString()}</span>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input min-h-[60px] resize-none" placeholder="Payment terms, notes to patient..." value={form.notes} onChange={handleFormChange} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
