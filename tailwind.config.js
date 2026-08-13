/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────────────────────
// Every design-system utility below maps to a CSS variable in
// app/styles/tokens.css. Feature code uses ONLY these semantic utilities
// (bg-surface, text-secondary, border-subtle, rounded-lg, shadow-sm, …).
//
// NOTE ON THE DEFAULT PALETTE: Tailwind's stock colors (slate-*, emerald-*, …)
// are still enabled because every un-migrated screen depends on them. They are
// removed in Phase 6 (guardrails) once screen migration is complete — killing
// them now would visually break the live app. New code must not use them;
// `npm run lint:design` (Phase 6) will enforce this mechanically.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Color: semantic tokens only ─────────────────────────────────────
      colors: {
        // Backgrounds → bg-canvas, bg-surface, bg-surface-subtle, bg-hover…
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
        inverse: 'var(--text-inverse)',
        // Borders → border-subtle, border-strong (plain `border` = subtle,
        // see borderColor.DEFAULT below)
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
        // Accent → bg-accent, text-accent-text, bg-accent-subtle…
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          text: 'var(--accent-text)',
        },
        // Status → text-success, bg-success-subtle, text-danger…
        success: { DEFAULT: 'var(--status-success-fg)', subtle: 'var(--status-success-bg)' },
        warning: { DEFAULT: 'var(--status-warning-fg)', subtle: 'var(--status-warning-bg)' },
        danger: { DEFAULT: 'var(--status-danger-fg)', subtle: 'var(--status-danger-bg)' },
        info: { DEFAULT: 'var(--status-info-fg)', subtle: 'var(--status-info-bg)' },
        // App shell → bg-sidebar, text-sidebar-fg, border-sidebar-border…
        sidebar: {
          DEFAULT: 'var(--sidebar-bg)',
          fg: 'var(--sidebar-fg)',
          'fg-active': 'var(--sidebar-fg-active)',
          active: 'var(--sidebar-item-active)',
          border: 'var(--sidebar-border)',
        },
        // Focus ring
        ring: 'var(--focus-ring)',
        // Modal/drawer backdrop
        overlay: 'var(--overlay)',
      },

      // Plain `border` class resolves to the hairline token.
      borderColor: {
        DEFAULT: 'var(--border-subtle)',
      },
      ringColor: {
        DEFAULT: 'var(--focus-ring)',
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      // The type scale. Nothing outside this list in migrated code.
      // (Default text-xs/sm/… remain available for un-migrated screens only.)
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

      // ── Radius (token-driven so a re-skin can tighten the whole app) ────
      borderRadius: {
        sm: 'var(--radius-sm)',   // 6px
        md: 'var(--radius-md)',   // 8px
        lg: 'var(--radius-lg)',   // 10px
        xl: 'var(--radius-xl)',   // 12px
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
