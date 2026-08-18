/**
 * The single definition of "is this clinic allowed in right now".
 *
 * Extracted from middleware so the rule can be tested directly and so the
 * dashboard banner, the admin panel and the gate cannot drift apart again —
 * they previously disagreed about whether the expiry day itself still counts
 * as access, which let expired clinics keep using the app.
 *
 * @param settings clinic_settings row (subscription_status, trial_end, subscription_end)
 * @param now      current time; defaults to real now
 * @returns 'suspended' | 'expired' | null   (null = allowed)
 */
export function getBlockReason(settings, now = new Date()) {
  if (!settings) return null

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const status = settings.subscription_status

  if (status === 'suspended') return 'suspended'

  const isOnTrial = status === 'trial' || !status

  // Pick the governing date by the KIND of account, not by whitelisting
  // statuses. Whitelisting meant any unrecognised status — including
  // 'expired', which the schema itself lists — resolved to no date, so no
  // check ran and the account kept working indefinitely.
  const endStr = isOnTrial ? settings.trial_end : settings.subscription_end

  if (endStr) {
    const end = new Date(endStr + 'T00:00:00')
    // The end date is the first blocked day: it matches the dashboard banner
    // and admin panel, which both treat daysLeft <= 0 as expired, and makes a
    // 14-day trial exactly 14 days.
    return end <= today ? 'expired' : null
  }

  // No governing date. 'active' with a null end date is admin reactivation —
  // deliberate open-ended access. A trial with no trial_end predates the
  // current signup flow and is left alone. Anything else fails closed.
  if (isOnTrial || status === 'active') return null
  return 'expired'
}
