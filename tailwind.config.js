/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
// Every utility below maps to a CSS variable in app/styles/tokens.css.
// Feature code uses ONLY these semantic utilities: bg-surface, text-secondary,
// border-strong, rounded-lg, shadow-sm, duration-fast, text-body…
//
// THE STOCK PALETTE IS GONE. `theme.colors` REPLACES Tailwind's default palette
// instead of extending it, so `bg-slate-500` and `text-emerald-600` no longer
// compile to anything. A stray stock colour is now a visible bug rather than
// silent drift, and `npm run lint:design` catches it before it ships.
//
// Re-skinning the product = editing tokens.css. This file rarely changes.
// ─────────────────────────────────────────────────────────────────────────────

const SEMANTIC_COLORS = {
  // Backgrounds → bg-canvas, bg-surface, bg-surface-subtle, bg-surface-hover…
  canvas: 'var(--bg-canvas)',
  surface: {
    DEFAULT: 'var(--bg-surface)',
    subtle: 'var(--bg-surface-subtle)',
    hover: 'var(--bg-hover)',
    active: 'var(--bg-active)',
  },
  // Text → text-primary, text-secondary, text-tertiary, text-inverse
  primary: 'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  tertiary: 'var(--text-tertiary)',
  placeholder: 'var(--text-placeholder)',
  inverse: 'var(--text-inverse)',
  // Borders → plain `border` is the hairline (see borderColor.DEFAULT);
  // border-strong when the hairline reads too faint.
  subtle: 'var(--border-subtle)',
  strong: 'var(--border-strong)',
  // Accent → bg-accent, bg-accent-hover, bg-accent-subtle, text-accent-text
  accent: {
    DEFAULT: 'var(--accent)',
    hover: 'var(--accent-hover)',
    subtle: 'var(--accent-subtle)',
    text: 'var(--accent-text)',
  },
  // Status → text-success, bg-success-subtle, text-danger, bg-danger-subtle…
  success: { DEFAULT: 'var(--status-success-fg)', subtle: 'var(--status-success-bg)' },
  warning: { DEFAULT: 'var(--status-warning-fg)', subtle: 'var(--status-warning-bg)' },
  danger: { DEFAULT: 'var(--status-danger-fg)', subtle: 'var(--status-danger-bg)' },
  info: { DEFAULT: 'var(--status-info-fg)', subtle: 'var(--status-info-bg)' },
  // App shell → its own group so a dark sidebar is a token swap
  sidebar: {
    DEFAULT: 'var(--sidebar-bg)',
    fg: 'var(--sidebar-fg)',
    'fg-active': 'var(--sidebar-fg-active)',
    active: 'var(--sidebar-item-active)',
    border: 'var(--sidebar-border)',
  },
  ring: 'var(--focus-ring)',
  overlay: 'var(--overlay)',
}

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // theme.colors (not theme.extend.colors) — this replaces the stock palette.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      // Kept for ring offsets and the odd true-white/black need.
      white: '#FFFFFF',
      black: '#000000',
      ...SEMANTIC_COLORS,
    },
    extend: {
      // Plain `border` resolves to the hairline token.
      borderColor: { DEFAULT: 'var(--border-subtle)' },
      ringColor: { DEFAULT: 'var(--focus-ring)' },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      // The type scale — nothing outside this list. Stock sizes (text-xs,
      // text-sm, text-lg…) remain available only because Tailwind's default
      // fontSize set is extended, not replaced; lint:design rejects them.
      fontSize: {
        display: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.02em' }], // 30/36
        h1: ['1.5rem', { lineHeight: '2rem', fontWeight: '600', letterSpacing: '-0.02em' }],           // 24/32
        h2: ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600', letterSpacing: '-0.01em' }],     // 18/26
        h3: ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '600' }],                              // 15/22
        body: ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],                             // 14/22
        'body-md': ['0.875rem', { lineHeight: '1.375rem', fontWeight: '500' }],                        // 14/22 · 500
        small: ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '400' }],                            // 13/20
        label: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],                                 // 12/16
        micro: ['0.6875rem', { lineHeight: '0.875rem', fontWeight: '600', letterSpacing: '0.02em' }],  // 11/14
      },

      // ── Layout ──────────────────────────────────────────────────────────
      maxWidth: {
        content: 'var(--content-max)', // page content column
        cell: 'var(--cell-max)',       // truncating table cell
      },

      // ── Radius ──────────────────────────────────────────────────────────
      borderRadius: {
        sm: 'var(--radius-sm)',     // 6px
        md: 'var(--radius-md)',     // 8px
        lg: 'var(--radius-lg)',     // 10px
        xl: 'var(--radius-xl)',     // 12px
        '2xl': 'var(--radius-2xl)', // 16px
      },

      // ── Elevation ───────────────────────────────────────────────────────
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },

      // ── Motion ──────────────────────────────────────────────────────────
      transitionDuration: {
        fast: 'var(--duration-fast)', // 120ms — hovers
        base: 'var(--duration-base)', // 180ms — most transitions
        slow: 'var(--duration-slow)', // 260ms — sheets, larger movement
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
}
