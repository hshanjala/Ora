# Ora — Design Audit (Phase 0)

> Snapshot of every screen, overlay, repeated pattern, and style value in the app as of
> commit `4ccd891`. No code was changed in this phase. This file is the baseline the
> design-system rebuild (Phases 1–6) will be measured against.

---

## 0. Repo reality vs. the brief (read first)

| Brief assumption | Actual repo | Consequence |
|---|---|---|
| App lives in `ora/` subfolder | App root **is** the repo root (`app/`, `components/`, `package.json` at `/`) | All paths in the plan drop the `ora/` prefix: `app/styles/tokens.css`, `docs/…`, `components/ui/…` |
| TypeScript (`tailwind.config.ts`, TS components) | Codebase is **JavaScript** (`jsconfig.json`, all `.jsx`/`.js`, no `typescript` dep) | Either introduce TS incrementally (Next 14 supports mixed JS/TS) or build the component library in JSX with JSDoc + `cva`. **Decision needed.** |
| Areas: onboarding, reports/analytics, multi-user settings, calendar week view | None of these exist. Actual areas: auth, dashboard, schedule (day list only), patients, prescriptions, invoices, expenses, settings, admin, blocked | Phase 4 migration list shrinks to what exists; no IA changes will be invented |
| Radix primitives, `cva`, `clsx` merge helper | Only `clsx` is installed. No Radix, no `cva`, no `tailwind-merge` | Phase 2 needs new deps (asked for approval before Phase 2) |
| Branch `redesign/design-system` | Session is pinned to `claude/live-software-changes-9acvq6` | Work happens on the pinned branch unless you explicitly re-point the session |

Stack: Next.js 14.2.5 App Router · Tailwind 3.4.6 (JS config) · Supabase (`@supabase/ssr`) · `lucide-react` · `date-fns` · deployed on Vercel. Font: Inter via `next/font/google`. **No Bangla font is loaded** — Bengali text (patient names, ৳ amounts render fine, but Bangla script falls to system fallback).

---

## 1. Route & screen inventory

### Auth (`app/(auth)/`, no shared layout — each page paints its own full-screen gradient)
| Route | File | Notes |
|---|---|---|
| `/login` | `(auth)/login/page.jsx` (158 L) | Emerald gradient + blur blobs, white `rounded-3xl` card, Google OAuth button with inline SVG, password show/hide |
| `/register` | `(auth)/register/page.jsx` (151 L) | Same gradient shell duplicated; success screen variant with ✅ emoji |

### Dashboard shell (`app/(dashboard)/layout.jsx`)
Client-side auth check → fetches `clinic_settings` → renders `<Sidebar>` + `<main>`. Full-screen centered spinner while loading. Canvas `bg-[#fafafa]`.

| Route | File | Notes |
|---|---|---|
| `/` | `(dashboard)/page.jsx` (362 L) | Greeting header, SubscriptionBanner, 4 quick-action buttons, 4 StatCards, Today's Schedule table with inline status actions, Recent Activity feed. Owns a private `PaymentModal` + `StatCard` |
| `/schedule` | `schedule/page.jsx` (346 L) | Day navigator card, filter pill row, day table, plus a full **"All Appointments" list modal** (date-range + filters + grouped-by-date avatar list) built inline |
| `/patients` | `patients/page.jsx` (210 L) | Search + table with avatar, 3 icon row-actions; opens 5 different overlays |
| `/prescriptions` | `prescriptions/page.jsx` (535 L) | Table + **TemplateSetupModal** (3-template picker, 2-doctor fields, logo upload) + **PrescriptionDetailModal** (view, follow-up edit, print) both defined inline |
| `/invoices` | `invoices/page.jsx` (534 L) | Period pills, 3 tinted stat tiles, status pills, table + **InvoiceDetailModal** (line items, payment ledger, record-payment form, print) + a 90-line print-HTML template function, all inline |
| `/expenses` | `expenses/page.jsx` (196 L) | Month filter, 3 tinted stat tiles, category chip breakdown, table with tfoot total, delete via `confirm()` |
| `/settings` | `settings/page.jsx` (212 L) | 4 stacked cards: clinic info form, account email, change password, subscription/payment info (hard-coded bKash/Nagad) |

