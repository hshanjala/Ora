'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const CATEGORIES = [
  'Rent', 'Salaries', 'Utilities', 'Equipment', 'Supplies',
  'Medicines', 'Lab Fees', 'Marketing', 'Maintenance', 'Other'
]

export default function AddExpenseModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('expenses').insert({
      clinic_id: user.id,
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount),
      date: form.date,
    })

    if (error) {
      setError('Failed to add expense.')
      setLoading(false)
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Add Expense</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div>
            <label className="label">Category *</label>
            <select name="category" className="input" value={form.category} onChange={handleChange} required>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <input name="description" className="input" placeholder="Brief description of expense" value={form.description} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (৳) *</label>
              <input name="amount" type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Date *</label>
              <input name="date" type="date" className="input" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
