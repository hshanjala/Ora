#!/usr/bin/env node
/**
 * Design-system guardrail.
 *
 * Fails the build when feature code reaches outside the token system:
 *   • raw hex colours and rgb()/hsl() literals
 *   • arbitrary Tailwind values — text-[13px], bg-[#fff], p-[7px]
 *   • Tailwind's stock palette — bg-slate-500, text-emerald-600, …
 *   • font sizes outside the nine-step scale
 *   • inline style={{ … }} objects, except where a value is genuinely dynamic
 *
 * Run: npm run lint:design
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'components']
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css'])

// Files exempt from the colour rules, with the reason each one is allowed.
const EXEMPT = [
  {
    match: /app[\\/]styles[\\/].*\.css$/,
    why: 'token source files — raw values live here by definition',
  },
  {
    match: /app\/design-system\//,
    why: 'the styleguide documents token values and renders swatches dynamically',
  },
]

// Specific allowances that survive review, keyed by an exact snippet.
const ALLOWED_SNIPPETS = [
  {
    test: /#4285F4|#34A853|#FBBC05|#EA4335/,
    why: "Google's official logo colours — brand assets must not be re-tinted",
  },
]

// Tailwind stock palette families that must never appear in feature code.
const STOCK_PALETTE = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
  'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]

const SCALE_FONT_SIZES = [
  'display', 'h1', 'h2', 'h3', 'body', 'body-md', 'small', 'label', 'micro',
]

// Tailwind sizes that are legitimately not font sizes (text-center, text-left…)
const NON_SIZE_TEXT_UTILS = new Set([
  'left', 'center', 'right', 'justify', 'start', 'end',
  'wrap', 'nowrap', 'balance', 'pretty', 'clip', 'ellipsis',
  'current', 'transparent', 'inherit',
  // semantic colours from the token map
  'primary', 'secondary', 'tertiary', 'inverse', 'accent', 'accent-text',
  'success', 'warning', 'danger', 'info', 'sidebar-fg', 'sidebar-fg-active',
])

const RULES = [
  {
    id: 'raw-hex',
    re: /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{1,5})?\b/g,
    message: 'raw hex colour — use a semantic token',
    colorRule: true,
  },
  {
    id: 'raw-rgb',
    re: /\b(?:rgb|rgba|hsl|hsla)\(/g,
    message: 'raw colour function — use a semantic token',
    colorRule: true,
  },
  {
    id: 'arbitrary-value',
    // bg-[#fff], text-[13px], p-[7px] — but allow CSS-var arbitrary values
    // like w-[var(--x)] and data/aria selector variants.
    re: /(?<![\w-])(?:bg|text|border|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|w|h|min-w|min-h|max-w|max-h|rounded|shadow|leading|tracking)-\[(?!var\()[^\]]+\]/g,
    message: 'arbitrary Tailwind value — use a scale token',
  },
  {
    id: 'stock-palette',
    re: new RegExp(
      `(?<![\\w-])(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|accent|decoration|shadow|placeholder)-(?:${STOCK_PALETTE.join('|')})-\\d{2,3}\\b`,
      'g'
    ),
    message: "Tailwind stock palette — use a semantic token (bg-surface, text-secondary, …)",
  },
  {
    id: 'inline-style',
    re: /style=\{\{/g,
    message: 'inline style object — use utilities, or add an exemption comment if the value is genuinely dynamic',
    allowWithComment: 'design-lint-allow-inline-style',
  },
]

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (EXTENSIONS.has(extname(entry))) out.push(full)
  }
  return out
}

function exemptionFor(relPath) {
  return EXEMPT.find(e => e.match.test(relPath))
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

function checkFontSizes(source, relPath, violations) {
  const re = /(?<![\w-])text-([a-z0-9-]+)(?![\w-])/g
  let m
  while ((m = re.exec(source)) !== null) {
    const value = m[1]
    if (SCALE_FONT_SIZES.includes(value)) continue
    if (NON_SIZE_TEXT_UTILS.has(value)) continue
    // Stock-palette and arbitrary values are reported by their own rules.
    if (STOCK_PALETTE.some(p => value.startsWith(p + '-'))) continue
    if (/^(xs|sm|base|lg|xl|\dxl)$/.test(value)) {
      violations.push({
        file: relPath,
        line: lineOf(source, m.index),
        rule: 'font-scale',
        snippet: m[0],
        message: `font size outside the scale — use ${SCALE_FONT_SIZES.map(s => `text-${s}`).join(', ')}`,
      })
    }
  }
}

function main() {
  const files = SCAN_DIRS
    .filter(d => { try { return statSync(join(ROOT, d)).isDirectory() } catch { return false } })
    .flatMap(d => walk(join(ROOT, d)))

  const violations = []

  for (const file of files) {
    const relPath = relative(ROOT, file)
    const source = readFileSync(file, 'utf8')
    const exemption = exemptionFor(relPath)

    for (const rule of RULES) {
      if (rule.colorRule && exemption) continue
      rule.re.lastIndex = 0
      let m
      while ((m = rule.re.exec(source)) !== null) {
        const snippet = m[0]

        if (ALLOWED_SNIPPETS.some(a => a.test.test(snippet))) continue

        // Opt-out for genuinely dynamic values: the marker comment may sit up
        // to LOOKBACK lines above, since it usually precedes a multi-line
        // element rather than the style prop itself.
        if (rule.allowWithComment) {
          const LOOKBACK = 12
          const line = lineOf(source, m.index)
          const lines = source.split('\n')
          const context = lines.slice(Math.max(0, line - 1 - LOOKBACK), line).join('\n')
          if (context.includes(rule.allowWithComment)) continue
        }

        violations.push({
          file: relPath,
          line: lineOf(source, m.index),
          rule: rule.id,
          snippet: snippet.length > 60 ? snippet.slice(0, 57) + '…' : snippet,
          message: rule.message,
        })
      }
    }

    if (!exemption && /\.(jsx?|tsx?)$/.test(relPath)) {
      checkFontSizes(source, relPath, violations)
    }
  }

  if (violations.length === 0) {
    console.log(`design lint: clean — ${files.length} files checked`)
    process.exit(0)
  }

  const byFile = violations.reduce((acc, v) => {
    ;(acc[v.file] ||= []).push(v)
    return acc
  }, {})

  console.error(`\ndesign lint: ${violations.length} violation(s)\n`)
  for (const [file, list] of Object.entries(byFile)) {
    console.error(file)
    for (const v of list.sort((a, b) => a.line - b.line)) {
      console.error(`  ${String(v.line).padStart(4)}  [${v.rule}] ${v.snippet}`)
      console.error(`        ${v.message}`)
    }
    console.error('')
  }
  console.error('Tokens: app/styles/tokens.css · Rules: docs/DESIGN_SYSTEM.md\n')
  process.exit(1)
}

main()
