'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Copy, CheckCircle, LogOut, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function PaymentInfo() {
  const [copied, setCopied] = useState(null)

  function copy(num, type) {
    navigator.clipboard.writeText(num)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-2">How to renew</p>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Send ৳299 to one of the numbers below</li>
          <li>Use &quot;Send Money&quot; option</li>
          <li>Screenshot your transaction</li>
          <li>WhatsApp us the screenshot</li>
        </ol>
      </div>

      {[
        { label: 'bKash',  num: '01629775202', bg: 'bg-pink-100',   text: 'text-pink-600',   short: 'bK', key: 'bkash' },
        { label: 'Nagad',  num: '01799900323', bg: 'bg-orange-100', text: 'text-orange-600', short: 'Ng', key: 'nagad' },
      ].map(({ label, num, bg, text, short, key }) => (
        <div key={key} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
              <span className={`${text} font-black text-sm`}>{short}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="font-bold text-slate-800 text-lg">{num}</p>
            </div>
          </div>
          <button
            onClick={() => copy(num, key)}
            className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg font-semibold transition-colors"
          >
            {copied === key ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied === key ? 'Copied!' : 'Copy'}
          </button>
        </div>
      ))}

      <p className="text-xs text-slate-400 text-center pt-1">
        Your account will be restored within 24 hours after payment.
        <br />Questions? WhatsApp: 01629775202
      </p>
    </div>
  )
}

function BlockedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const reason = searchParams.get('reason') // 'suspended' | 'expired'

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const isSuspended = reason === 'suspended'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isSuspended ? 'bg-slate-100' : 'bg-red-50'}`}>
          <span className="text-3xl">{isSuspended ? '🔒' : '⏰'}</span>
        </div>

        <h1 className="text-xl font-black text-slate-800 text-center">
          {isSuspended ? 'Account Suspended' : 'Subscription Expired'}
        </h1>

        <p className="text-sm text-slate-500 text-center mt-2">
          {isSuspended
            ? 'Your account has been suspended by the administrator. Please contact support to restore access.'
            : 'Your free trial or subscription has ended. Renew for ৳299/month to continue using Ora.'}
        </p>

        {isSuspended ? (
          <div className="mt-6 bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600">Contact support via WhatsApp</p>
            <p className="font-bold text-slate-800 text-lg mt-1">01629775202</p>
          </div>
        ) : (
          <PaymentInfo />
        )}

        <button
          onClick={() => router.replace('/')}
          className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw size={15} />
          Try again
        </button>

        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 py-2.5 rounded-xl transition-colors"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </div>
  )
}

export default function BlockedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    }>
      <BlockedContent />
    </Suspense>
  )
}
