import { NextResponse } from 'next/server'

export async function GET(request) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== 'AdminH1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/clinic_settings?select=*`
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    const text = await res.text()
    
    if (!res.ok) {
      console.error('Supabase REST error:', res.status, text)
      return NextResponse.json({ error: text, status: res.status }, { status: 500 })
    }

    const data = JSON.parse(text)
    return NextResponse.json(data || [])

  } catch (e) {
    console.error('Fetch error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
