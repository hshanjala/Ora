import { getBlockReason } from '../lib/subscriptionAccess.js'
const NOW = new Date('2026-08-18T14:00:00')       // the day in the screenshot
const cases = [
  // [name, settings, expected]
  ['YOUR CASE: subscription ended today',      {subscription_status:'active', subscription_end:'2026-08-18'}, 'expired'],
  ['subscription ended yesterday',             {subscription_status:'active', subscription_end:'2026-08-17'}, 'expired'],
  ['subscription ends tomorrow',               {subscription_status:'active', subscription_end:'2026-08-19'}, null],
  ['subscription ends next month',             {subscription_status:'active', subscription_end:'2026-09-18'}, null],
  ['trial ends today',                         {subscription_status:'trial',  trial_end:'2026-08-18'},        'expired'],
  ['trial ends tomorrow',                      {subscription_status:'trial',  trial_end:'2026-08-19'},        null],
  ['status null (legacy), trial ended',        {subscription_status:null,     trial_end:'2026-08-01'},        'expired'],
  ['suspended',                                {subscription_status:'suspended'},                             'suspended'],
  ['suspended beats a valid future date',      {subscription_status:'suspended', subscription_end:'2027-01-01'}, 'suspended'],
  ["status 'expired' (schema lists it)",       {subscription_status:'expired', subscription_end:'2026-08-01'}, 'expired'],
  ["status 'expired', no dates at all",        {subscription_status:'expired'},                               'expired'],
  ['unknown junk status, no dates',            {subscription_status:'cancelled'},                             'expired'],
  ['admin reactivation (active, null end)',    {subscription_status:'active', subscription_end:null},         null],
  ['trial with no trial_end (pre-signup-flow)',{subscription_status:'trial',  trial_end:null},                null],
  ['no settings row',                          null,                                                          null],
]
let pass=0, fail=0
for (const [name, s, want] of cases) {
  const got = getBlockReason(s, NOW)
  const ok = got === want
  ok ? pass++ : fail++
  console.log(`${ok?'PASS':'FAIL'}  ${String(got).padEnd(10)} (want ${String(want).padEnd(10)})  ${name}`)
}
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail?1:0)
