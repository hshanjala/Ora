import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('clinic_settings')
          .select('clinic_id')
          .eq('clinic_id', user.id)
          .single()

        if (!existing) {
          const trialEnd = new Date()
          trialEnd.setDate(trialEnd.getDate() + 14)
          await supabase.from('clinic_settings').insert({
            clinic_id: user.id,
            clinic_name: user.user_metadata?.full_name || '',
            doctor_name: user.user_metadata?.full_name || '',
            trial_end: trialEnd.toISOString().split('T')[0],
            subscription_status: 'trial',
          })
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
