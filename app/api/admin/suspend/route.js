import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/adminAuth'

export async function POST(request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clinic_id, action } = await request.json()
  if (!clinic_id || !['suspend', 'reactivate'].includes(action)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase
    .from('clinic_settings')
    .update(
      action === 'suspend'
        ? { subscription_status: 'suspended' }
        : { subscription_status: 'active', subscription_end: null }
    )
    .eq('clinic_id', clinic_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
