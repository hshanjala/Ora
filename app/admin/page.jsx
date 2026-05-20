'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import {
  Lock, RefreshCw, CheckCircle, Clock, XCircle, LogOut,
  Search, PauseCircle, PlayCircle, CalendarPlus
} from 'lucide-react'

export default function AdminPage() {
  const [authed, setAuthed]     = useState(null) // null=loading, false=login, true=in
  const [pwInput, setPwInput]   = useState('')
  const [pwError, setPwError]   = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [clinics, setClinics]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [actionId, setActionId] = useState(null)
  const [toast, setToast]       = useState(null)
  const [search, setSearch]     = useState('')

  // Check existing session cookie on mount
  useEffect(() => {
    fetch('/api/admin/clinics').then(r => {
      setAuthed(r.ok)
    }).catch(() => setAuthed(false))
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoggingIn(true)
    setPwError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwInput }),
      })
      if (res.ok) {
        setAuthed(true)
        setPwInput('')
      } else {
        setPwError('Wrong password. Try again.')
      }
    } catch {
      setPwError('Connection error. Try again.')
    }
    setLoggingIn(false)
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    setClinics([])
  }

  const loadClinics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clinics')
      if (res.status === 401) { setAuthed(false); return }
      const data = await res.json()
      if (!res.ok) {
        showToast(`❌ Error: ${data.error || 'Failed to load clinics'}`)
        setClinics([])
      } else {
        setClinics(Array.isArray(data) ? data : [])
      }
    } catch {
      showToast('❌ Failed to load clinics')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed === true) loadClinics()
  }, [authed, loadClinics])

  async function extendSubscription(clinic) {
    setActionId(clinic.clinic_id + ':extend')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let base = today
    const currentEnd = clinic.subscription_end ? new Date(clinic.subscription_end + 'T00:00:00') : null
    if (currentEnd && currentEnd > today) base = currentEnd
    const newEnd = format(addDays(base, 30), 'yyyy-MM-dd')

    const res = await fetch('/api/admin/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinic_id: clinic.clinic_id, new_end: newEnd }),
    })
    showToast(res.ok
      ? `✅ ${clinic.clinic_name || 'Clinic'} extended to ${format(new Date(newEnd + 'T00:00:00'), 'MMM d, yyyy')}`
      : '❌ Failed to extend. Try again.')
    if (res.ok) loadClinics()
    setActionId(null)
  }

  async function extendTrial(clinic) {
    setActionId(clinic.clinic_id + ':trial')
    const res = await fetch('/api/admin/extend-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinic_id: clinic.clinic_id, current_trial_end: clinic.trial_end }),
    })
    const data = await res.json()
    showToast(res.ok
      ? `✅ Trial extended to ${format(new Date(data.new_trial_end + 'T00:00:00'), 'MMM d, yyyy')}`
      : '❌ Failed to extend trial.')
    if (res.ok) loadClinics()
    setActionId(null)
  }

  async function toggleSuspend(clinic) {
    const isSuspended = clinic.subscription_status === 'suspended'
    setActionId(clinic.clinic_id + ':suspend')
    const res = await fetch('/api/admin/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinic_id: clinic.clinic_id, action: isSuspended ? 'reactivate' : 'suspend' }),
    })
    showToast(res.ok
      ? isSuspended
        ? `✅ ${clinic.clinic_name || 'Clinic'} reactivated`
        : `⚠️ ${clinic.clinic_name || 'Clinic'} suspended`
      : '❌ Action failed. Try again.')
    if (res.ok) loadClinics()
    setActionId(null)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function getStatus(clinic) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (clinic.subscription_status === 'suspended') {
      return { label: 'Suspended', color: 'text-slate-600 bg-slate-100' }
    }
    const isOnTrial = clinic.subscription_status === 'trial' || !clinic.subscription_status
    const endStr = isOnTrial ? clinic.trial_end : clinic.subscription_end
    if (!endStr) return { label: 'Trial', color: 'text-amber-600 bg-amber-50', daysLeft: null }
    const end = new Date(endStr + 'T00:00:00')
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0)  return { label: 'Expired', color: 'text-red-600 bg-red-50', daysLeft }
    if (isOnTrial)      return { label: `Trial · ${daysLeft}d left`, color: 'text-amber-600 bg-amber-50', daysLeft }
    if (daysLeft <= 7)  return { label: `Expiring · ${daysLeft}d left`, color: 'text-orange-600 bg-orange-50', daysLeft }
    return { label: `Active · ${daysLeft}d left`, color: 'text-emerald-600 bg-emerald-50', daysLeft }
  }

  function formatDate(str) {
    if (!str) return '—'
    try { return format(new Date(str + 'T00:00:00'), 'MMM d, yyyy') } catch { return str }
  }

  // ── Loading splash ───────────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-800">Ora Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your admin password</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Admin password"
              value={pwInput}
              onChange={e => setPwInput(e.target.value)}
              autoFocus
            />
            {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loggingIn ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const suspended = clinics.filter(c => c.subscription_status === 'suspended')
  const expired   = clinics.filter(c => c.subscription_status !== 'suspended' && getStatus(c).daysLeft !== null && getStatus(c).daysLeft <= 0)
  const expiring  = clinics.filter(c => c.subscription_status !== 'suspended' && getStatus(c).daysLeft !== null && getStatus(c).daysLeft > 0 && getStatus(c).daysLeft <= 7)
  const active    = clinics.filter(c => c.subscription_status !== 'suspended' && (getStatus(c).daysLeft === null || getStatus(c).daysLeft > 7))

  const filtered = clinics.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.clinic_name  || '').toLowerCase().includes(q) ||
      (c.doctor_name  || '').toLowerCase().includes(q) ||
      (c.doctor_phone || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Ora Admin Panel</h1>
            <p className="text-slate-500 text-sm mt-0.5">{clinics.length} clinic{clinics.length !== 1 ? 's' : ''} registered</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadClinics}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl transition-colors">
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 bg-white border border-red-200 px-4 py-2 rounded-xl transition-colors">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={16} className="text-red-500" />
              <span className="text-sm font-bold text-red-700">Expired</span>
            </div>
            <p className="text-3xl font-black text-red-600">{expired.length}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-orange-500" />
              <span className="text-sm font-bold text-orange-700">Expiring Soon</span>
            </div>
            <p className="text-3xl font-black text-orange-600">{expiring.length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">Active</span>
            </div>
            <p className="text-3xl font-black text-emerald-600">{active.length}</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <PauseCircle size={16} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-600">Suspended</span>
            </div>
            <p className="text-3xl font-black text-slate-600">{suspended.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by clinic name, doctor or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              {search ? 'No clinics match your search' : 'No clinics found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Clinic</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Doctor</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Phone</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Expires</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((clinic, i) => {
                    const status = getStatus(clinic)
                    const isSuspended = clinic.subscription_status === 'suspended'
                    const isOnTrial = clinic.subscription_status === 'trial' || !clinic.subscription_status
                    const endStr = isOnTrial ? clinic.trial_end : clinic.subscription_end

                    return (
                      <tr key={clinic.clinic_id}
                        className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${isSuspended ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800 text-sm">{clinic.clinic_name || '—'}</p>
                          {clinic.clinic_address && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{clinic.clinic_address}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-600">{clinic.doctor_name || '—'}</p>
                          {clinic.doctor_designation && (
                            <p className="text-xs text-slate-400">{clinic.doctor_designation}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-500">{clinic.doctor_phone || '—'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-500">{formatDate(endStr)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!isSuspended && (
                              <button
                                onClick={() => extendSubscription(clinic)}
                                disabled={!!actionId}
                                title="Extend subscription by 30 days"
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {actionId === clinic.clinic_id + ':extend'
                                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                  : '+30d'}
                              </button>
                            )}

                            {!isSuspended && isOnTrial && (
                              <button
                                onClick={() => extendTrial(clinic)}
                                disabled={!!actionId}
                                title="Extend trial by 14 days"
                                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {actionId === clinic.clinic_id + ':trial'
                                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                  : <><CalendarPlus size={12} /> Trial</>}
                              </button>
                            )}

                            <button
                              onClick={() => toggleSuspend(clinic)}
                              disabled={!!actionId}
                              title={isSuspended ? 'Reactivate clinic' : 'Suspend clinic'}
                              className={`flex items-center gap-1 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                                isSuspended
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
                                  : 'bg-slate-400 hover:bg-slate-500'
                              }`}
                            >
                              {actionId === clinic.clinic_id + ':suspend'
                                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                : isSuspended
                                  ? <><PlayCircle size={12} /> Activate</>
                                  : <><PauseCircle size={12} /> Suspend</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
