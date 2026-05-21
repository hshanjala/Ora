'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import { createClient } from '@/lib/supabase/client'

function getBlockReason(settings) {
  if (!settings) return null
  if (settings.subscription_status === 'suspended') return 'suspended'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isOnTrial = settings.subscription_status === 'trial' || !settings.subscription_status
  const isActive  = settings.subscription_status === 'active'

  if (isOnTrial && settings.trial_end) {
    const end = new Date(settings.trial_end + 'T00:00:00')
    if (end < today) return 'expired'
  }

  if (isActive && settings.subscription_end) {
    const end = new Date(settings.subscription_end + 'T00:00:00')
    if (end < today) return 'expired'
  }

  return null
}

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const supabase = createClient()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('clinic_id', user.id)
        .single()

      const reason = getBlockReason(data)
      if (reason) {
        router.replace(`/blocked?reason=${reason}`)
        return
      }

      setSettings(data)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-black text-white">O</span>
          </div>
          <div className="spinner mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar clinicName={settings?.clinic_name} />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
