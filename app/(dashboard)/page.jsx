'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import { format } from 'date-fns'
import {
  UserPlus, CalendarPlus, FileText, TrendingDown,
  Calendar, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, XCircle, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

function StatCard({ label, value, icon: Icon, color, textColor, valueColor }) {
  return (
    <div className={`${color} rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${textColor} opacity-80`}>{label}</p>
        <div className={`w-9 h-9 rounded-xl ${textColor} bg-white/30 flex items-center justify-center`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-3xl font-black ${valueColor || textColor}`}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState(null)
  const [stats, setStats] = useState({ bookings: 0, income: 0, expenses: 0, dues: 0 })
  const [todaySchedule, setTodaySchedule] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const today = format(new Date(), 'yyyy-MM-dd')
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: sett } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('clinic_id', user.id)
        .single()
      setSettings(sett)

      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

      const { count: bookings } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', user.id)
        .eq('date', today)

      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('paid_amount')
        .eq('clinic_id', user.id)
        .gte('date', monthStart)

      const income = paidInvoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0

      const { data: expList } = await supabase
        .from('expenses')
        .select('amount')
        .eq('clinic_id', user.id)
        .gte('date', monthStart)

      const expenses = expList?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

      const { data: unpaidInvoices } = await supabase
        .from('invoices')
        .select('total, paid_amount')
        .eq('clinic_id', user.id)
        .neq('status', 'paid')

      const dues = unpaidInvoices?.reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paid_amount || 0)), 0) || 0

      setStats({ bookings: bookings || 0, income, expenses, dues })

      const { data: schedule } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .eq('clinic_id', user.id)
        .eq('date', today)
        .order('time')

      setTodaySchedule(schedule || [])

      const { data: recentInv } = await supabase
        .from('invoices')
        .select('*, patients(name)')
        .eq('clinic_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      const { data: recentAppt } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .eq('clinic_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2)

      const combined = [
        ...(recentInv || []).map(i => ({ ...i, type: 'invoice' })),
        ...(recentAppt || []).map(a => ({ ...a, type: 'appointment' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

      setRecentActivity(combined)
      setLoading(false)
    }
    load()
  }, [])

  function statusBadge(status) {
    const map = {
      scheduled: <span className="badge-blue">Scheduled</span>,
      completed: <span className="badge-green">Completed</span>,
      cancelled: <span className="badge-red">Cancelled</span>,
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
    <div className="p-6 max-w-7xl mx-auto">

      <SubscriptionBanner settings={settings} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {greeting()}, {settings?.doctor_name || 'Doctor'}!
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • Here&apos;s your clinic overview
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Profile completion</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
            </div>
            <span className="text-xs font-bold text-emerald-600">75%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Quick action</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Patient',    href: '/patients',  icon: UserPlus,     iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
            { label: 'Add Schedule',   href: '/schedule',  icon: CalendarPlus, iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'    },
            { label: 'Create Invoice', href: '/invoices',  icon: FileText,     iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'    },
            { label: 'Add Expenses',   href: '/expenses',  icon: TrendingDown, iconBg: 'bg-orange-100',  iconColor: 'text-orange-500'  },
          ].map(({ label, href, icon: Icon, iconBg, iconColor }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center justify-center gap-2.5 py-5 px-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${iconBg}`}>
                <Icon size={20} className={iconColor} strokeWidth={1.8} />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bookings Today"    value={stats.bookings}                      icon={Calendar}    color="bg-teal-50"   textColor="text-teal-700"   />
        <StatCard label="Monthly Income"    value={`৳${stats.income.toLocaleString()}`}   icon={TrendingUp}  color="bg-blue-50"   textColor="text-blue-700"   />
        <StatCard label="Monthly Expenses"  value={`৳${stats.expenses.toLocaleString()}`} icon={DollarSign}  color="bg-orange-50" textColor="text-orange-700" />
        <StatCard label="Total Dues"        value={`৳${stats.dues.toLocaleString()}`}     icon={AlertCircle} color="bg-red-50"    textColor="text-red-600"    />
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Today's Schedule */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Today&apos;s Schedule</h2>
            <Link href="/schedule" className="text-xs text-emerald-600 font-semibold hover:underline">View all →</Link>
          </div>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No appointments today</p>
              <Link href="/schedule" className="text-emerald-600 text-xs font-semibold mt-1 block hover:underline">Add one →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
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
                      <td className="table-td font-semibold text-slate-600 whitespace-nowrap">
                        {appt.time ? format(new Date(`2000-01-01T${appt.time}`), 'h:mm a') : '—'}
                      </td>
                      <td className="table-td font-medium">{appt.patients?.name || '—'}</td>
                      <td className="table-td text-slate-500">{appt.procedure || '—'}</td>
                      <td className="table-td">{statusBadge(appt.status)}</td>
                      <td className="table-td">
                        {appt.status === 'scheduled' && (
                          <div className="flex gap-1">
                            <button onClick={() => updateStatus(appt.id, 'checked-in')} className="text-blue-600 hover:text-blue-700" title="Check In"><CheckCircle size={16} /></button>
                            <button onClick={() => updateStatus(appt.id, 'completed')} className="text-emerald-600 hover:text-emerald-700" title="Complete"><Clock size={16} /></button>
                            <button onClick={() => updateStatus(appt.id, 'cancelled')} className="text-red-400 hover:text-red-600" title="Cancel"><XCircle size={16} /></button>
                          </div>
                        )}
                        {appt.status === 'checked-in' && (
                          <button onClick={() => updateStatus(appt.id, 'completed')} className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold">Mark Done</button>
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
        <div className="card">
          <h2 className="font-bold text-slate-800 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <RefreshCw size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'invoice' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {item.type === 'invoice' ? <FileText size={16} /> : <Calendar size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {item.type === 'invoice'
                        ? `Invoice ${item.invoice_number || '#'} — ${item.patients?.name}`
                        : `Appointment — ${item.patients?.name}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.type === 'invoice'
                        ? `৳${item.total?.toLocaleString()} • ${item.status}`
                        : `${item.date} at ${item.time ? format(new Date(`2000-01-01T${item.time}`), 'h:mm a') : '—'}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
