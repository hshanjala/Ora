import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export async function GET(req) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Today's date in Bangladesh time (UTC+6)
  const bdNow = new Date(Date.now() + 6 * 60 * 60 * 1000)
  const today = bdNow.toISOString().split('T')[0]

  const { data: appointments } = await supabase
    .from('appointments')
    .select('clinic_id')
    .eq('date', today)
    .eq('status', 'scheduled')

  if (!appointments?.length) return NextResponse.json({ ok: true, sent: 0 })

  // Count by clinic
  const counts = {}
  for (const a of appointments) {
    counts[a.clinic_id] = (counts[a.clinic_id] || 0) + 1
  }

  let sent = 0
  for (const [clinicId, count] of Object.entries(counts)) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)

    if (!subs?.length) continue

    const payload = JSON.stringify({
      title: 'Appointments Today — Ora',
      body: `You have ${count} appointment${count > 1 ? 's' : ''} scheduled for today.`,
      tag: 'daily-reminder',
    })

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (e) {
        if (e.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent })
}
