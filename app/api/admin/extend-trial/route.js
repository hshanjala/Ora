import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/adminAuth'
import { format, addDays } from 'date-fns'

export async function POST(request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clinic_id, current_trial_end } = await request.json()
  if (!clinic_id) {
    return NextResponse.json({ error: 'Missing clinic_id' }, { status: 400 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let base = today
  if (current_trial_end) {
    const end = new Date(current_trial_end + 'T00:00:00')
    if (end > today) base = end
  }

  const newTrialEnd = format(addDays(base, 14), 'yyyy-MM-dd')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase
    .from('clinic_settings')
    .update({ trial_end: newTrialEnd })
    .eq('clinic_id', clinic_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, new_trial_end: newTrialEnd })
}
