# Ora Design System — Tokens (Phase 1)

Source of truth: **`app/styles/tokens.css`** (all values) + **`tailwind.config.js`** (utility mapping).
Re-skinning Ora = editing `tokens.css`. If you're editing a component file to change a color, radius, shadow, or duration — stop, you're doing it wrong.

Feature code consumes **semantic utilities only**. The raw scales (`--gray-*`, `--green-*`) exist so semantic tokens have something to point at; never reference them in JSX.

---

## 1. Color

### Decision rule
> Is it a background? → `bg-canvas / bg-surface / bg-surface-subtle / bg-hover / bg-active`.
> Is it text? → `text-primary / text-secondary / text-tertiary / text-inverse`.
> Is it a line? → `border` (hairline) or `border-strong`.
> Is it the one action on screen? → `accent`.
> Is it a state (paid/unpaid/expiring/info)? → `success / warning / danger / info` — **only in badges, alerts, and chart marks**.
> Anything else has no color.

### Backgrounds
| Utility | Token | Use when |
|---|---|---|
| `bg-canvas` | `--bg-canvas` | The page behind everything. One per screen, applied by the shell — never inside a component. |
| `bg-surface` | `--bg-surface` | Cards, tables, modals, inputs — anything that "sits on" the canvas. Pure white on soft gray; never white-on-white. |
| `bg-surface-subtle` | `--bg-surface-subtle` | Table header rows, wells inside a card. One step below surface, still lighter than canvas. |
| `bg-hover` | `--bg-hover` | Hover state of rows, menu items, ghost buttons. A 120ms background shift — never a transform. |
| `bg-active` | `--bg-active` | Selected/active nav item, pressed state. |

### Text
The three greys are set by **measured contrast, not by eye**. Each clears WCAG AA (4.5:1) against the worst background it can land on (`surface-hover`), while staying visually distinct from its neighbours. `npm run check:contrast` fails the build if that stops being true.

| Utility | Value | Worst-case ratio | Use when |
|---|---|---|---|
| `text-primary` | `#14171C` | 16.04:1 | Values, names, numbers — the content someone came to read. |
| `text-secondary` | `#464D58` | 7.61:1 | Labels, descriptions, table headers, nav items at rest. |
| `text-tertiary` | `#666D78` | 4.66:1 | Timestamps, meta, secondary counts. Still real content — it passes AA. |
| `text-placeholder` | `#8A909B` | 3.21:1 | **Placeholder and disabled text only.** WCAG exempts incidental and disabled text; a compliant grey here would be indistinguishable from real content. Never use it for anything a user must read. |
| `text-inverse` | `#FFFFFF` | — | Text on accent/danger fills. |

### Borders
| Utility | Use when |
|---|---|
| `border` (bare) | Default everywhere: card outlines, dividers, table row separators, input borders at rest. The hairline does the work shadows usually do. |
| `border-strong` | Inputs on hover, dashed upload zones, anywhere the hairline reads as too faint next to an interaction. |

### Accent
| Utility | Use when |
|---|---|
| `bg-accent` + `text-inverse` | Primary button — ideally one per view. |
| `bg-accent-hover` | Its hover. |
| `bg-accent-subtle` + `text-accent-text` | Selected-item tints, quiet accent chips, icon-tile backgrounds. |
| `text-accent-text` | Links, "View all →" actions. |

### Status — `success` / `warning` / `danger` / `info`
Each has `text-{status}` (fg) and `bg-{status}-subtle` (tint). Rule: **fg on its own subtle bg, at small size + medium/semibold weight**. Status color never paints large areas, page sections, or plain body text. `danger` is also the destructive-action variant.

All four pairs clear AA on their own tint (4.67–6.03:1). Note `--status-success-fg` uses `--green-650`, a shade darker than the accent green: the accent at `--green-600` measured 4.19:1 on `--green-50`, which failed.

**Colour never carries meaning alone** — always pair a status tint with a text label.

### Sidebar
`bg-sidebar`, `text-sidebar-fg`, `text-sidebar-fg-active`, `bg-sidebar-active`, `border-sidebar-border`. The sidebar has its own token group so a dark sidebar variant is a **token swap** — components never hardcode either look.

### Focus
`--focus-ring` — 2px ring at 2px offset via global `:focus-visible` rule in `globals.css`. Always visible, never removed.

---

## 2. Typography

