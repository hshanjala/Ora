'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import QuickAddFlow from '@/components/modals/QuickAddFlow'
import AddAppointmentModal from '@/components/modals/AddAppointmentModal'
import CreateInvoiceModal from '@/components/modals/CreateInvoiceModal'
import AddExpenseModal from '@/components/modals/AddExpenseModal'
import { format } from 'date-fns'
import {
  UserPlus, CalendarPlus, FileText, TrendingDown,
  Calendar, Wallet, TrendingUp, AlertCircle,
  CheckCircle2, Clock, XCircle, Activity,
} from 'lucide-react'
import {
  Button, IconButton, Tooltip,
  Card, CardHeader, StatCard, PageHeader,
  DataTable, EmptyState, ErrorState,
  SkeletonStat, SkeletonTable, SkeletonText, Skeleton,
  useToast,
} from '@/components/ui'
import { APPOINTMENT_STATUS, statusPill } from '@/components/schedule/status'

function fmtTime(time) {
  return time ? format(new Date(`2000-01-01T${time}`), 'h:mm a') : '—'
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><SkeletonTable rows={4} cols={4} /></Card>
        <Card className="p-5"><SkeletonText lines={5} /></Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [stats, setStats] = useState({ bookings: 0, income: 0, expenses: 0, dues: 0 })
  const [todaySchedule, setTodaySchedule] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showExpense, setShowExpense] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  async function load() {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: sett } = await supabase
        .from('clinic_settings').select('*').eq('clinic_id', user.id).single()
      setSettings(sett)

      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

      const { count: bookings } = await supabase
        .from('appointments').select('*', { count: 'exact', head: true })
        .eq('clinic_id', user.id).eq('date', today)

      const { data: paidInvoices } = await supabase
        .from('invoices').select('paid_amount')
        .eq('clinic_id', user.id).gte('date', monthStart)
      const income = paidInvoices?.reduce((s, i) => s + (i.paid_amount || 0), 0) || 0

      const { data: expList } = await supabase
        .from('expenses').select('amount')
        .eq('clinic_id', user.id).gte('date', monthStart)
      const expenses = expList?.reduce((s, e) => s + (e.amount || 0), 0) || 0

      const { data: unpaid } = await supabase
        .from('invoices').select('total, paid_amount')
        .eq('clinic_id', user.id).neq('status', 'paid').gte('date', monthStart)
      const dues = unpaid?.reduce((s, i) => s + ((i.total || 0) - (i.paid_amount || 0)), 0) || 0

      setStats({ bookings: bookings || 0, income, expenses, dues })

      const { data: schedule } = await supabase
        .from('appointments').select('*, patients(name)')
        .eq('clinic_id', user.id).eq('date', today).order('time')
      setTodaySchedule(schedule || [])

      const { data: recentInv } = await supabase
        .from('invoices').select('*, patients(name)')
        .eq('clinic_id', user.id).order('created_at', { ascending: false }).limit(3)

      const { data: recentAppt } = await supabase
        .from('appointments').select('*, patients(name)')
        .eq('clinic_id', user.id).order('created_at', { ascending: false }).limit(2)

      const combined = [
        ...(recentInv || []).map(i => ({ ...i, type: 'invoice' })),
        ...(recentAppt || []).map(a => ({ ...a, type: 'appointment' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

      setRecentActivity(combined)
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(apptId, status) {
    await supabase.from('appointments').update({ status }).eq('id', apptId)
    setTodaySchedule(prev => prev.map(a => a.id === apptId ? { ...a, status } : a))
    toast.success(`Marked ${(APPOINTMENT_STATUS[status]?.label || status).toLowerCase()}`)
  }

  function rowActions(appt) {
    if (appt.status === 'scheduled') {
      return (
        <div className="flex items-center justify-end gap-0.5">
          <Tooltip label="Check in">
            <IconButton aria-label="Check in" size="sm" onClick={() => updateStatus(appt.id, 'checked-in')}>
              <Clock size={14} strokeWidth={1.75} />
            </IconButton>
          </Tooltip>
          <Tooltip label="Complete">
            <IconButton aria-label="Complete" size="sm" onClick={() => updateStatus(appt.id, 'completed')}>
              <CheckCircle2 size={14} strokeWidth={1.75} />
            </IconButton>
          </Tooltip>
          <Tooltip label="Cancel">
            <IconButton aria-label="Cancel" size="sm" onClick={() => updateStatus(appt.id, 'cancelled')}>
              <XCircle size={14} strokeWidth={1.75} />
            </IconButton>
          </Tooltip>
        </div>
      )
    }
    if (appt.status === 'checked-in') {
      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => updateStatus(appt.id, 'completed')}>
            Mark done
          </Button>
        </div>
      )
    }
    return null
  }

  const page = (content) => (
    <div className="mx-auto max-w-content p-4 md:p-6">{content}</div>
  )

  if (loading) return page(<DashboardSkeleton />)

  if (error) {
    return page(
      <ErrorState
        title="Could not load your dashboard"
        description="Something went wrong fetching this clinic's data. Check your connection and try again."
        action={
          <Button variant="secondary" onClick={() => { setLoading(true); load() }}>
            Try again
          </Button>
        }
      />
    )
  }

  return page(
    <>
      <PageHeader
        title={`${greeting()}, ${settings?.doctor_name || 'Doctor'}`}
        subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}
        actions={
          <>
            <Button onClick={() => setShowQuickAdd(true)}>
              <UserPlus size={15} strokeWidth={1.75} /> Quick Add
            </Button>
            <Button variant="secondary" onClick={() => setShowSchedule(true)}>
              <CalendarPlus size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">Add Schedule</span>
            </Button>
            <Button variant="secondary" onClick={() => setShowInvoice(true)}>
              <FileText size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">Create Invoice</span>
            </Button>
            <Button variant="secondary" onClick={() => setShowExpense(true)}>
              <TrendingDown size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">Add Expense</span>
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bookings today" value={stats.bookings} icon={Calendar} tone="accent" />
        <StatCard label="Monthly income" value={`৳${stats.income.toLocaleString()}`} icon={TrendingUp} tone="success" />
        <StatCard label="Monthly expenses" value={`৳${stats.expenses.toLocaleString()}`} icon={Wallet} />
        <StatCard
          label="Monthly dues"
          value={`৳${stats.dues.toLocaleString()}`}
          icon={AlertCircle}
          tone={stats.dues > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's schedule */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's schedule"
            actions={
              <Link href="/schedule" className="text-small text-accent-text hover:underline">
                View all
              </Link>
            }
          />
          <DataTable
            columns={[
              { key: 'time', header: 'Time', tabular: true, cell: (a) => fmtTime(a.time) },
              {
                key: 'patient', header: 'Patient',
                cell: (a) => <span className="text-body-md text-primary">{a.patients?.name || '—'}</span>,
              },
              {
                key: 'procedure', header: 'Procedure', hideBelow: 'sm',
                cell: (a) => <span className="text-secondary">{a.procedure || '—'}</span>,
              },
              { key: 'status', header: 'Status', cell: (a) => statusPill(a.status) },
              { key: 'actions', header: '', align: 'right', cell: rowActions },
            ]}
            data={todaySchedule}
            emptyState={{
              icon: Calendar,
              title: 'No appointments today',
              description: 'Book one and it will show up here.',
              action: (
                <Button size="sm" onClick={() => setShowSchedule(true)}>
                  <CalendarPlus size={14} strokeWidth={1.75} /> Add appointment
                </Button>
              ),
            }}
            renderCard={(a) => (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-body-md text-primary">{a.patients?.name || '—'}</p>
                  <p className="mt-0.5 text-label text-secondary">
                    <span className="tabular">{fmtTime(a.time)}</span>
                    {a.procedure ? ` · ${a.procedure}` : ''}
                  </p>
                  <div className="mt-1.5">{statusPill(a.status)}</div>
                </div>
                {rowActions(a)}
              </div>
            )}
          />
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Recent activity" />
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Invoices and appointments appear here as you create them."
              compact
            />
          ) : (
            <ul className="px-5 pb-5">
              {recentActivity.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-hover text-secondary">
                    {item.type === 'invoice'
                      ? <FileText size={14} strokeWidth={1.75} />
                      : <Calendar size={14} strokeWidth={1.75} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md text-primary">
                      {item.type === 'invoice'
                        ? `Invoice ${item.invoice_number || ''} — ${item.patients?.name || '—'}`
                        : `Appointment — ${item.patients?.name || '—'}`}
                    </p>
                    <p className="mt-0.5 text-label text-tertiary">
                      {item.type === 'invoice' ? (
                        <>
                          <span className="tabular">৳{item.total?.toLocaleString()}</span> · {item.status}
                        </>
                      ) : (
                        <span className="tabular">{item.date} at {fmtTime(item.time)}</span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {showQuickAdd && (
        <QuickAddFlow
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => { setShowQuickAdd(false); load() }}
        />
      )}
      {showSchedule && (
        <AddAppointmentModal
          onClose={() => setShowSchedule(false)}
          onSuccess={() => { setShowSchedule(false); load() }}
        />
      )}
      {showInvoice && (
        <CreateInvoiceModal
          onClose={() => setShowInvoice(false)}
          onSuccess={() => { setShowInvoice(false); load() }}
        />
      )}
      {showExpense && (
        <AddExpenseModal
          onClose={() => setShowExpense(false)}
          onSuccess={() => { setShowExpense(false); load() }}
        />
      )}
    </>
  )
}