### Standalone
| Route | File | Notes |
|---|---|---|
| `/admin` | `admin/page.jsx` (399 L) | Own password login screen, stat tiles, clinic table with zebra rows, +30d / trial / suspend actions, own toast implementation |
| `/blocked` | `blocked/page.jsx` (135 L) | Suspended/expired card with payment instructions; Suspense-wrapped |

### API routes (out of scope — presentation-only project)
`app/api/admin/*` (clinics, extend, extend-trial, login, logout, suspend), `app/api/medicines`, `app/api/push/subscribe`. `middleware.js` handles session refresh + subscription gating → redirects to `/blocked`.

---

## 2. Overlay / state inventory

### Modals (10 total, 2 mechanisms)
Shared CSS classes `.modal-overlay` + `.modal-box` (7 users):
1. `AddPatientModal`
2. `AddExpenseModal`
3. `AddAppointmentModal` (patient combobox with create-on-the-fly)
4. `AddPrescriptionModal` (label dropdowns, medicine autocomplete rows, extra-field system)
5. `CreateInvoiceModal` (patient combobox, line items, discount flat/%, live totals)
6. `PaymentModal` — **duplicated twice**: once inside `(dashboard)/page.jsx`, once inside `SubscriptionBanner.jsx`, nearly identical
7. `InvoiceDetailModal`, `PrescriptionDetailModal`, `TemplateSetupModal`, `EditModal` (inside PatientPanel)

Hand-rolled overlays (no shared classes):
8. `QuickAddFlow` (957 L) — 4-step wizard (patient → appointment → prescription → invoice) with its own stepper header, footer, and success screen with print buttons
9. Schedule "All Appointments" list modal — bespoke `fixed inset-0` + `rounded-3xl` box
10. `PatientPanel` — right-side drawer, **entirely inline `style={{}}`** (71 style objects), own keyframe animation, ESC-to-close but no focus trap

**No modal has a focus trap, aria-modal, or scroll lock.** All close on backdrop click; only PatientPanel handles ESC.

### Dropdowns / popovers (5 hand-rolled implementations)
- `AddAppointmentModal` patient suggestion list (click-outside via refs)
- `CreateInvoiceModal` patient suggestion list (copy of the above)
- `AddPrescriptionModal`: `LabelDropdown` (click label → menu), `HoverDropdown` (opens on hover/focus), `MedicineInput` (fetch-backed autocomplete) — plus `AddFieldButton` menu
- `QuickAddFlow` re-declares `LabelDropdown`, `HoverDropdown`, `MedicineInput`, `AddFieldButton` — **full copies of the prescription modal's versions**

None are keyboard-navigable (no arrow keys, no roles).

### Toasts
- Admin page: bespoke fixed top-right dark toast, `setTimeout` 4s, emoji prefixes (✅/❌/⚠️)
- Rest of app: **no toast system at all** — feedback is inline button-label swaps ("Saved!") or nothing

### Confirmations
- Destructive deletes (expense, appointment, prescription) use **native `confirm()`** — 3 occurrences. No styled ConfirmDialog exists.

### Empty states (8, all similar but each hand-built)
Dashboard schedule, dashboard activity, patients, schedule day, schedule list-modal, prescriptions, invoices, expenses, admin table. Pattern: 40px muted icon + one line + optional `.btn-primary`. Sizes/paddings/copy vary randomly (`py-10`, `py-12`, `py-16`; icon 24/28/40).

### Loading states
- `.spinner` CSS div (7 uses) · `Loader2` with `animate-spin` (12 uses) · admin's `border-4` ring div (3 uses) — **three unrelated spinner systems, zero skeletons anywhere**

### Error states
- Auth/modals: red tinted inline box (`bg-red-50 text-red-700 rounded-xl px-4 py-3`) — 8 near-copies
- Pages: **no error state on any data fetch** — a failed Supabase query silently renders the empty state (misleading)