- **UI + body:** Geist Sans (`font-sans`, via `geist` package)
- **Bangla:** Anek Bangla is baked into the `--font-sans` stack as fallback — Bangla script never hits a system font. Nothing to opt into.
- **Numerals / money / IDs / dates:** Geist Mono with tabular figures — use the `.tabular` utility (or `font-mono` + component-applied `tabular-nums` in Phase 2 components). Every ৳ amount, invoice number, and time in a column uses it so digits align.

### Type scale — nothing outside this list in migrated code
| Utility | Size/Line | Weight | Tracking | Use for |
|---|---|---|---|---|
| `text-display` | 30/36 | 600 | −0.02em | Page hero numbers only |
| `text-h1` | 24/32 | 600 | −0.02em | Page titles (one per page) |
| `text-h2` | 18/26 | 600 | −0.01em | Section/card titles |
| `text-h3` | 15/22 | 600 | 0 | Sub-sections |
| `text-body` | 14/22 | 400 | 0 | Default running text |
| `text-body-md` | 14/22 | 500 | 0 | Emphasized rows, nav items, primary cell values |
| `text-small` | 13/20 | 400 | 0 | Table cells, secondary content |
| `text-label` | 12/16 | 500 | 0 | Form labels, table headers, meta |
| `text-micro` | 11/14 | 600 | +0.02em | Badges, eyebrows, uppercase section labels |

Decision rule: hierarchy comes from **weight and color** (`text-body-md text-primary` vs `text-label text-secondary`), not from jumping sizes. If you're reaching for `font-black`, the answer is no.

---

## 3. Space, radius, elevation, motion

### Space
4pt scale, already Tailwind-native: `0.5 1 1.5 2 3 4 5 6 8 10 12 16` (= 2/4/6/8/12/16/20/24/32/40/48/64px). No half-steps beyond `1.5` in migrated code, no pixel values, no arbitrary `p-[…]`.
Decision rule: inside a component 2–3 (8–12px); between elements in a card 3–4; card padding 4–6; between page sections 5–6 (20–24px).

### Radius
| Utility | Value | Use |
|---|---|---|
| `rounded-sm` | 6px | Checkboxes, small chips, kbd |
| `rounded-md` | 8px | Buttons, inputs, menu items, nav items |
| `rounded-lg` | 10px | Cards, dropdown panels |
| `rounded-xl` | 12px | Modals, large surfaces |
| `rounded-2xl` | 16px | Rare — hero surfaces only |
| `rounded-full` | pill | **Badges and avatars only.** Nothing else is pill-shaped. |

### Elevation
| Utility | Use |
|---|---|
| `shadow-xs` | Cards that need the faintest lift (usually the hairline border alone is enough — default to no shadow) |
| `shadow-sm` | Raised controls, sticky headers |
| `shadow-md` | Popovers, dropdowns |
| `shadow-lg` | Modals, drawers |

Decision rule: if you're adding a shadow to make a box visible, use a border instead.

### Motion
`duration-fast` (120ms) hover shifts · `duration-base` (180ms) most transitions · `duration-slow` (260ms) sheets/drawers · `ease-out` for everything. All durations collapse to 0ms under `prefers-reduced-motion` (handled in `tokens.css` — nothing to do per component).

---

## 4. Dark theme

`[data-theme="dark"]` in `tokens.css` carries a complete provisional palette. It ships later; components stay ignorant of it because they only ever read semantic tokens.

---

## 5. Guardrails

Migration is complete and the system is locked down:

- **Tailwind's stock palette is removed**, not merely discouraged. `theme.colors` replaces the default palette, so `bg-slate-500` compiles to nothing.
- **The legacy `@layer components` proto-system is deleted** (`.btn-primary`, `.card`, `.input`, `.badge-*`, `.modal-*`, `.table-*`, `.spinner`) — `components/ui/` replaces all of it.
- `npm run lint:design` fails on raw hex, `rgb()`, arbitrary Tailwind values, stock-palette classes, off-scale font sizes, and unmarked inline styles.
- `npm run check:contrast` fails on any text/background pair below AA.
- `npm run check:design` runs both. Wire it into CI to keep the system honest.

**Documented exceptions**, both encoded in the linter:
1. `app/styles/*.css` — token sources; raw values live there by definition.
2. Google's logo colours in the login page — brand assets must not be re-tinted.
3. Inline styles marked `design-lint-allow-inline-style` — genuinely runtime values (a progress bar's width, the styleguide's own swatches).

## 6. Re-skinning

`app/styles/theme-warm.css` proves the system re-skins from tokens alone: importing it after `tokens.css` changes accent hue, every neutral, every radius and every duration across the whole product — **without touching a single component file**. See `docs/CONTRIBUTING_UI.md § Re-skin proof`.
