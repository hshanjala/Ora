'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AppShell from '@/components/shell/app-shell'
import { Spinner } from '@/components/ui'
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
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo-icon-sm.png" alt="Ora" width={36} height={36} priority />
          <Spinner size={18} className="text-tertiary" />
        </div>
      </div>
    )
  }

  return <AppShell settings={settings}>{children}</AppShell>
}
