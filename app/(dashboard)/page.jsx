'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import QuickAddFlow from '@/components/modals/QuickAddFlow'
import AddAppointmentModal from '@/components/modals/AddAppointmentModal'
import CreateInvoiceModal from '@/components/modals/CreateInvoiceModal'
import AddExpenseModal from '@/components/modals/AddExpenseModal'
import { format } from 'date-fns'
import {
  UserPlus, CalendarPlus, FileText, TrendingDown,
  Calendar, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, XCircle, RefreshCw, Copy
} from 'lucide-react'
import Link from 'next/link'

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ onClose }) {
  const [copied, setCopied] = useState(null)
  function copy(num, type) {
    navigator.clipboard.writeText(num)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Renew Subscription</h2>
              <p className="text-sm text-gray-500 mt-0.5">Send ৳299 to renew for 1 month</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-amber-800 mb-2">How to pay</p>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Send ৳299 to one of the numbers below</li>
              <li>Use &quot;Send Money&quot; option</li>
              <li>Screenshot your transaction</li>
              <li>WhatsApp us the screenshot</li>
            </ol>
          </div>
          {[
            { label: 'bKash', num: '01629775202', code: 'bkash' },
            { label: 'Nagad', num: '01799900323', code: 'nagad' },
          ].map(({ label, num, code }) => (
            <div key={code} className="border border-gray-100 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold text-gray-900 text-base">{num}</p>
                </div>
                <button
                  onClick={() => copy(num, code)}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg font-medium transition-colors"
                >
                  <Copy size={12} />
                  {copied === code ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 text-center mt-2">
            Account extended within 24 hours after payment.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconClass }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-gray-400 mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon size={14} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [settings, setSettings]             = useState(null)
  const [stats, setStats]                   = useState({ bookings: 0, income: 0, expenses: 0, dues: 0 })
  const [todaySchedule, setTodaySchedule]   = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading]               = useState(true)
  const [showQuickAdd, setShowQuickAdd]     = useState(false)
  const [showSchedule, setShowSchedule]     = useState(false)
  const [showInvoice, setShowInvoice]       = useState(false)
  const [showExpense, setShowExpense]       = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  async function load() {
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
      ...(recentInv  || []).map(i => ({ ...i, type: 'invoice' })),
      ...(recentAppt || []).map(a => ({ ...a, type: 'appointment' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

    setRecentActivity(combined)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function statusBadge(status) {
    const map = {
      scheduled:    <span className="badge-blue">Scheduled</span>,
      completed:    <span className="badge-green">Completed</span>,
      cancelled:    <span className="badge-red">Cancelled</span>,
      'checked-in': <span className="badge-yellow">Checked In</span>,
    }
    return map[status] || <span className="badge-gray">{status}</span>
  }

  async function updateStatus(apptId, status) {
    await supabase.from('appointments').update({ status }).eq('id', apptId)
    setTodaySchedule(prev => prev.map(a => a.id === apptId ? { ...a, status } : a))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {greeting()}, {settings?.doctor_name || 'Doctor'}!
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <SubscriptionBanner settings={settings} />
      </div>

      {/* Quick Actions */}
      <div className="mb-7">
        <p className="text-xs font-medium text-gray-400 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="btn-primary"
          >
            <UserPlus size={15} />
            Quick Add
          </button>
          <button
            onClick={() => setShowSchedule(true)}
            className="btn-secondary"
          >
            <CalendarPlus size={15} />
            Add Schedule
          </button>
          <button
            onClick={() => setShowInvoice(true)}
            className="btn-secondary"
          >
            <FileText size={15} />
            Create Invoice
          </button>
          <button
            onClick={() => setShowExpense(true)}
            className="btn-secondary"
          >
            <TrendingDown size={15} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Bookings Today"   value={stats.bookings}                       icon={Calendar}    iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard label="Monthly Income"   value={`৳${stats.income.toLocaleString()}`}   icon={TrendingUp}  iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard label="Monthly Expenses" value={`৳${stats.expenses.toLocaleString()}`} icon={DollarSign}  iconClass="bg-gray-100 text-gray-400" />
        <StatCard label="Monthly Dues"     value={`৳${stats.dues.toLocaleString()}`}     icon={AlertCircle} iconClass="bg-red-50 text-red-400" />
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Today's Schedule */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-gray-700">Today&apos;s Schedule</h2>
            <Link href="/schedule" className="text-xs text-emerald-600 font-medium hover:underline">View all →</Link>
          </div>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-12 text-gray-300">
              <Calendar size={28} className="mx-auto mb-2" />
              <p className="text-sm text-gray-400">No appointments today</p>
              <button onClick={() => setShowSchedule(true)} className="text-emerald-600 text-xs font-medium mt-1 hover:underline">Add one →</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="table-th">Time</th>
                    <th className="table-th">Patient</th>
                    <th className="table-th">Procedure</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedule.map(appt => (
                    <tr key={appt.id} className="table-tr">
                      <td className="table-td font-medium text-gray-600 whitespace-nowrap">
                        {appt.time ? format(new Date(`2000-01-01T${appt.time}`), 'h:mm a') : '—'}
                      </td>
                      <td className="table-td font-medium">{appt.patients?.name || '—'}</td>
                      <td className="table-td text-gray-400">{appt.procedure || '—'}</td>
                      <td className="table-td">{statusBadge(appt.status)}</td>
                      <td className="table-td">
                        {appt.status === 'scheduled' && (
                          <div className="flex gap-1">
                            <button onClick={() => updateStatus(appt.id, 'checked-in')} className="text-blue-500 hover:text-blue-600" title="Check In"><CheckCircle size={15} /></button>
                            <button onClick={() => updateStatus(appt.id, 'completed')} className="text-emerald-500 hover:text-emerald-600" title="Complete"><Clock size={15} /></button>
                            <button onClick={() => updateStatus(appt.id, 'cancelled')} className="text-gray-300 hover:text-red-400" title="Cancel"><XCircle size={15} /></button>
                          </div>
                        )}
                        {appt.status === 'checked-in' && (
                          <button onClick={() => updateStatus(appt.id, 'completed')} className="text-emerald-600 text-xs font-medium hover:underline">Mark Done</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-10 text-gray-300">
              <RefreshCw size={24} className="mx-auto mb-2" />
              <p className="text-sm text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center shrink-0">
                    {item.type === 'invoice' ? <FileText size={14} /> : <Calendar size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {item.type === 'invoice'
                        ? `Invoice ${item.invoice_number || '#'} — ${item.patients?.name}`
                        : `Appointment — ${item.patients?.name}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.type === 'invoice'
                        ? `৳${item.total?.toLocaleString()} · ${item.status}`
                        : `${item.date} at ${item.time ? format(new Date(`2000-01-01T${item.time}`), 'h:mm a') : '—'}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    </div>
  )
}
