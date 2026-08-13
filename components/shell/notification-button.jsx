'use client'
// Push-notification toggle (logic unchanged from the retired
// components/NotificationButton.jsx — presentation rebuilt on the system).
import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { IconButton, Tooltip } from '@/components/ui'
import { cn } from '@/lib/cn'

function urlB64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export default function NotificationButton() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setStatus(sub ? 'on' : 'off')
      })
      .catch(() => setStatus('unsupported'))
  }, [])

  async function toggle() {
    const reg = await navigator.serviceWorker.ready
    if (status === 'on') {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setStatus('off')
    } else {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      setStatus('on')
    }
  }

  if (status === 'loading' || status === 'unsupported') return null

  const label =
    status === 'denied'
      ? 'Notifications blocked — enable in browser settings'
      : status === 'on'
        ? 'Notifications on — click to turn off'
        : 'Enable appointment notifications'

  return (
    <Tooltip label={label}>
      <IconButton
        aria-label={label}
        onClick={status === 'denied' ? undefined : toggle}
        disabled={status === 'denied'}
        className={cn(status === 'on' && 'text-accent-text')}
      >
        {status === 'on' ? (
          <Bell size={16} strokeWidth={1.75} />
        ) : (
          <BellOff size={16} strokeWidth={1.75} />
        )}
      </IconButton>
    </Tooltip>
  )
}
