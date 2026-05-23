'use client'
import { useState } from 'react'
import { X, Copy, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

function PaymentModal({ onClose }) {
  const [copied, setCopied] = useState(null)

  function copyNumber(num, type) {
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
              <h2 className="text-lg font-bold text-slate-800">Renew Subscription</h2>
              <p className="text-sm text-slate-500 mt-0.5">Send ৳299 to renew for 1 month</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={20} />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-800 mb-2">📋 How to pay</p>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Send ৳299 to one of the numbers below</li>
              <li>Use &quot;Send Money&quot; option</li>
              <li>Screenshot your transaction</li>
              <li>WhatsApp us the screenshot</li>
            </ol>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <span className="text-pink-600 font-black text-sm">bK</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">bKash</p>
                  <p className="font-bold text-slate-800 text-lg">01629775202</p>
                </div>
              </div>
              <button
                onClick={() => copyNumber('01629775202', 'bkash')}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-semibold transition-colors"
              >
                {copied === 'bkash' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied === 'bkash' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-orange-600 font-black text-sm">Ng</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Nagad</p>
                  <p className="font-bold text-slate-800 text-lg">01799900323</p>
                </div>
              </div>
              <button
                onClick={() => copyNumber('01799900323', 'nagad')}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-semibold transition-colors"
              >
                {copied === 'nagad' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied === 'nagad' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            After payment, your account will be extended within 24 hours.
            <br />Questions? WhatsApp: 01629775202
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionBanner({ settings }) {
  const [showModal, setShowModal] = useState(false)

  if (!settings) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isSuspended = settings.subscription_status === 'suspended'
  const isOnTrial = settings.subscription_status === 'trial' || !settings.subscription_status
  const isActive  = settings.subscription_status === 'active'

  if (isSuspended) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2.5 border bg-red-50 border-red-200 rounded-xl mb-4">
        <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
          <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500" />
        </div>
        <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Suspended</span>
        <span className="w-px h-4 bg-red-200" />
        <span className="text-sm text-red-700">Your account has been suspended. Contact support to restore access.</span>
      </div>
    )
  }
  const endDateStr = isOnTrial ? settings.trial_end : settings.subscription_end

  let daysLeft = null
  let endDateFormatted = ''

  if (endDateStr) {
    const end = new Date(endDateStr + 'T00:00:00')
    daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    endDateFormatted = format(end, 'MMM d, yyyy')
  }

  const isExpired = daysLeft !== null && daysLeft <= 0
  const isUrgent  = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const isHealthy = isActive || (!isExpired && !isUrgent)

  // ── Active paid subscription — green banner, no button ────────────────────
  if (isActive && daysLeft !== null && daysLeft > 7) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2.5 border bg-emerald-50 border-emerald-200 rounded-xl mb-4">
        <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
          <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active</span>
          <span className="w-px h-4 bg-emerald-200" />
          <span className="text-sm text-emerald-700">
            Subscription active till <strong>{endDateFormatted}</strong>
          </span>
        </div>
      </div>
    )
  }

  // ── Trial or expiring soon — amber/orange/red banner ─────────────────────
  let bgColor  = 'bg-amber-50 border-amber-200'
  let dotColor = 'bg-amber-500'
  let pingColor = 'bg-amber-400'
  let labelColor = 'text-amber-800'
  let msgColor = 'text-amber-700'
  let btnColor = 'bg-amber-500 hover:bg-amber-600'

  if (isExpired) {
    bgColor   = 'bg-red-50 border-red-200'
    dotColor  = 'bg-red-500'
    pingColor = 'bg-red-400'
    labelColor = 'text-red-800'
    msgColor  = 'text-red-700'
    btnColor  = 'bg-red-500 hover:bg-red-600'
  } else if (isUrgent) {
    bgColor   = 'bg-orange-50 border-orange-200'
    dotColor  = 'bg-orange-500'
    pingColor = 'bg-orange-400'
    labelColor = 'text-orange-800'
    msgColor  = 'text-orange-700'
    btnColor  = 'bg-orange-500 hover:bg-orange-600'
  }

  const label = isOnTrial ? 'Free Trial' : 'Subscription'

  let message = ''
  if (isExpired) {
    message = `Your ${isOnTrial ? 'trial' : 'subscription'} ended on ${endDateFormatted} · Renew to keep access`
  } else if (endDateStr) {
    message = `Ends ${endDateFormatted} · ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining · ৳299/month to renew`
  } else {
    message = 'Renew for ৳299/month to continue'
  }

  return (
    <>
      <div className={`inline-flex items-center justify-between px-4 py-2.5 border ${bgColor} rounded-xl mb-4`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pulsing dot */}
          <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
            <span className={`absolute inline-flex w-3 h-3 rounded-full ${pingColor} opacity-60 animate-ping`} />
            <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${dotColor}`} />
          </div>
          {/* Label */}
          <span className={`text-xs font-bold ${labelColor} uppercase tracking-wider`}>{label}</span>
          {/* Divider */}
          <span className="w-px h-4 bg-current opacity-20" />
          {/* Message */}
          <span className={`text-sm ${msgColor}`}>{message}</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`${btnColor} text-white text-xs font-bold px-4 py-1.5 rounded-lg ml-4 shrink-0 transition-colors`}
        >
          Renew Now →
        </button>
      </div>

      {showModal && <PaymentModal onClose={() => setShowModal(false)} />}
    </>
  )
}
