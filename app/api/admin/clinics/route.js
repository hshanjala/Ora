import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/adminAuth'

export async function GET(request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin/clinics] SUPABASE_SERVICE_ROLE_KEY is not set')
    return NextResponse.json({ error: 'Server misconfiguration: missing service role key' }, { status: 500 })
  }

  // Detect if the anon key was accidentally used instead of the service_role key
  try {
    const payload = JSON.parse(Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY.split('.')[1], 'base64').toString())
    if (payload.role !== 'service_role') {
      console.error('[admin/clinics] Wrong key: SUPABASE_SERVICE_ROLE_KEY has role =', payload.role, '(should be service_role)')
      return NextResponse.json({ error: `Wrong key: SUPABASE_SERVICE_ROLE_KEY is a "${payload.role}" key, not a "service_role" key. Go to Supabase → Project Settings → Data API and copy the service_role key.` }, { status: 500 })
    }
  } catch {
    // non-JWT key format, let Supabase reject it naturally
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('clinic_settings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/clinics] Supabase error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
