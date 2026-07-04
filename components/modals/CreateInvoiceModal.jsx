'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function CreateInvoiceModal({ onClose, onSuccess, patientId, patientName }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [patientQuery, setPatientQuery] = useState(patientName || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || null)
  const [discountType, setDiscountType] = useState('flat') // 'flat' | 'percent'
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    paid_now: '',
    discount: '',
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleFormChange(e) {
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

  function handleItemChange(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: '' }])
  }

  function removeItem(index) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) =>
    sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)), 0)

  const discountAmount = discountType === 'percent'
    ? subtotal * (parseFloat(form.discount || 0) / 100)
    : parseFloat(form.discount || 0)

  const total = Math.max(0, subtotal - discountAmount)
  const paidNow = parseFloat(form.paid_now || 0)
  const due = Math.max(0, total - paidNow)
  const status = paidNow >= total && total > 0 ? 'paid' : paidNow > 0 ? 'partial' : 'unpaid'

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientQuery.toLowerCase())
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!patientQuery.trim()) { setError('Please enter a patient name.'); return }
    if (items.some(i => !i.description || !i.unit_price)) {
      setError('Please fill in all item fields'); return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    let patientId = selectedPatientId
    if (!patientId && patientQuery.trim()) {
      const { data: newPatient } = await supabase
        .from('patients').insert({ clinic_id: user.id, name: patientQuery.trim() })
        .select().single()
      patientId = newPatient?.id || null
    }

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`

    const { data: invoice, error: invErr } = await supabase
      .from('invoices').insert({
        clinic_id: user.id,
        patient_id: patientId,
        invoice_number: invoiceNum,
        date: form.date,
        due_date: null,
        status,
        total,
        discount: discountAmount,
        paid_amount: paidNow,
        notes: form.notes || null,
      }).select().single()

    if (invErr) { setError('Failed to create invoice.'); setLoading(false); return }

    await supabase.from('invoice_items').insert(
      items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total: parseFloat(item.unit_price) * parseInt(item.quantity),
      }))
    )

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
            {/* Patient combobox */}
            <div className="relative col-span-2 sm:col-span-1">
              <label className="label">Patient *</label>
              {patientId && patientName ? (
                <div className="input flex items-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold">
                  {patientName}
                </div>
              ) : (
                <>
                  <input
                    ref={inputRef}
                    type="text" className="input"
                    placeholder="Type patient name..."
                    value={patientQuery}
                    onChange={handlePatientInput}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                  />
                  {showSuggestions && (
                    <div ref={dropdownRef} className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        <>
                          {filteredPatients.map(p => (
                            <button key={p.id} type="button" onClick={() => handleSelectPatient(p)}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors first:rounded-t-xl last:rounded-b-xl font-medium">
                              {p.name}
                            </button>
                          ))}
                          {patientQuery.trim() && !filteredPatients.some(p => p.name.toLowerCase() === patientQuery.toLowerCase()) && (
                            <button type="button" onClick={() => setShowSuggestions(false)}
                              className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 border-t border-slate-100 transition-colors last:rounded-b-xl font-semibold">
                              + Add &quot;{patientQuery}&quot; as new patient
                            </button>
                          )}
                        </>
                      ) : patientQuery.trim() ? (
                        <button type="button" onClick={() => setShowSuggestions(false)}
                          className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors rounded-xl font-semibold">
                          + Add &quot;{patientQuery}&quot; as new patient
                        </button>
                      ) : (
                        <p className="px-4 py-3 text-sm text-slate-400">Start typing to search patients...</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="label">Invoice Date</label>
              <input name="date" type="date" className="input" value={form.date} onChange={handleFormChange} />
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
                  <input className="input col-span-5 text-sm" placeholder="e.g. Root Canal"
                    value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} required />
                  <input className="input col-span-2 text-sm" type="number" min="1"
                    value={item.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} />
                  <input className="input col-span-3 text-sm" type="number" min="0" step="0.01" placeholder="0.00"
                    value={item.unit_price} onChange={e => handleItemChange(i, 'unit_price', e.target.value)} required />
                  <div className="col-span-1 text-right text-sm font-semibold text-slate-700">
                    ৳{(parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)).toLocaleString()}
                  </div>
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-600 flex justify-center disabled:opacity-30">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold hover:text-emerald-700">
              <Plus size={16} /> Add Line Item
            </button>
          </div>

          {/* Totals box */}
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            {/* Subtotal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="font-semibold text-slate-500 text-sm">Subtotal</span>
              <span className="font-bold text-slate-700">৳{subtotal.toLocaleString()}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-600 text-sm">Discount</span>
                <button
                  type="button"
                  onClick={() => setDiscountType(t => t === 'flat' ? 'percent' : 'flat')}
                  className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200"
                >
                  {discountType === 'flat' ? '৳ Flat' : '% Off'}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-sm">{discountType === 'flat' ? '৳' : ''}</span>
                <input
                  name="discount"
                  type="number" min="0" step="0.01"
                  max={discountType === 'percent' ? 100 : subtotal}
                  placeholder="0"
                  value={form.discount}
                  onChange={handleFormChange}
                  className="w-28 text-right border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-slate-500 text-sm">{discountType === 'percent' ? '%' : ''}</span>
              </div>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-amber-50">
                <span className="text-xs text-amber-700 font-semibold">Discount applied</span>
                <span className="text-sm font-bold text-amber-700">−৳{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="font-semibold text-slate-600 text-sm">Total Amount</span>
              <span className="text-xl font-black text-slate-800">৳{total.toLocaleString()}</span>
            </div>

            {/* Paid now */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <label className="font-semibold text-emerald-700 text-sm">Paid Now</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">৳</span>
                <input
                  name="paid_now"
                  type="number" min="0" step="0.01"
                  max={total}
                  placeholder="0.00"
                  value={form.paid_now}
                  onChange={handleFormChange}
                  className="w-32 text-right border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Due */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-semibold text-red-600 text-sm">Due</span>
              <span className={`text-xl font-black ${due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ৳{due.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status will be set to:</span>
            <span className={`badge text-xs font-bold px-3 py-1 rounded-lg ${
              status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
              status === 'partial' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-600'
            }`}>
              {status === 'paid' ? '✓ Paid' : status === 'partial' ? '◑ Partial' : '○ Unpaid'}
            </span>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input min-h-[60px] resize-none"
              placeholder="Any notes..." value={form.notes} onChange={handleFormChange} />
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
