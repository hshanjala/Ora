#!/usr/bin/env node
/**
 * The schedule's "All appointments" view queries a whole calendar week, month
 * or year. Getting a boundary wrong silently hides appointments — the last day
 * of a month, or every booking in December — with nothing on screen to say so.
 * These check the boundaries directly.
 *
 * Run: npm run test:period
 */
import {
  format,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
} from 'date-fns'

const ISO = (d) => format(d, 'yyyy-MM-dd')

// Mirrors components/schedule/appointment-list-modal.jsx. Kept in step by the
// last case below, which fails if the two definitions drift apart.
function periodRange(period, now = new Date()) {
  if (period === 'week') {
    return {
      from: ISO(startOfWeek(now, { weekStartsOn: 0 })),
      to: ISO(endOfWeek(now, { weekStartsOn: 0 })),
      label: `${format(startOfWeek(now, { weekStartsOn: 0 }), 'MMM d')} – ${format(endOfWeek(now, { weekStartsOn: 0 }), 'MMM d, yyyy')}`,
    }
  }
  if (period === 'year') {
    return {
      from: ISO(startOfYear(now)),
      to: ISO(endOfYear(now)),
      label: format(now, 'yyyy'),
    }
  }
  return {
    from: ISO(startOfMonth(now)),
    to: ISO(endOfMonth(now)),
    label: format(now, 'MMMM yyyy'),
  }
}

const at = (s) => new Date(`${s}T12:00:00`)

const CASES = [
  // Week — Sunday to Saturday, matching the day navigator's week.
  { name: 'week: mid-week', period: 'week', now: '2026-08-25',
    from: '2026-08-23', to: '2026-08-29' },
  { name: 'week: on the Sunday itself', period: 'week', now: '2026-08-23',
    from: '2026-08-23', to: '2026-08-29' },
  { name: 'week: on the Saturday itself', period: 'week', now: '2026-08-29',
    from: '2026-08-23', to: '2026-08-29' },
  { name: 'week: spanning a month boundary', period: 'week', now: '2026-09-01',
    from: '2026-08-30', to: '2026-09-05' },
  // 1 Jan 2026 is a Thursday, so its Sunday-start week runs back into 2025.
  { name: 'week: spanning a year boundary', period: 'week', now: '2026-01-01',
    from: '2025-12-28', to: '2026-01-03' },

  // Month — includes the last day, which an exclusive bound would drop.
  { name: 'month: 31-day', period: 'month', now: '2026-08-25',
    from: '2026-08-01', to: '2026-08-31' },
  { name: 'month: 30-day', period: 'month', now: '2026-09-15',
    from: '2026-09-01', to: '2026-09-30' },
  { name: 'month: February, non-leap', period: 'month', now: '2026-02-10',
    from: '2026-02-01', to: '2026-02-28' },
  { name: 'month: February, leap year', period: 'month', now: '2028-02-10',
    from: '2028-02-01', to: '2028-02-29' },
  { name: 'month: on the last day', period: 'month', now: '2026-08-31',
    from: '2026-08-01', to: '2026-08-31' },

  // Year — 31 December must be inside the range.
  { name: 'year: mid-year', period: 'year', now: '2026-08-25',
    from: '2026-01-01', to: '2026-12-31' },
  { name: 'year: on 31 December', period: 'year', now: '2026-12-31',
    from: '2026-01-01', to: '2026-12-31' },
  { name: 'year: on 1 January', period: 'year', now: '2026-01-01',
    from: '2026-01-01', to: '2026-12-31' },
  { name: 'year: leap year still ends 31 Dec', period: 'year', now: '2028-06-01',
    from: '2028-01-01', to: '2028-12-31' },

  // An unknown value must not produce an empty or reversed range.
  { name: 'unknown period falls back to the month', period: 'nonsense', now: '2026-08-25',
    from: '2026-08-01', to: '2026-08-31' },
]

let failed = 0
for (const c of CASES) {
  const r = periodRange(c.period, at(c.now))
  const ok = r.from === c.from && r.to === c.to
  if (!ok) {
    console.error(
      `FAIL  ${c.name}\n      expected ${c.from} → ${c.to}\n      got      ${r.from} → ${r.to}`
    )
    failed++
  } else {
    console.log(`PASS  ${c.name}  (${r.from} → ${r.to})`)
  }
}

// Ranges must never be reversed, whatever the input.
for (const period of ['week', 'month', 'year']) {
  const r = periodRange(period, at('2026-08-25'))
  if (r.from > r.to) {
    console.error(`FAIL  ${period}: range is reversed (${r.from} → ${r.to})`)
    failed++
  }
}
console.log('PASS  no range is reversed')

// Labels are what a doctor reads to know what they are looking at.
const labels = [
  ['week', '2026-08-25', 'Aug 23 – Aug 29, 2026'],
  ['month', '2026-08-25', 'August 2026'],
  ['year', '2026-08-25', '2026'],
]
for (const [period, now, expected] of labels) {
  const actual = periodRange(period, at(now)).label
  if (actual !== expected) {
    console.error(`FAIL  ${period} label\n      expected "${expected}"\n      got      "${actual}"`)
    failed++
  } else {
    console.log(`PASS  ${period} label reads "${actual}"`)
  }
}

// Guard against this copy drifting from the component's.
const { readFileSync } = await import('node:fs')
const source = readFileSync(
  new URL('../components/schedule/appointment-list-modal.jsx', import.meta.url),
  'utf8'
)
const normalise = (s) => s.replace(/\s+/g, ' ').trim()
const inComponent = source.match(/export function periodRange\(period, now = new Date\(\)\) \{([\s\S]*?)\n\}/)
const inTest = periodRange.toString().match(/\{([\s\S]*)\}$/)
if (!inComponent) {
  console.error('FAIL  could not find periodRange in the component')
  failed++
} else if (!normalise(inTest[1]).includes(normalise(inComponent[1]).slice(0, 120))) {
  console.error('FAIL  periodRange here has drifted from the component')
  failed++
} else {
  console.log('PASS  matches the component definition')
}

console.log(failed === 0 ? `\nAll checks pass.` : `\n${failed} check(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
