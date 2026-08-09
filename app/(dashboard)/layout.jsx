'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'

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

      setSettings(data)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-lg font-bold text-white">O</span>
          </div>
          <div className="spinner mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar clinicName={settings?.clinic_name} />
      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
