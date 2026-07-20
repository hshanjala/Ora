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

  // Target: 1 hour from now in Bangladesh time (UTC+6)
  const bdTarget = new Date(Date.now() + (6 + 1) * 60 * 60 * 1000)
  const targetDate = bdTarget.toISOString().split('T')[0]
  const targetHour = String(bdTarget.getUTCHours()).padStart(2, '0')
  const targetTime = `${targetHour}:00`

  const { data: appointments } = await supabase
    .from('appointments')
    .select('clinic_id, time, patients(name)')
    .eq('date', targetDate)
    .eq('time', targetTime)
    .eq('status', 'scheduled')

  if (!appointments?.length) return NextResponse.json({ ok: true, sent: 0 })

  let sent = 0
  for (const apt of appointments) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('clinic_id', apt.clinic_id)

    if (!subs?.length) continue

    const name = apt.patients?.name || 'a patient'
    const payload = JSON.stringify({
      title: 'Upcoming Appointment — Ora',
      body: `Appointment with ${name} starts in 1 hour at ${apt.time}.`,
      tag: `hourly-${apt.clinic_id}-${apt.time}`,
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
