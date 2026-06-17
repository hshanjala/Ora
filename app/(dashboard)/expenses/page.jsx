'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddExpenseModal from '@/components/modals/AddExpenseModal'
import { Plus, Search, TrendingDown, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const CATEGORY_COLORS = {
  Rent: 'bg-blue-100 text-blue-700',
  Salaries: 'bg-purple-100 text-purple-700',
  Utilities: 'bg-yellow-100 text-yellow-700',
  Equipment: 'bg-orange-100 text-orange-700',
  Supplies: 'bg-teal-100 text-teal-700',
  Medicines: 'bg-emerald-100 text-emerald-700',
  'Lab Fees': 'bg-cyan-100 text-cyan-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Maintenance: 'bg-amber-100 text-amber-700',
  Other: 'bg-slate-100 text-slate-600',
}

export default function ExpensesPage() {
  const supabase = createClient()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'))

  async function loadExpenses() {
    const { data: { user } } = await supabase.auth.getUser()
    const start = format(startOfMonth(new Date(monthFilter + '-01')), 'yyyy-MM-dd')
    const end = format(endOfMonth(new Date(monthFilter + '-01')), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('clinic_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
    setExpenses(data || [])
    setLoading(false)
  }

  useEffect(() => { loadExpenses() }, [monthFilter])

  async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    loadExpenses()
  }

  const filtered = expenses.filter(e => {
    const matchSearch = (e.description || '').toLowerCase().includes(search.toLowerCase()) || (e.category || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || e.category === filterCategory
    return matchSearch && matchCat
  })

  const totalAmount = filtered.reduce((sum, e) => sum + (e.amount || 0), 0)

  // Group by category for summary
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const categories = [...new Set(expenses.map(e => e.category))]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800">Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track all clinic expenses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Month + Total */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="lg:col-span-1">
          <label className="label text-xs">Filter Month</label>
          <input type="month" className="input" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
        </div>
        <div className="bg-red-50 rounded-2xl p-4">
          <p className="text-sm text-red-700 font-semibold">Total This Month</p>
          <p className="text-2xl font-black text-red-700 mt-1">৳{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-sm text-slate-600 font-semibold">Filtered Total</p>
          <p className="text-2xl font-black text-slate-800 mt-1">৳{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <p className="text-sm text-amber-700 font-semibold">Categories Used</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{Object.keys(byCategory).length}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="card mb-5">
          <p className="font-bold text-slate-800 mb-3 text-sm">Breakdown by Category</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600'}`}>
                <span>{cat}</span>
                <span className="opacity-70">৳{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-40" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <TrendingDown size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">{search || filterCategory !== 'all' ? 'No expenses match your filters' : 'No expenses this month'}</p>
            {!search && filterCategory === 'all' && (
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={16} /> Add First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-th">Date</th>
                  <th className="table-th">Category</th>
                  <th className="table-th hidden sm:table-cell">Description</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(expense => (
                  <tr key={expense.id} className="table-tr">
                    <td className="table-td text-slate-500 whitespace-nowrap">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                    <td className="table-td">
                      <span className={`badge ${CATEGORY_COLORS[expense.category] || 'bg-slate-100 text-slate-600'}`}>
                        {expense.category}
                      </span>
                      <div className="text-xs text-slate-400 sm:hidden mt-0.5">{expense.description || ''}</div>
                    </td>
                    <td className="table-td text-slate-600 hidden sm:table-cell">{expense.description || '—'}</td>
                    <td className="table-td text-right font-bold text-slate-800 whitespace-nowrap">৳{expense.amount?.toLocaleString()}</td>
                    <td className="table-td">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={2} className="table-td font-bold text-right text-slate-600 sm:hidden">Total</td>
                  <td colSpan={3} className="table-td font-bold text-right text-slate-600 hidden sm:table-cell">Total</td>
                  <td className="table-td text-right font-black text-slate-800 text-base whitespace-nowrap">৳{totalAmount.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddExpenseModal onClose={() => setShowModal(false)} onSuccess={loadExpenses} />
      )}
    </div>
  )
}
