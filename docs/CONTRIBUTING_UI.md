# Contributing UI

How to build screens in Ora without drifting from the design system.

**Before you start:** open `/design-system` in the running app. Everything you need already exists there in every state — check before you build.

---

## The one rule

> If you are editing a component file to change a colour, size, radius, shadow or duration — stop. That value belongs in `app/styles/tokens.css`.

Two commands enforce this:

```bash
npm run lint:design     # no raw hex, no arbitrary values, no stock palette, no off-scale sizes
npm run check:contrast  # every text/background pair meets WCAG AA
npm run check:design    # both
```

Tailwind's stock palette is **removed**, not just discouraged — `bg-slate-500` compiles to nothing.

---

## Adding a screen

1. **Start from the page shell.** Every page is:

   ```jsx
   <div className="mx-auto max-w-content p-4 md:p-6">
     <PageHeader title="…" subtitle="…" actions={<Button>…</Button>} />
     …
   </div>
   ```

2. **Fetch with all four states.** A screen is not done until it has:

   | State | Component |
   |---|---|
   | Loading | a `Skeleton*` shaped like the page — never a lone spinner |
   | Empty | `EmptyState` with icon, title, one line of guidance, primary action |
   | Error | `ErrorState` with a retry `Button` |
   | Mobile | verified at 360px — tables need `renderCard` |

   Wrap the fetch in `try/catch` and feed `error` into `DataTable`; it renders the error state for you.

3. **Lists use `DataTable`.** Pass `renderCard` so it collapses to stacked cards under `md`. Mark money/date/ID columns `tabular: true`.

4. **Forms use `FormField`.** It wires `id`, `aria-invalid` and `aria-describedby` into the input automatically — never hand-roll a label.

   ```jsx
   <FormField label="Phone" required hint="Used for WhatsApp" error={err}>
     <Input value={v} onChange={…} />
   </FormField>
   ```

5. **Destructive actions use `ConfirmDialog`** and name what is being destroyed. Never `window.confirm`.

6. **Confirm success with a toast** (`useToast()`), not a button-label swap.

---

## New component, or compose?

**Compose** (the default) when the thing is a specific arrangement of existing pieces — a stat row, a filter bar with a search box, a card with a table inside. Build it in the screen file.

**Extract to a feature folder** (`components/patients/`, `components/invoices/`…) when the same arrangement appears on **two** screens, or when a screen file passes ~300 lines.

**Add to `components/ui/`** only when all of these hold:
- It is generic — no domain vocabulary (no "patient", "invoice", "clinic")
- Two or more unrelated features need it
- It has variants worth encoding with `cva`

Adding to `components/ui/` is a commitment: every state must be defined (rest, hover, active, focus-visible, disabled, loading), it must be keyboard accessible, it must `forwardRef`, it must accept `className` merged via `cn()`, and it must appear in `/design-system`.

**Reach for Radix** whenever the thing traps focus, floats, or has roles — dialogs, menus, popovers, tooltips, selects, tabs. Do not hand-roll them; that is how the pre-redesign app ended up with five inaccessible dropdowns.

---

## Conventions

| Thing | Convention |
|---|---|
| Files | kebab-case: `patient-panel.jsx`, `invoice-detail-modal.jsx` |
| Components | PascalCase, named the same as the file |
| Feature folders | plural domain noun: `patients/`, `invoices/`, `prescriptions/` |
| Barrel | `components/ui/index.js` — always import from `@/components/ui` |
| Icons | `lucide-react`, `strokeWidth={1.75}`, 16px in buttons, 14px in badges/rows |
| Money, dates, IDs | always `.tabular` |
| Class merging | `cn()` from `@/lib/cn` — never template-string concatenation |

---

## Accessibility floor

Non-negotiable, checked in review:

- **Icon-only buttons** carry `aria-label` *and* a `Tooltip`
- **Images** carry `alt` (decorative → `alt=""`)
- **Focus is never removed.** The global `:focus-visible` ring is in `globals.css`
- **Everything works from the keyboard** — if you built a custom picker, tab and arrow through it before opening a PR
- **Colour never carries meaning alone** — pair a status colour with a label
- **Touch targets ≥44px** on mobile

Run `npm run check:contrast` after any token change; it fails on any text/background pair below AA.

---

## Re-skin proof

`app/styles/theme-warm.css` is a complete alternative skin — terracotta accent, warm neutrals, tighter radii, snappier motion. To try it, add one line to `app/layout.jsx`:

```js
import './styles/tokens.css'
import './styles/theme-warm.css'   // ← the entire re-skin
import './globals.css'
```

**What that changes:** every surface, border, text level, accent, status colour, sidebar colour, radius and duration across all 11 screens, the styleguide, and both print documents.

**What it required:** one new CSS file and one import line. **Zero component files were touched** — verified by building with the theme applied and diffing `components/`. That is the property the whole project was for.

---

## Where things live

```
app/styles/tokens.css          the single source of truth for every value
app/styles/theme-warm.css      alternative skin (re-skin proof)
tailwind.config.js             maps utilities → tokens; stock palette removed
lib/cn.js                      class merging
components/ui/                 the component library
components/shell/              sidebar, topbar, mobile tabs, subscription strip
components/<feature>/          feature-specific composites
lib/printInvoice.js            the invoice print document
lib/buildPrescriptionPrint.js  the prescription print document
scripts/lint-design.mjs        token guardrail
scripts/check-contrast.mjs     WCAG AA audit
docs/DESIGN_SYSTEM.md          token reference + decision rules
/design-system                 the living styleguide
```
