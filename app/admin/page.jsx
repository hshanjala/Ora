'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import {
  Lock, RefreshCw, CheckCircle2, Clock, XCircle, LogOut,
  PauseCircle, PlayCircle, CalendarPlus, Building2,
} from 'lucide-react'
import {
  Button, IconButton, Tooltip, Card, PageHeader, SearchInput,
  DataTable, StatCard, StatusPill, FormField, Input, Alert,
  ConfirmDialog, ToastProvider, useToast, SpinnerBlock,
} from '@/components/ui'

function AdminLogin({ onAuthed }) {
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

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
        setPwInput('')
        onAuthed()
      } else {
        setPwError('Wrong password. Try again.')
      }
    } catch {
      setPwError('Connection error. Try again.')
    }
    setLoggingIn(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-inverse">
            <Lock size={18} strokeWidth={1.75} />
          </span>
          <h1 className="text-h2 text-primary">Ora Admin</h1>
          <p className="mt-0.5 text-small text-secondary">Enter your admin password</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <FormField label="Admin password" error={pwError || undefined}>
            <Input
              type="password"
              placeholder="••••••••"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={loggingIn}>
            {loggingIn ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

function AdminPanel({ onLoggedOut }) {
  const toast = useToast()
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [search, setSearch] = useState('')
  const [pendingSuspend, setPendingSuspend] = useState(null)

  const loadClinics = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/admin/clinics')
      if (res.status === 401) { onLoggedOut(); return }
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load clinics')
        setClinics([])
      } else {
        setClinics(Array.isArray(data) ? data : [])
      }
    } catch {
      setError('Failed to load clinics')
    }
    setLoading(false)
  }, [onLoggedOut])

  useEffect(() => { loadClinics() }, [loadClinics])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    onLoggedOut()
  }

  function getStatus(clinic) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (clinic.subscription_status === 'suspended') {
      return { label: 'Suspended', tone: 'neutral', daysLeft: null }
    }
    const isOnTrial = clinic.subscription_status === 'trial' || !clinic.subscription_status
    const endStr = isOnTrial ? clinic.trial_end : clinic.subscription_end
    if (!endStr) return { label: 'Trial', tone: 'warning', daysLeft: null }
    const end = new Date(endStr + 'T00:00:00')
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) return { label: 'Expired', tone: 'danger', daysLeft }
    if (isOnTrial) return { label: `Trial · ${daysLeft}d`, tone: 'warning', daysLeft }
    if (daysLeft <= 7) return { label: `Expiring · ${daysLeft}d`, tone: 'warning', daysLeft }
    return { label: `Active · ${daysLeft}d`, tone: 'success', daysLeft }
  }

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
    if (res.ok) {
      toast.success(
        `${clinic.clinic_name || 'Clinic'} extended`,
        `Now runs to ${format(new Date(newEnd + 'T00:00:00'), 'MMM d, yyyy')}`
      )
      loadClinics()
    } else {
      toast.error('Failed to extend', 'Please try again.')
    }
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
    if (res.ok) {
      toast.success(
        'Trial extended',
        `Now runs to ${format(new Date(data.new_trial_end + 'T00:00:00'), 'MMM d, yyyy')}`
      )
      loadClinics()
    } else {
      toast.error('Failed to extend trial', 'Please try again.')
    }
    setActionId(null)
  }

  async function confirmSuspend() {
    const clinic = pendingSuspend
    const isSuspended = clinic.subscription_status === 'suspended'
    setActionId(clinic.clinic_id + ':suspend')
    const res = await fetch('/api/admin/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinic.clinic_id,
        action: isSuspended ? 'reactivate' : 'suspend',
      }),
    })
    if (res.ok) {
      toast.success(
        isSuspended
          ? `${clinic.clinic_name || 'Clinic'} reactivated`
          : `${clinic.clinic_name || 'Clinic'} suspended`
      )
      loadClinics()
    } else {
      toast.error('Action failed', 'Please try again.')
    }
    setActionId(null)
    setPendingSuspend(null)
  }

  function formatDate(str) {
    if (!str) return '—'
    try { return format(new Date(str + 'T00:00:00'), 'MMM d, yyyy') } catch { return str }
  }

  const suspended = clinics.filter(c => c.subscription_status === 'suspended')
  const withStatus = clinics.filter(c => c.subscription_status !== 'suspended')
  const expired = withStatus.filter(c => { const d = getStatus(c).daysLeft; return d !== null && d <= 0 })
  const expiring = withStatus.filter(c => { const d = getStatus(c).daysLeft; return d !== null && d > 0 && d <= 7 })
  const active = withStatus.filter(c => { const d = getStatus(c).daysLeft; return d === null || d > 7 })

  const filtered = clinics.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.clinic_name || '').toLowerCase().includes(q) ||
      (c.doctor_name || '').toLowerCase().includes(q) ||
      (c.doctor_phone || '').toLowerCase().includes(q)
    )
  })

  function rowActions(clinic) {
    const isSuspended = clinic.subscription_status === 'suspended'
    const isOnTrial = clinic.subscription_status === 'trial' || !clinic.subscription_status
    const busy = Boolean(actionId)
    return (
      <div className="flex items-center justify-end gap-1.5">
        {!isSuspended && (
          <Tooltip label="Extend subscription by 30 days">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              loading={actionId === clinic.clinic_id + ':extend'}
              onClick={() => extendSubscription(clinic)}
            >
              +30d
            </Button>
          </Tooltip>
        )}
        {!isSuspended && isOnTrial && (
          <Tooltip label="Extend trial by 14 days">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              loading={actionId === clinic.clinic_id + ':trial'}
              onClick={() => extendTrial(clinic)}
            >
              <CalendarPlus size={13} strokeWidth={1.75} /> Trial
            </Button>
          </Tooltip>
        )}
        <Tooltip label={isSuspended ? 'Reactivate clinic' : 'Suspend clinic'}>
          <IconButton
            aria-label={isSuspended ? 'Reactivate clinic' : 'Suspend clinic'}
            size="sm"
            disabled={busy}
            onClick={() => setPendingSuspend(clinic)}
          >
            {isSuspended
              ? <PlayCircle size={14} strokeWidth={1.75} />
              : <PauseCircle size={14} strokeWidth={1.75} />}
          </IconButton>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto max-w-content p-4 md:p-6">
        <PageHeader
          title="Ora admin"
          subtitle={`${clinics.length} clinic${clinics.length !== 1 ? 's' : ''} registered`}
          actions={
            <>
              <Button variant="secondary" onClick={() => { setLoading(true); loadClinics() }}>
                <RefreshCw size={15} strokeWidth={1.75} /> Refresh
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut size={15} strokeWidth={1.75} /> Log out
              </Button>
            </>
          }
        />

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Expired" value={expired.length} icon={XCircle} tone={expired.length ? 'danger' : 'neutral'} />
          <StatCard label="Expiring soon" value={expiring.length} icon={Clock} tone={expiring.length ? 'warning' : 'neutral'} />
          <StatCard label="Active" value={active.length} icon={CheckCircle2} tone="success" />
          <StatCard label="Suspended" value={suspended.length} icon={PauseCircle} />
        </div>

        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search by clinic, doctor, or phone…"
          className="mb-4 max-w-md"
        />

        <Card>
          <DataTable
            columns={[
              {
                key: 'clinic_name', header: 'Clinic', sortable: true,
                cell: (c) => (
                  <span className="min-w-0">
                    <span className="block truncate text-body-md text-primary">{c.clinic_name || '—'}</span>
                    {c.clinic_address && (
                      <span className="block max-w-cell truncate text-label text-tertiary">
                        {c.clinic_address}
                      </span>
                    )}
                  </span>
                ),
              },
              {
                key: 'doctor_name', header: 'Doctor', hideBelow: 'md', sortable: true,
                cell: (c) => (
                  <span className="min-w-0">
                    <span className="block truncate text-secondary">{c.doctor_name || '—'}</span>
                    {c.doctor_designation && (
                      <span className="block truncate text-label text-tertiary">{c.doctor_designation}</span>
                    )}
                  </span>
                ),
              },
              {
                key: 'doctor_phone', header: 'Phone', hideBelow: 'lg', tabular: true,
                cell: (c) => c.doctor_phone || '—',
              },
              {
                key: 'status', header: 'Status',
                sortValue: (c) => getStatus(c).daysLeft ?? 9999,
                cell: (c) => {
                  const s = getStatus(c)
                  return <StatusPill status={s.tone}>{s.label}</StatusPill>
                },
              },
              {
                key: 'expires', header: 'Expires', hideBelow: 'sm', tabular: true,
                cell: (c) => {
                  const isOnTrial = c.subscription_status === 'trial' || !c.subscription_status
                  return formatDate(isOnTrial ? c.trial_end : c.subscription_end)
                },
              },
              { key: 'actions', header: '', align: 'right', cell: rowActions },
            ]}
            data={filtered}
            loading={loading}
            error={error}
            onRetry={() => { setLoading(true); loadClinics() }}
            emptyState={{
              icon: Building2,
              title: search ? 'No clinics match your search' : 'No clinics found',
              description: search ? 'Try a different clinic, doctor, or phone number.' : undefined,
            }}
            renderCard={(c) => {
              const s = getStatus(c)
              return (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body-md text-primary">{c.clinic_name || '—'}</p>
                      <p className="truncate text-label text-tertiary">{c.doctor_name || '—'}</p>
                    </div>
                    <StatusPill status={s.tone}>{s.label}</StatusPill>
                  </div>
                  {rowActions(c)}
                </div>
              )
            }}
          />
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingSuspend)}
        onOpenChange={(v) => { if (!v) setPendingSuspend(null) }}
        title={
          pendingSuspend?.subscription_status === 'suspended'
            ? 'Reactivate this clinic?'
            : 'Suspend this clinic?'
        }
        description={
          pendingSuspend
            ? pendingSuspend.subscription_status === 'suspended'
              ? `${pendingSuspend.clinic_name || 'This clinic'} will regain access immediately.`
              : `${pendingSuspend.clinic_name || 'This clinic'} will lose access immediately and see the suspended screen.`
            : ''
        }
        confirmLabel={
          pendingSuspend?.subscription_status === 'suspended' ? 'Reactivate' : 'Suspend'
        }
        destructive={pendingSuspend?.subscription_status !== 'suspended'}
        loading={Boolean(actionId)}
        onConfirm={confirmSuspend}
      />
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(null) // null = checking, false = login, true = in

  useEffect(() => {
    fetch('/api/admin/clinics')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false))
  }, [])

  if (authed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <SpinnerBlock />
      </div>
    )
  }

  return (
    <ToastProvider>
      {authed
        ? <AdminPanel onLoggedOut={() => setAuthed(false)} />
        : <AdminLogin onAuthed={() => setAuthed(true)} />}
    </ToastProvider>
  )
}
