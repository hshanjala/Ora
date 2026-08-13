'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CreateInvoiceModal from '@/components/modals/CreateInvoiceModal'
import InvoiceDetailModal from '@/components/invoices/invoice-detail-modal'
import { INVOICE_STATUS, INVOICE_STATUS_FILTERS, PERIOD_FILTERS } from '@/components/invoices/status'
import { printInvoice } from '@/lib/printInvoice'
import { Plus, FileText, Printer, TrendingUp, AlertCircle, Receipt } from 'lucide-react'
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import {
  Button, IconButton, Tooltip, Card, PageHeader, SearchInput,
  DataTable, StatCard, StatusPill, FilterBar, Eyebrow, useToast,
} from '@/components/ui'

export default function InvoicesPage() {
  const supabase = createClient()
  const toast = useToast()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [timePeriod, setTimePeriod] = useState('month')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [clinicName, setClinicName] = useState('')

  async function loadInvoices() {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: sett } = await supabase
        .from('clinic_settings').select('clinic_name').eq('clinic_id', user.id).single()
      setClinicName(sett?.clinic_name || '')
      const { data, error: qErr } = await supabase
        .from('invoices').select('*, patients(name)')
        .eq('clinic_id', user.id)
        .order('created_at', { ascending: false })
      if (qErr) throw qErr
      setInvoices(data || [])
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  useEffect(() => { loadInvoices() }, [])

  async function quickPrint(inv) {
    const [{ data: items }, { data: payments }] = await Promise.all([
      supabase.from('invoice_items').select('*').eq('invoice_id', inv.id),
      supabase.from('invoice_payments').select('*').eq('invoice_id', inv.id).order('created_at', { ascending: true }),
    ])
    printInvoice(inv, items || [], clinicName, payments || [])
  }

  const periodStart = timePeriod === 'week'
    ? format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
    : timePeriod === 'month' ? format(startOfMonth(new Date()), 'yyyy-MM-dd')
    : timePeriod === 'year' ? format(startOfYear(new Date()), 'yyyy-MM-dd')
    : null

  const filtered = invoices.filter(inv => {
    const matchSearch =
      (inv.patients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number || '').includes(search)
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchPeriod = !periodStart || inv.date >= periodStart
    return matchSearch && matchStatus && matchPeriod
  })

  const totalIncome = filtered.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalDues = filtered.reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.paid_amount || 0)), 0)

  const statusFilters = INVOICE_STATUS_FILTERS.map(f => ({
    ...f,
    count: f.value === 'all'
      ? invoices.length
      : invoices.filter(i => i.status === f.value).length,
  }))

  const isFiltered = Boolean(search) || filterStatus !== 'all'

  return (
    <div className="mx-auto max-w-[1440px] p-4 md:p-6">
      <PageHeader
        title="Invoices & billing"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} total`}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={15} strokeWidth={1.75} /> Create invoice
          </Button>
        }
      />

      {/* Period */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Eyebrow>Period</Eyebrow>
        <FilterBar
          value={timePeriod}
          onChange={setTimePeriod}
          options={PERIOD_FILTERS}
          aria-label="Filter by period"
        />
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Collected" value={`৳${totalIncome.toLocaleString()}`} icon={TrendingUp} tone="success" />
        <StatCard
          label="Dues"
          value={`৳${totalDues.toLocaleString()}`}
          icon={AlertCircle}
          tone={totalDues > 0 ? 'danger' : 'neutral'}
        />
        <StatCard label="Invoices" value={filtered.length} icon={Receipt} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search patient or invoice number…"
          className="max-w-md"
        />
        <FilterBar
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusFilters}
          aria-label="Filter by status"
        />
      </div>

      <Card>
        <DataTable
          columns={[
            {
              key: 'invoice_number', header: 'Invoice #', tabular: true, sortable: true,
              cell: (inv) => <span className="text-body-md text-primary">{inv.invoice_number}</span>,
            },
            {
              key: 'patient', header: 'Patient', sortable: true,
              sortValue: (inv) => inv.patients?.name || '',
              cell: (inv) => inv.patients?.name || '—',
            },
            {
              key: 'date', header: 'Date', hideBelow: 'md', tabular: true, sortable: true,
              cell: (inv) => format(new Date(inv.date), 'MMM d, yyyy'),
            },
            {
              key: 'total', header: 'Total', align: 'right', tabular: true, sortable: true,
              cell: (inv) => `৳${inv.total?.toLocaleString()}`,
            },
            {
              key: 'paid', header: 'Paid', align: 'right', tabular: true, hideBelow: 'sm',
              sortValue: (inv) => inv.paid_amount || 0,
              cell: (inv) => (
                <span className="text-success">৳{(inv.paid_amount || 0).toLocaleString()}</span>
              ),
            },
            {
              key: 'due', header: 'Due', align: 'right', tabular: true, hideBelow: 'sm',
              sortValue: (inv) => Math.max(0, (inv.total || 0) - (inv.paid_amount || 0)),
              cell: (inv) => {
                const due = Math.max(0, (inv.total || 0) - (inv.paid_amount || 0))
                return <span className={due > 0 ? 'text-danger' : 'text-secondary'}>৳{due.toLocaleString()}</span>
              },
            },
            {
              key: 'status', header: 'Status',
              cell: (inv) => (
                <StatusPill status={INVOICE_STATUS[inv.status] || 'neutral'}>{inv.status}</StatusPill>
              ),
            },
            {
              key: 'actions', header: '', align: 'right',
              cell: (inv) => (
                <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                  <Tooltip label="Print">
                    <IconButton aria-label="Print invoice" size="sm" onClick={() => quickPrint(inv)}>
                      <Printer size={14} strokeWidth={1.75} />
                    </IconButton>
                  </Tooltip>
                </div>
              ),
            },
          ]}
          data={filtered}
          loading={loading}
          error={error}
          onRetry={() => { setLoading(true); loadInvoices() }}
          onRowClick={(inv) => setSelectedInvoice(inv)}
          emptyState={{
            icon: FileText,
            title: isFiltered ? 'No invoices match your filters' : 'No invoices yet',
            description: isFiltered
              ? 'Try a different search term, status, or period.'
              : 'Create your first invoice to start tracking payments.',
            action: !isFiltered && (
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus size={14} strokeWidth={1.75} /> Create first invoice
              </Button>
            ),
          }}
          renderCard={(inv) => {
            const due = Math.max(0, (inv.total || 0) - (inv.paid_amount || 0))
            return (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-body-md text-primary">{inv.patients?.name || '—'}</p>
                  <p className="tabular mt-0.5 text-label text-tertiary">
                    {inv.invoice_number} · {format(new Date(inv.date), 'MMM d')}
                  </p>
                  <p className="tabular mt-0.5 text-label">
                    <span className="text-primary">৳{inv.total?.toLocaleString()}</span>
                    {due > 0 && <span className="text-danger"> · ৳{due.toLocaleString()} due</span>}
                  </p>
                  <div className="mt-1.5">
                    <StatusPill status={INVOICE_STATUS[inv.status] || 'neutral'}>{inv.status}</StatusPill>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Tooltip label="Print">
                    <IconButton aria-label="Print invoice" size="sm" onClick={() => quickPrint(inv)}>
                      <Printer size={14} strokeWidth={1.75} />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            )
          }}
        />
      </Card>

      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} onSuccess={loadInvoices} />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          key={selectedInvoice.id}
          invoice={selectedInvoice}
          clinicName={clinicName}
          open
          onOpenChange={(v) => { if (!v) setSelectedInvoice(null) }}
          onUpdate={loadInvoices}
        />
      )}
    </div>
  )
}
