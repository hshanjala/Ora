import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== 'AdminH1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clinic_id, new_end } = await request.json()

  if (!clinic_id || !new_end) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase
    .from('clinic_settings')
    .update({
      subscription_status: 'active',
      subscription_end: new_end,
    })
    .eq('clinic_id', clinic_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
