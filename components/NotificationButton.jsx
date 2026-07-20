'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

function urlB64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
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
    navigator.serviceWorker.register('/sw.js').then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'on' : 'off')
    }).catch(() => setStatus('unsupported'))
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
      if (permission !== 'granted') { setStatus('denied'); return }
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

  if (status === 'denied') {
    return (
      <div className="sidebar-link w-full opacity-50 cursor-not-allowed" title="Notifications blocked — change in browser settings">
        <BellOff size={18} />
        <span>Notifications blocked</span>
      </div>
    )
  }

  return (
    <button
      onClick={toggle}
      className={`sidebar-link w-full ${status === 'on' ? 'text-emerald-300' : 'opacity-70'}`}
      title={status === 'on' ? 'Notifications ON — click to turn off' : 'Enable appointment notifications'}
    >
      {status === 'on' ? <Bell size={18} /> : <BellOff size={18} />}
      <span>{status === 'on' ? 'Notifications On' : 'Enable Notifications'}</span>
    </button>
  )
}
