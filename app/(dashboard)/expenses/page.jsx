'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddExpenseModal from '@/components/modals/AddExpenseModal'
import { EXPENSE_CATEGORIES } from '@/components/expenses/categories'
import { Plus, TrendingDown, Trash2, Wallet, Tags } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import {
  Button, IconButton, Tooltip, Card, PageHeader, SearchInput,
  DataTable, StatCard, Badge, FilterBar, ConfirmDialog, Label, useToast,
} from '@/components/ui'

export default function ExpensesPage() {
  const supabase = createClient()
  const toast = useToast()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'))
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function loadExpenses() {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const start = format(startOfMonth(new Date(monthFilter + '-01')), 'yyyy-MM-dd')
      const end = format(endOfMonth(new Date(monthFilter + '-01')), 'yyyy-MM-dd')

      const { data, error: qErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('clinic_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
      if (qErr) throw qErr
      setExpenses(data || [])
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  useEffect(() => { loadExpenses() }, [monthFilter])

  async function confirmDelete() {
    setDeleting(true)
    await supabase.from('expenses').delete().eq('id', pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
    loadExpenses()
    toast.success('Expense deleted')
  }

  const filtered = expenses.filter(e => {
    const matchSearch =
      (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || e.category === filterCategory
    return matchSearch && matchCat
  })

  const monthTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const filteredTotal = filtered.reduce((sum, e) => sum + (e.amount || 0), 0)

  // Group by category for the breakdown
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const usedCategories = [...new Set(expenses.map(e => e.category))]
  const categoryFilters = [
    { value: 'all', label: 'All', count: expenses.length },
    ...usedCategories.map(c => ({
      value: c,
      label: c,
      count: expenses.filter(e => e.category === c).length,
    })),
  ]

  const isFiltered = Boolean(search) || filterCategory !== 'all'

  return (
    <div className="mx-auto max-w-[1440px] p-4 md:p-6">
      <PageHeader
        title="Expenses"
        subtitle="Track all clinic expenses"
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} strokeWidth={1.75} /> Add expense
          </Button>
        }
      />

      {/* Month + totals */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <Label htmlFor="expense-month">Filter month</Label>
          <input
            id="expense-month"
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="tabular mt-2 h-9 w-full rounded-md border bg-surface px-3 text-body text-primary transition-colors duration-fast ease-out hover:border-strong"
          />
        </Card>
        <StatCard
          label="Total this month"
          value={`৳${monthTotal.toLocaleString()}`}
          icon={TrendingDown}
          tone={monthTotal > 0 ? 'danger' : 'neutral'}
        />
        <StatCard
          label={isFiltered ? 'Filtered total' : 'Entries'}
          value={isFiltered ? `৳${filteredTotal.toLocaleString()}` : expenses.length}
          icon={Wallet}
        />
        <StatCard
          label="Categories used"
          value={Object.keys(byCategory).length}
          icon={Tags}
        />
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <Card className="mb-4 p-4">
          <p className="mb-2.5 text-label text-secondary">Breakdown by category</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => (
                <Badge key={cat} variant="outline" className="gap-1.5 px-2.5 py-1">
                  <span className="text-secondary">{cat}</span>
                  <span className="tabular text-primary">৳{amount.toLocaleString()}</span>
                </Badge>
              ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search expenses…"
          className="max-w-md"
        />
        {usedCategories.length > 0 && (
          <FilterBar
            value={filterCategory}
            onChange={setFilterCategory}
            options={categoryFilters}
            aria-label="Filter by category"
          />
        )}
      </div>

      <Card>
        <DataTable
          columns={[
            {
              key: 'date', header: 'Date', tabular: true, sortable: true,
              cell: (e) => format(new Date(e.date), 'MMM d, yyyy'),
            },
            {
              key: 'category', header: 'Category', sortable: true,
              cell: (e) => <Badge>{e.category}</Badge>,
            },
            {
              key: 'description', header: 'Description', hideBelow: 'sm',
              cell: (e) => <span className="text-secondary">{e.description || '—'}</span>,
            },
            {
              key: 'amount', header: 'Amount', align: 'right', tabular: true, sortable: true,
              cell: (e) => `৳${e.amount?.toLocaleString()}`,
            },
            {
              key: 'actions', header: '', align: 'right',
              cell: (e) => (
                <Tooltip label="Delete">
                  <IconButton aria-label="Delete expense" size="sm" onClick={() => setPendingDelete(e)}>
                    <Trash2 size={14} strokeWidth={1.75} />
                  </IconButton>
                </Tooltip>
              ),
            },
          ]}
          data={filtered}
          loading={loading}
          error={error}
          onRetry={() => { setLoading(true); loadExpenses() }}
          emptyState={{
            icon: TrendingDown,
            title: isFiltered ? 'No expenses match your filters' : 'No expenses this month',
            description: isFiltered
              ? 'Try a different search term or category.'
              : 'Log your first expense for this month.',
            action: !isFiltered && (
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus size={14} strokeWidth={1.75} /> Add first expense
              </Button>
            ),
          }}
          footer={
            filtered.length > 0 ? (
              <tr className="border-t bg-surface-subtle">
                <td className="px-4 py-2.5 text-label text-secondary" colSpan={3}>
                  {isFiltered ? 'Filtered total' : 'Total'}
                </td>
                <td className="tabular px-4 py-2.5 text-right text-body-md text-primary">
                  ৳{filteredTotal.toLocaleString()}
                </td>
                <td />
              </tr>
            ) : null
          }
          renderCard={(e) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body-md text-primary">
                  <span className="tabular">৳{e.amount?.toLocaleString()}</span>
                </p>
                <p className="mt-0.5 truncate text-label text-secondary">
                  {e.description || 'No description'}
                </p>
                <p className="mt-1.5 flex items-center gap-2">
                  <Badge>{e.category}</Badge>
                  <span className="tabular text-label text-tertiary">
                    {format(new Date(e.date), 'MMM d')}
                  </span>
                </p>
              </div>
              <Tooltip label="Delete">
                <IconButton aria-label="Delete expense" size="sm" onClick={() => setPendingDelete(e)}>
                  <Trash2 size={14} strokeWidth={1.75} />
                </IconButton>
              </Tooltip>
            </div>
          )}
        />
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(v) => { if (!v) setPendingDelete(null) }}
        title="Delete this expense?"
        description={
          pendingDelete
            ? `${pendingDelete.category} · ৳${pendingDelete.amount?.toLocaleString()}${pendingDelete.description ? ` · ${pendingDelete.description}` : ''}. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      {showModal && (
        <AddExpenseModal onClose={() => setShowModal(false)} onSuccess={loadExpenses} />
      )}
    </div>
  )
}