---

## 3. Repeated patterns & duplication counts

| Pattern | Implementations | Where |
|---|---|---|
| **Button** | **9** | `.btn-primary`/`.btn-secondary` classes; auth full-width `py-3 rounded-xl font-bold` (login ×2, register, blocked ×2, admin login); filter pill buttons (schedule ×2, invoices ×2 — 4 inline copies of the same conditional class string); admin table micro-buttons (`text-xs font-bold px-3 py-1.5`); copy buttons (`bg-slate-100 … px-3 py-2`, 5 copies); icon-only row-action buttons (`p-1.5 hover:bg-*-50 rounded-lg`, ~14 copies); PatientPanel inline-style buttons; QuickAddFlow footer buttons |
| **Modal shell** | **3** | `.modal-overlay/.modal-box`; schedule list modal; PatientPanel drawer (+ QuickAddFlow's own wrapper) |
| **Badge / status pill** | **6** | `.badge-*` classes; expenses `CATEGORY_COLORS` map; admin `getStatus()` color strings; PatientPanel inline-style pills; prescription frequency chips; print-HTML `.sbadge` |
| **`statusBadge()` function** | **3 copies** | dashboard, schedule, invoices — identical switch |
| **Stat card / tile** | **4** | dashboard `StatCard`; invoices tinted tiles; expenses tinted tiles; admin tinted tiles (all different paddings, radii, type sizes) |
| **Avatar** | **3** | patients list (photo/icon square), schedule `initials()`+`COLORS` hash, PatientPanel `Avatar` (inline styles) |
| **Search input with icon** | **5 copies** | patients, expenses, invoices, prescriptions, admin (admin re-implements `.input` inline) |
| **Patient combobox (type-ahead + create-new)** | **3** | AddAppointmentModal, CreateInvoiceModal, QuickAddFlow |
| **Prescription form internals** (LabelDropdown, HoverDropdown, MedicineInput, AddFieldButton, MedicineRow) | **2 full copies** | AddPrescriptionModal and QuickAddFlow (~250 duplicated lines) |
| **Invoice print HTML** | **2 near-identical templates** | `invoices/page.jsx` (with payment ledger) and `PatientPanel.jsx` (without) — ~90 lines each |
| **PaymentModal** | **2 copies** | dashboard page, SubscriptionBanner |
| **Payment-method card (bKash/Nagad)** | **4** | PaymentModal ×2, blocked, settings |
| **Empty state** | **9 copies** | see §2 |
| **Spinner** | **3 systems** | see §2 |
| **Table (`.table-th/.table-td/.table-tr`)** | 1 shared + **2 rogue** | admin builds its own header/zebra styling; invoice/prescription detail modals build mini-tables inline |
| **Error box** | **8 copies** | auth + every modal |

Dead code: `components/QuickActions.jsx` (unused **and syntactically broken** — the `<a` opening tag is missing at line 42; it would fail to compile if imported) and `components/NotificationButton.jsx` (unused; references sidebar classes). Candidates for deletion in Phase 4.

---

## 4. Style value frequency tables (actual usage)

### Raw hex colors in JSX/JS (top values; 33 distinct)
| Count | Value | Role today |
|---|---|---|
| 33 | `#e2e8f0` | slate-200 borders (PatientPanel, print) |
| 28 | `#94a3b8` | slate-400 tertiary text |
| 28 | `#1e293b` | slate-800 primary text |
| 26 | `#64748b` | slate-500 secondary text |
| 23 | `#065f46` | emerald-800 (print headers, money) |
| 12 | `#059669` | emerald-600 accent |
| 9 | `#f8fafc` | slate-50 subtle bg |
| 8 | `#d1fae5` / `#b91c1c` | emerald-100 tint / red-700 dues |
| 3 | `#fafafa` | body canvas (`bg-[#fafafa]` ×3) |
| 2 | `#1c1c1e` | sidebar background (inline style) |
| … | 20 more one-off values | mostly print templates & avatar hash colors |

(`#2547` ×21 is a false positive — it's the `&#2547;` HTML entity for ৳ in print templates.)

### Tailwind color families (class occurrences)
slate **444** · emerald **203** · red 85 · amber 58 · gray 41 · orange 25 · blue 14 · pink 8 · yellow 5 · teal 4 · green 3 · violet/purple/cyan 2 each — **slate and gray are used interchangeably**; 14 families in play where the target system needs ~6.

### Font sizes
`text-sm` **194** · `text-xs` **100** · `text-lg` 22 · `text-xl` 20 · `text-2xl` 16 · `text-3xl` 10 · `text-base` 3 · arbitrary `text-[14px]` 2, `text-[11px]` 2 · plus ~40 inline `fontSize:` values in PatientPanel (9–20px, including off-scale 9/10/11/12/13/15/17px)

### Font weights
semibold **106** · bold **95** · black **40** · medium 31 · normal 2 — bold/black dominate; the benchmark look wants medium/semibold with 600 max.

### Radii
`rounded-xl` (12px) **88** · `rounded-lg` (8px) 38 · `rounded-full` 30 · `rounded-2xl` (16px) 21 · `rounded-3xl` (24px) 7 · misc 10 — five radii tiers in active use; benchmark wants 8–12px with pills only for badges/avatars.

### Shadows
`shadow-lg` 10 · `shadow-xl` 5 · `shadow-2xl` 5 — used on modals AND static cards (auth card is `shadow-2xl`); benchmark wants hairline borders with near-invisible shadows.

### Spacing (top utilities)
`px-4` 60 · `gap-2` 54 · `py-3` 50 · `px-3` 42 · `p-4` 40 · `gap-3` 40 · `py-2` 32 · `p-6` 24 · `gap-1.5` 24 · `py-2.5` **23** · `mb-1` 23 … — half-step values (`py-2.5`, `gap-1.5`, `p-1.5`, `py-0.5`, `mt-0.5`) appear 100+ times; PatientPanel adds pixel values (7, 9, 14, 18, 22px) outside any scale.

### Arbitrary Tailwind values (post-Phase-1 these must be zero)
25 distinct: `min-h-[44px]` ×6, `min-h-[80px]` ×3, `bg-[#fafafa]` ×3, `text-[14px]`/`text-[11px]`, `w-[220px]` sidebar, assorted `min-w`/`max-h` table and modal constraints.

### Inline `style={{}}` objects
`PatientPanel.jsx` **71** · `Sidebar.jsx` 6 · others 2 — PatientPanel is effectively styled outside Tailwind entirely.

---

## 5. Screen dependency map (renders / fetches)

| Screen | Renders | Fetches (Supabase unless noted) |
|---|---|---|
| Dashboard `/` | SubscriptionBanner, QuickAddFlow, AddAppointmentModal, CreateInvoiceModal, AddExpenseModal, private PaymentModal + StatCard | `clinic_settings`, `appointments` (count + today's list + recent 2), `invoices` (paid month, unpaid month, recent 3), `expenses` (month); mutates `appointments.status` |
| Schedule | AddAppointmentModal, inline list modal | `appointments+patients` (by day; by range for modal); mutates status, deletes; updates `patients.is_active` |
| Patients | AddPatientModal, PatientPanel, AddPrescriptionModal, CreateInvoiceModal, AddAppointmentModal | `patients` (active) |
| PatientPanel (drawer) | VisitRow, EditModal, Avatar, own print template | `invoices+items`, `prescriptions+items` per patient; `visit_notes` upsert; storage `patient-images` list/upload |
| Prescriptions | TemplateSetupModal, PrescriptionDetailModal, AddPrescriptionModal | `prescriptions+patients+items`, `clinic_settings`; deletes; `prescription_items`; storage `patient-photos` (logo upload); `lib/buildPrescriptionPrint` |
| Invoices | CreateInvoiceModal, InvoiceDetailModal, inline print template | `invoices+patients`, `clinic_settings`, `invoice_items`, `invoice_payments` (insert + list); updates `invoices.paid_amount/status` |
| Expenses | AddExpenseModal | `expenses` (by month); deletes |
| Settings | — | `clinic_settings` read/update; `auth.updateUser` (password) |
| Admin | — | `fetch('/api/admin/*')` (login, clinics, extend, extend-trial, suspend, logout) |
| Blocked | PaymentInfo | `auth.getUser`, `signOut` |
| Auth pages | — | `auth.signInWithPassword`, `signInWithOAuth(google)`, `signUp` + `clinic_settings` insert |
| Modals (Add*) | comboboxes | `patients` list; inserts into own table; QuickAddFlow chains all four + photo upload + `clinic_settings` |

Shared CSS contract: `globals.css` `@layer components` (`sidebar-link`, `btn-*`, `card`, `input`, `label`, `badge-*`, `modal-*`, `table-*`, `spinner`) — this is the de-facto proto-design-system that Phase 2 replaces.

---

## 6. Prioritized ugliest / most inconsistent surfaces

1. **PatientPanel drawer** — 71 inline style objects, pixel values off every scale, `0.5px` borders, its own avatar/badge/button/print systems. The single largest source of drift; highest-value rewrite.
2. **QuickAddFlow** — 957 lines duplicating four modals' internals plus ~250 lines copied verbatim from AddPrescriptionModal; bespoke stepper and success screen.
3. **Auth screens** — gradient + blob + `rounded-3xl` + `shadow-2xl` + `font-black` aesthetic is a different product from the dashboard; benchmark violation on every rule (shadows, radii, weight).
4. **Admin panel** — re-implements input, table, badges, buttons, toast and spinner from scratch; zebra striping and colored micro-buttons found nowhere else.
5. **Invoices page** — 534 lines mixing a print template, a payment-ledger modal, filter pills, and three tinted stat tiles, each styled ad-hoc; heavy `font-black` money.
6. **Print templates** — three (2× invoice, 1× prescription with 3 sub-templates) hand-built `document.write` HTML strings with their own palettes; no A4/A5 page setup, no Bangla font, no page-break control.
7. **Schedule list modal** — a whole second appointment browser living inside a page file with bespoke overlay.
8. **Filter pill rows** — 4 inline copies of the same conditional class string across schedule/invoices.
9. **Empty/loading feedback layer** — 9 empty-state copies, 3 spinner systems, no skeletons, no toasts (except admin), no fetch error states anywhere.
10. **Sidebar** — dark `#1c1c1e` inline-styled panel vs. brief's pure-white 240px spec; mobile version is a top bar + left drawer rather than bottom tabs.

---

## 7. Accessibility snapshot (current)

- No focus trap / `role="dialog"` / `aria-modal` on any overlay; backdrop click is the only universal close
- Icon-only buttons rely on `title=` only; no `aria-label`s
- Custom dropdowns/comboboxes have no keyboard support, no `role="listbox"`
- Focus rings: inputs have emerald ring; most buttons rely on browser default or nothing
- Several text/bg pairs likely below AA: `text-gray-400`/`slate-400` on white for meaningful labels, `text-slate-300` icons, `text-emerald-300` in sidebar
- Native `confirm()` for destructive actions (accessible but jarring)

---

## 8. What Phase 1 must decide (open questions)

1. **TS or JS** for the new `components/ui/*` (brief says TS; repo is JS).
2. **New dependencies** to approve: `class-variance-authority`, `tailwind-merge`, Radix primitives (`@radix-ui/react-dialog`, `-dropdown-menu`, `-popover`, `-tooltip`, `-tabs`, `-select`), `geist` (or Inter fallback), `Anek Bangla` via `next/font/google`.
3. **Sidebar direction**: brief specifies pure-white sidebar; current is dark. Confirm the switch is wanted (it changes the product's first impression).
4. **Branch**: stay on `claude/live-software-changes-9acvq6` or re-point to `redesign/design-system`.
