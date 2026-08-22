#!/usr/bin/env node
/**
 * The frequency box offers the presets plus whatever a clinic has typed before,
 * read back from their own recent prescriptions. This covers the reduction from
 * raw prescription_items rows to that suggestion list — the part that decides
 * what a doctor sees, and the part a database is not needed to check.
 *
 * Run: npm run test:frequency
 */
import { readFileSync } from 'node:fs'

// The component is JSX, so pull the two pieces under test out of the source
// rather than importing it. Keeps this runnable with plain node.
const source = readFileSync(
  new URL('../components/prescriptions/fields.jsx', import.meta.url),
  'utf8'
)

const presetLine = source.match(/export const FREQ_OPTIONS\s*=\s*(\[[^\]]*\])/)
if (!presetLine) throw new Error('could not find FREQ_OPTIONS in fields.jsx')
const FREQ_OPTIONS = JSON.parse(presetLine[1].replace(/'/g, '"'))

const capLine = source.match(/const MAX_REMEMBERED\s*=\s*(\d+)/)
if (!capLine) throw new Error('could not find MAX_REMEMBERED in fields.jsx')
const MAX_REMEMBERED = Number(capLine[1])

const body = source.match(
  /export function pickRemembered\(items\) \{([\s\S]*?)\n\}/
)
if (!body) throw new Error('could not find pickRemembered in fields.jsx')
const pickRemembered = new Function(
  'items', 'FREQ_OPTIONS', 'MAX_REMEMBERED',
  body[1]
)
const pick = (items) => pickRemembered(items, FREQ_OPTIONS, MAX_REMEMBERED)

const rows = (...values) => values.map(frequency => ({ frequency }))

const CASES = [
  {
    name: 'keeps a freely typed frequency',
    items: rows('1tbs+1tbs+1tbs'),
    expect: ['1tbs+1tbs+1tbs'],
  },
  {
    name: 'drops the presets — they are already in the list',
    items: rows(...FREQ_OPTIONS),
    expect: [],
  },
  {
    name: 'drops blanks, nulls and whitespace-only values',
    items: [{ frequency: '' }, { frequency: null }, { frequency: '   ' }, {}],
    expect: [],
  },
  {
    name: 'trims surrounding whitespace',
    items: rows('  2+0+2  '),
    expect: ['2+0+2'],
  },
  {
    name: 'a trimmed value still counts as a preset',
    items: rows(`  ${FREQ_OPTIONS[0]}  `),
    expect: [],
  },
  {
    name: 'dedupes, keeping the first (most recent) occurrence',
    items: rows('3+0+3', '1+1+1', '3+0+3', '0+2+0'),
    expect: ['3+0+3', '0+2+0'],
  },
  {
    name: `caps the list at ${MAX_REMEMBERED}`,
    items: rows(...Array.from({ length: 30 }, (_, i) => `custom-${i}`)),
    expect: Array.from({ length: MAX_REMEMBERED }, (_, i) => `custom-${i}`),
  },
  {
    name: 'no history at all',
    items: [],
    expect: [],
  },
  {
    name: 'survives a malformed row',
    items: [{ frequency: 42 }, { frequency: '1+0+0' }],
    expect: ['1+0+0'],
  },
]

let failed = 0
for (const c of CASES) {
  let actual
  try {
    actual = pick(c.items)
  } catch (err) {
    console.error(`FAIL  ${c.name}\n      threw: ${err.message}`)
    failed++
    continue
  }
  const ok = JSON.stringify(actual) === JSON.stringify(c.expect)
  if (!ok) {
    console.error(
      `FAIL  ${c.name}\n      expected ${JSON.stringify(c.expect)}\n      got      ${JSON.stringify(actual)}`
    )
    failed++
  } else {
    console.log(`PASS  ${c.name}`)
  }
}

// The presets themselves are what a doctor reaches for most; a typo here is a
// daily annoyance, so pin them.
const EXPECTED_PRESETS = ['1+0+1', '1+1+1', '0+0+1', '1tbs+0+1tbs', '2tbs+0+2tbs']
if (JSON.stringify(FREQ_OPTIONS) !== JSON.stringify(EXPECTED_PRESETS)) {
  console.error(
    `FAIL  preset list\n      expected ${JSON.stringify(EXPECTED_PRESETS)}\n      got      ${JSON.stringify(FREQ_OPTIONS)}`
  )
  failed++
} else {
  console.log('PASS  preset list matches the agreed five')
}

console.log(
  failed === 0
    ? `\nAll ${CASES.length + 1} checks pass.`
    : `\n${failed} check(s) failed.`
)
process.exit(failed === 0 ? 0 : 1)
