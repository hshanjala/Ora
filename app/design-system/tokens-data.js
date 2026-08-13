// Token reference data for the styleguide. Values mirror app/styles/tokens.css
// — the swatches themselves render from the live CSS variables, so if this
// list and the stylesheet ever disagree, the swatch is the truth.

export const COLOR_GROUPS = [
  {
    title: 'Backgrounds',
    rule: 'The page is canvas. Anything sitting on it is surface. Hover and active are for interaction, never decoration.',
    tokens: [
      { name: '--bg-canvas', util: 'bg-canvas', value: '#F7F8F9', use: 'Page behind everything' },
      { name: '--bg-surface', util: 'bg-surface', value: '#FFFFFF', use: 'Cards, tables, modals, inputs' },
      { name: '--bg-surface-subtle', util: 'bg-surface-subtle', value: '#FCFCFD', use: 'Table headers, wells' },
      { name: '--bg-hover', util: 'bg-surface-hover', value: '#F1F2F4', use: 'Row and menu hover' },
      { name: '--bg-active', util: 'bg-surface-active', value: '#F1F2F4', use: 'Selected nav, pressed' },
    ],
  },
  {
    title: 'Text',
    rule: 'Hierarchy comes from weight and colour, not size. If information matters, it never gets tertiary.',
    tokens: [
      { name: '--text-primary', util: 'text-primary', value: '#14171C', use: 'Values, names, numbers' },
      { name: '--text-secondary', util: 'text-secondary', value: '#6D7480', use: 'Labels, descriptions, nav' },
      { name: '--text-tertiary', util: 'text-tertiary', value: '#A0A6B0', use: 'Placeholders, meta, disabled' },
      { name: '--text-inverse', util: 'text-inverse', value: '#FFFFFF', use: 'Text on accent fills' },
    ],
  },
  {
    title: 'Borders',
    rule: 'The hairline does the work shadows usually do. Reach for shadow only when something floats.',
    tokens: [
      { name: '--border-subtle', util: 'border', value: '#E7E9EC', use: 'Default: cards, rows, inputs' },
      { name: '--border-strong', util: 'border-strong', value: '#D5D8DD', use: 'Input hover, dashed zones' },
    ],
  },
  {
    title: 'Accent',
    rule: 'Ideally one primary action per view. Everything else is secondary or ghost.',
    tokens: [
      { name: '--accent', util: 'bg-accent', value: '#16874F', use: 'Primary buttons' },
      { name: '--accent-hover', util: 'bg-accent-hover', value: '#0F6A3E', use: 'Its hover' },
      { name: '--accent-subtle', util: 'bg-accent-subtle', value: '#EDF8F2', use: 'Selected tints, icon tiles' },
      { name: '--accent-text', util: 'text-accent-text', value: '#0F6A3E', use: 'Links, inline actions' },
    ],
  },
  {
    title: 'Status',
    rule: 'Foreground on its own subtle background, small size, medium weight. Status colour never paints large areas or body text.',
    tokens: [
      { name: '--status-success-*', util: 'text-success / bg-success-subtle', value: '#16874F on #EDF8F2', use: 'Paid, completed, active' },
      { name: '--status-warning-*', util: 'text-warning / bg-warning-subtle', value: '#B45309 on #FEF6E7', use: 'Partial, expiring, checked in' },
      { name: '--status-danger-*', util: 'text-danger / bg-danger-subtle', value: '#C62828 on #FDECEC', use: 'Unpaid, expired, destructive' },
      { name: '--status-info-*', util: 'text-info / bg-info-subtle', value: '#1D4ED8 on #EEF3FE', use: 'Scheduled, neutral info' },
    ],
  },
  {
    title: 'App shell',
    rule: 'The sidebar has its own group so a dark variant is a token swap — components never hardcode either look.',
    tokens: [
      { name: '--sidebar-bg', util: 'bg-sidebar', value: '#FFFFFF', use: 'Sidebar surface' },
      { name: '--sidebar-fg', util: 'text-sidebar-fg', value: '#6D7480', use: 'Nav item at rest' },
      { name: '--sidebar-fg-active', util: 'text-sidebar-fg-active', value: '#14171C', use: 'Active nav item' },
      { name: '--sidebar-item-active', util: 'bg-sidebar-active', value: '#F1F2F4', use: 'Active nav background' },
      { name: '--sidebar-border', util: 'border-sidebar-border', value: '#E7E9EC', use: 'Sidebar right border' },
    ],
  },
]

export const TYPE_SCALE = [
  { util: 'text-display', spec: '30 / 36 · 600 · −0.02em', use: 'Page hero numbers only' },
  { util: 'text-h1', spec: '24 / 32 · 600 · −0.02em', use: 'Page titles, one per page' },
  { util: 'text-h2', spec: '18 / 26 · 600 · −0.01em', use: 'Section and card titles' },
  { util: 'text-h3', spec: '15 / 22 · 600', use: 'Sub-sections' },
  { util: 'text-body', spec: '14 / 22 · 400', use: 'Default running text' },
  { util: 'text-body-md', spec: '14 / 22 · 500', use: 'Emphasised rows, nav, cell values' },
  { util: 'text-small', spec: '13 / 20 · 400', use: 'Table cells, secondary content' },
  { util: 'text-label', spec: '12 / 16 · 500', use: 'Form labels, table headers, meta' },
  { util: 'text-micro', spec: '11 / 14 · 600 · +0.02em', use: 'Badges, eyebrows, uppercase labels' },
]

export const SPACE_SCALE = [
  { util: '0.5', px: 2 }, { util: '1', px: 4 }, { util: '1.5', px: 6 },
  { util: '2', px: 8 }, { util: '3', px: 12 }, { util: '4', px: 16 },
  { util: '5', px: 20 }, { util: '6', px: 24 }, { util: '8', px: 32 },
  { util: '10', px: 40 }, { util: '12', px: 48 }, { util: '16', px: 64 },
]

export const RADIUS_SCALE = [
  { util: 'rounded-sm', px: 6, use: 'Checkboxes, small chips, kbd' },
  { util: 'rounded-md', px: 8, use: 'Buttons, inputs, menu and nav items' },
  { util: 'rounded-lg', px: 10, use: 'Cards, dropdown panels' },
  { util: 'rounded-xl', px: 12, use: 'Modals, large surfaces' },
  { util: 'rounded-2xl', px: 16, use: 'Rare — hero surfaces only' },
  { util: 'rounded-full', px: null, use: 'Badges and avatars only' },
]

export const SHADOW_SCALE = [
  { util: 'shadow-xs', use: 'Faintest lift — usually a border is enough' },
  { util: 'shadow-sm', use: 'Raised controls, sticky headers' },
  { util: 'shadow-md', use: 'Popovers, dropdowns' },
  { util: 'shadow-lg', use: 'Modals, drawers' },
]

export const MOTION_SCALE = [
  { util: 'duration-fast', ms: 120, use: 'Hover background shifts' },
  { util: 'duration-base', ms: 180, use: 'Most transitions, modal entrance' },
  { util: 'duration-slow', ms: 260, use: 'Sheets and drawers' },
]

// Bangla specimens — patient names and clinic copy must render in Anek Bangla
// everywhere, including print.
export const BANGLA_SAMPLES = [
  'আয়েশা রহমান',
  'কামাল হোসেন',
  'নুসরাত জাহান চৌধুরী',
  'ডেন্টাল ক্লিনিক · ঢাকা',
]
