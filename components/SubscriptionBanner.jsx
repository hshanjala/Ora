'use client'
import { useState } from 'react'
import { X, Copy, CheckCircle } from 'lucide-react'

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
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Renew Subscription</h2>
              <p className="text-sm text-slate-500 mt-0.5">Send ৳299 to renew for 1 month</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={20} />
            </button>
          </div>

          {/* Steps */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-800 mb-2">📋 How to pay</p>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Send ৳299 to one of the numbers below</li>
              <li>Use &quot;Send Money&quot; option</li>
              <li>Screenshot your transaction</li>
              <li>WhatsApp us the screenshot</li>
            </ol>
          </div>

          {/* bKash */}
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

          {/* Nagad */}
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

  let daysLeft = null
  let isOnTrial = settings.subscription_status === 'trial'
  let expiredDate = isOnTrial ? settings.trial_end : settings.subscription_end

  if (expiredDate) {
    const end = new Date(expiredDate)
    const diff = end - today
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Don't show banner if subscription is fine (>7 days left)
  if (daysLeft !== null && daysLeft > 7) return null

  const isExpired = daysLeft !== null && daysLeft <= 0
  const isUrgent = daysLeft !== null && daysLeft <= 3

  let bgColor = 'bg-amber-50 border-amber-200'
  let textColor = 'text-amber-800'
  let btnColor = 'bg-amber-500 hover:bg-amber-600'
  let emoji = '⏳'

  if (isExpired) {
    bgColor = 'bg-red-50 border-red-200'
    textColor = 'text-red-800'
    btnColor = 'bg-red-500 hover:bg-red-600'
    emoji = '🚨'
  } else if (isUrgent) {
    bgColor = 'bg-orange-50 border-orange-200'
    textColor = 'text-orange-800'
    btnColor = 'bg-orange-500 hover:bg-orange-600'
    emoji = '⚠️'
  }

  let message = ''
  if (isExpired) {
    message = `Your ${isOnTrial ? 'trial' : 'subscription'} has expired. Renew now to continue using Ora.`
  } else {
    message = `${emoji} ${isOnTrial ? 'Trial' : 'Subscription'} ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew for ৳299/month.`
  }

  return (
    <>
      <div className={`flex items-center justify-between px-4 py-2.5 border ${bgColor} rounded-xl mb-4`}>
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        <button
          onClick={() => setShowModal(true)}
          className={`${btnColor} text-white text-xs font-bold px-4 py-1.5 rounded-lg ml-4 shrink-0 transition-colors`}
        >
          Pay Now →
        </button>
      </div>

      {showModal && <PaymentModal onClose={() => setShowModal(false)} />}
    </>
  )
}
