'use client'
/**
 * Living styleguide — the mirror the product is designed against, and the
 * proof the system is complete. Auth-gated by middleware (any signed-in
 * clinic can reach it; it is not linked from the app navigation).
 *
 * Everything here renders from the same tokens and components the product
 * uses, so this page cannot drift from the app: if a token changes, these
 * specimens change with it.
 */
import { useState } from 'react'
import {
  Users, Calendar, FileText, TrendingUp, AlertCircle, Trash2, Plus, Printer,
  Pill, Search,
} from 'lucide-react'
import {
  Button, IconButton, Spinner, SpinnerBlock,
  Input, Textarea, DateInput, TimeInput, FormField, Label,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Combobox, Checkbox, RadioGroup, RadioItem, Switch, FileUpload,
  Badge, StatusPill, Avatar, AvatarGroup, IconTile,
  Tooltip, Divider, Kbd, Progress,
  Card, CardHeader, CardBody, CardFooter, StatCard,
  PageHeader, SectionHeader, Eyebrow,
  Modal, ModalTrigger, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetBody,
  ConfirmDialog,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  Popover, PopoverTrigger, PopoverContent,
  ToastProvider, useToast,
  Alert, EmptyState, ErrorState,
  Skeleton, SkeletonText, SkeletonCircle, SkeletonTable, SkeletonStat,
  DataTable, SearchInput, FilterBar,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Breadcrumb, Pagination, Timeline, TimelineItem,
} from '@/components/ui'
import { Section, Subsection, Specimen, Swatch } from './sections'
import {
  COLOR_GROUPS, TYPE_SCALE, SPACE_SCALE, RADIUS_SCALE,
  SHADOW_SCALE, MOTION_SCALE, BANGLA_SAMPLES,
} from './tokens-data'

const NAV = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'typography', label: 'Typography' },
  { id: 'space', label: 'Space & shape' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'forms', label: 'Forms' },
  { id: 'display', label: 'Data display' },
  { id: 'tables', label: 'Tables' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'feedback', label: 'Feedback' },
]

const SAMPLE_ROWS = [
  { id: 1, patient: 'Ayesha Rahman', bangla: 'আয়েশা রহমান', amount: 4500, status: 'paid', date: '2026-08-01' },
  { id: 2, patient: 'Kamal Hossain', bangla: 'কামাল হোসেন', amount: 12000, status: 'partial', date: '2026-08-05' },
  { id: 3, patient: 'Nusrat Jahan', bangla: 'নুসরাত জাহান', amount: 800, status: 'unpaid', date: '2026-08-11' },
]

const STATUS_MAP = { paid: 'success', partial: 'warning', unpaid: 'danger' }

function ToastDemo() {
  const toast = useToast()
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => toast.success('Invoice saved', 'INV-204512 · ৳4,500')}>
        Success
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.warning('Trial ends in 3 days')}>
        Warning
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.error('Could not save', 'Check your connection and retry.')}>
        Error
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.info('Reminder sent')}>
        Info
      </Button>
    </>
  )
}

export default function DesignSystemPage() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tab, setTab] = useState('overview')
  const [page, setPage] = useState(1)

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-canvas">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
          <PageHeader
            title="Ora design system"
            subtitle="Every token and component in every state. This page renders from the same tokens the product uses — it cannot drift."
            actions={<Badge variant="accent">v1</Badge>}
          />

          {/* Contents */}
          <nav aria-label="Sections" className="mb-10 flex flex-wrap gap-1.5">
            {NAV.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="inline-flex h-7 items-center rounded-md px-2.5 text-label text-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="space-y-14">
            {/* ── Foundations ─────────────────────────────────────────── */}
            <Section
              id="foundations"
              title="Colour"
              description="Feature code consumes semantic tokens only — never the raw scales. Re-skinning the product means editing app/styles/tokens.css; component files never change."
            >
              {COLOR_GROUPS.map(group => (
                <Subsection key={group.title} title={group.title} rule={group.rule}>
                  <Card className="divide-y px-4">
                    {group.tokens.map(t => (
                      <Swatch
                        key={t.name}
                        token={t.name}
                        util={t.util}
                        value={t.value}
                        use={t.use}
                      />
                    ))}
                  </Card>
                </Subsection>
              ))}

              <Subsection
                title="Status in context"
                rule="This is the only place colour is allowed to carry meaning."
              >
                <Specimen>
                  <StatusPill status="success">Paid</StatusPill>
                  <StatusPill status="warning">Partial</StatusPill>
                  <StatusPill status="danger">Unpaid</StatusPill>
                  <StatusPill status="info">Scheduled</StatusPill>
                  <StatusPill status="neutral">Archived</StatusPill>
                </Specimen>
              </Subsection>
            </Section>

            {/* ── Typography ──────────────────────────────────────────── */}
            <Section
              id="typography"
              title="Typography"
              description="Geist Sans for UI, Geist Mono with tabular figures for money, IDs, dates and times. Anek Bangla sits in the same stack, so Bangla never falls back to a system face — on screen or in print."
            >
              <Subsection title="Scale" rule="Nothing outside this list. Hierarchy comes from weight and colour, not size jumps.">
                <Card className="divide-y">
                  {TYPE_SCALE.map(t => (
                    <div key={t.util} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4">
                      <div className="w-40 shrink-0">
                        <p className="font-mono text-label text-primary">{t.util}</p>
                        <p className="text-label text-tertiary">{t.spec}</p>
                      </div>
                      <p className={`${t.util} min-w-0 flex-1 text-primary`}>
                        The quick brown fox
                      </p>
                      <p className="hidden w-48 shrink-0 text-label text-tertiary lg:block">{t.use}</p>
                    </div>
                  ))}
                </Card>
              </Subsection>

              <Subsection
                title="Bangla"
                rule="Patient names are frequently Bangla. Every specimen below must render in Anek Bangla, not a fallback."
              >
                <Card className="space-y-2 p-4">
                  {BANGLA_SAMPLES.map((sample, i) => (
                    <p key={i} className={i === 0 ? 'text-h2 text-primary' : 'text-body text-primary'}>
                      {sample}
                    </p>
                  ))}
                  <Divider className="my-3" />
                  <p className="text-body text-secondary">
                    Mixed: <span className="text-primary">আয়েশা রহমান</span> · Root Canal ·{' '}
                    <span className="tabular">৳4,500</span> · 11 Aug 2026
                  </p>
                </Card>
              </Subsection>

              <Subsection
                title="Tabular figures"
                rule="Every amount, ID, date and time uses .tabular so digits align in columns."
              >
                <Card className="p-4">
                  <div className="grid gap-1">
                    <p className="tabular text-body text-primary">৳1,24,500</p>
                    <p className="tabular text-body text-primary">৳12,800</p>
                    <p className="tabular text-body text-primary">৳4,500</p>
                    <p className="tabular text-body text-primary">৳350</p>
                  </div>
                  <p className="mt-3 text-label text-tertiary">
                    Proportional figures for comparison — note the ragged column:
                  </p>
                  <div className="mt-1 grid gap-1">
                    <p className="text-body text-tertiary">৳1,24,500</p>
                    <p className="text-body text-tertiary">৳12,800</p>
                    <p className="text-body text-tertiary">৳4,500</p>
                  </div>
                </Card>
              </Subsection>
            </Section>

            {/* ── Space & shape ───────────────────────────────────────── */}
            <Section
              id="space"
              title="Space, shape & motion"
              description="A 4pt scale, five radii, four elevations, three durations. Anything outside these is a bug."
            >
              <Subsection title="Space" rule="Inside a component 2–3. Between elements in a card 3–4. Card padding 4–6. Between page sections 5–6.">
                <Card className="space-y-1.5 p-4">
                  {SPACE_SCALE.map(s => (
                    <div key={s.util} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 font-mono text-label text-secondary">{s.util}</span>
                      <span className="tabular w-12 shrink-0 text-label text-tertiary">{s.px}px</span>
                      {/* design-lint-allow-inline-style: ramp width is the token value itself */}
                      <span className="h-3 rounded-sm bg-accent-subtle" style={{ width: s.px }} />
                    </div>
                  ))}
                </Card>
              </Subsection>

              <Subsection title="Radius" rule="Pills are for badges and avatars only. Nothing else is pill-shaped.">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {RADIUS_SCALE.map(r => (
                    <Card key={r.util} className="p-3 text-center">
                      <div className={`mx-auto mb-2 h-12 w-12 border bg-surface-hover ${r.util}`} />
                      <p className="font-mono text-label text-primary">{r.util}</p>
                      <p className="tabular text-label text-tertiary">{r.px ? `${r.px}px` : 'pill'}</p>
                      <p className="mt-1 text-micro text-tertiary">{r.use}</p>
                    </Card>
                  ))}
                </div>
              </Subsection>

              <Subsection title="Elevation" rule="If you're adding a shadow to make a box visible, use a border instead.">
                <div className="grid gap-3 sm:grid-cols-4">
                  {SHADOW_SCALE.map(s => (
                    <div key={s.util} className="text-center">
                      <div className={`mb-2 h-16 rounded-lg border bg-surface ${s.util}`} />
                      <p className="font-mono text-label text-primary">{s.util}</p>
                      <p className="text-micro text-tertiary">{s.use}</p>
                    </div>
                  ))}
                </div>
              </Subsection>

              <Subsection title="Motion" rule="Hover is a background shift, never a transform. All durations collapse to 0ms under prefers-reduced-motion.">
                <Card className="divide-y">
                  {MOTION_SCALE.map(m => (
                    <div key={m.util} className="flex items-center gap-4 p-3">
                      <span className="w-32 shrink-0 font-mono text-label text-primary">{m.util}</span>
                      <span className="tabular w-14 shrink-0 text-label text-secondary">{m.ms}ms</span>
                      <span className="text-label text-tertiary">{m.use}</span>
                    </div>
                  ))}
                </Card>
              </Subsection>
            </Section>

            {/* ── Buttons ─────────────────────────────────────────────── */}
            <Section
              id="buttons"
              title="Buttons"
              description="Every interactive element defines rest, hover, active, focus-visible, disabled and loading. Missing a state means the component is incomplete."
            >
              <Specimen label="Variants" note="Ideally one primary per view. Destructive actions are always danger and always confirmed.">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="link">Link</Button>
              </Specimen>

              <Specimen label="Sizes">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Specimen>

              <Specimen label="States" note="Focus ring is global and never removed — tab through these.">
                <Button>Rest</Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button variant="secondary" loading>Saving…</Button>
                <Button variant="danger" disabled>Disabled danger</Button>
              </Specimen>

              <Specimen label="With icons" note="16px inside buttons, stroke width 1.75.">
                <Button><Plus size={15} strokeWidth={1.75} /> Add patient</Button>
                <Button variant="secondary"><Printer size={15} strokeWidth={1.75} /> Print</Button>
                <Tooltip label="Delete">
                  <IconButton aria-label="Delete"><Trash2 size={16} strokeWidth={1.75} /></IconButton>
                </Tooltip>
                <Tooltip label="Search">
                  <IconButton aria-label="Search" variant="secondary"><Search size={16} strokeWidth={1.75} /></IconButton>
                </Tooltip>
              </Specimen>
            </Section>

            {/* ── Forms ───────────────────────────────────────────────── */}
            <Section
              id="forms"
              title="Forms"
              description="FormField is the one wrapper everyone uses. It wires id, aria-invalid and aria-describedby into any input inside it automatically."
            >
              <Card className="p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Patient name" required hint="As it appears on records">
                    <Input placeholder="আয়েশা রহমান" />
                  </FormField>
                  <FormField label="Phone" error="Enter a valid 11-digit number">
                    <Input defaultValue="01712" />
                  </FormField>
                  <FormField label="Procedure">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkup">General Checkup</SelectItem>
                        <SelectItem value="scaling">Cleaning &amp; Scaling</SelectItem>
                        <SelectItem value="rct">Root Canal</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Search patient" hint="Arrow keys, Enter to select">
                    <Combobox
                      items={SAMPLE_ROWS.map(r => ({ value: r.id, label: r.patient }))}
                      query={query}
                      onQueryChange={setQuery}
                      onSelect={(it) => setQuery(it.label)}
                      onCreate={(q) => setQuery(q)}
                      placeholder="Type a name…"
                    />
                  </FormField>
                  <FormField label="Date"><DateInput defaultValue="2026-08-13" /></FormField>
                  <FormField label="Time"><TimeInput defaultValue="09:30" /></FormField>
                  <FormField label="Disabled">
                    <Input disabled defaultValue="Read only" />
                  </FormField>
                  <FormField label="Notes" className="sm:col-span-2">
                    <Textarea placeholder="Treatment notes…" />
                  </FormField>
                  <FormField label="X-ray" className="sm:col-span-2">
                    <FileUpload accept="image/*" onFile={() => {}} label="Upload X-ray" hint="JPG or PNG" compact />
                  </FormField>
                </div>

                <Divider className="my-5" />

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-body text-primary">
                    <Checkbox defaultChecked /> Send SMS reminder
                  </label>
                  <label className="flex items-center gap-2 text-body text-tertiary">
                    <Checkbox disabled /> Disabled
                  </label>
                  <RadioGroup defaultValue="a5" className="flex gap-4">
                    <label className="flex items-center gap-2 text-body text-primary"><RadioItem value="a5" /> A5</label>
                    <label className="flex items-center gap-2 text-body text-primary"><RadioItem value="a4" /> A4</label>
                  </RadioGroup>
                  <label className="flex items-center gap-2 text-body text-primary">
                    <Switch defaultChecked /> Notifications
                  </label>
                </div>
              </Card>
            </Section>

            {/* ── Data display ────────────────────────────────────────── */}
            <Section
              id="display"
              title="Data display"
              description="Small tinted icon tiles and status pills are the only real colour moments in the product."
            >
              <Specimen label="Badges & pills">
                <Badge>12 medicines</Badge>
                <Badge variant="accent">New</Badge>
                <Badge variant="outline">Draft</Badge>
                <StatusPill status="success">Paid</StatusPill>
                <StatusPill status="warning">Partial</StatusPill>
                <StatusPill status="danger">Unpaid</StatusPill>
                <StatusPill status="info">Scheduled</StatusPill>
              </Specimen>

              <Specimen label="Avatars" note="Initials fallback; images degrade to initials if they fail to load.">
                <Avatar name="Ayesha Rahman" size="sm" />
                <Avatar name="Ayesha Rahman" />
                <Avatar name="Ayesha Rahman" size="lg" />
                <Avatar name="আয়েশা রহমান" />
                <AvatarGroup max={3} total={7}>
                  <Avatar name="A B" size="sm" />
                  <Avatar name="C D" size="sm" />
                  <Avatar name="E F" size="sm" />
                </AvatarGroup>
              </Specimen>

              <Specimen label="Icon tiles">
                <IconTile icon={Users} tone="accent" />
                <IconTile icon={Calendar} tone="info" />
                <IconTile icon={TrendingUp} tone="success" />
                <IconTile icon={AlertCircle} tone="danger" />
                <IconTile icon={FileText} tone="warning" />
                <IconTile icon={Pill} />
                <IconTile icon={Pill} size="sm" />
              </Specimen>

              <Specimen label="Misc">
                <Kbd>⌘K</Kbd>
                <Kbd>Esc</Kbd>
                <Spinner />
                <div className="w-40"><Progress value={64} /></div>
                <div className="w-40"><Progress value={92} tone="warning" /></div>
                <div className="w-40"><Progress value={100} tone="danger" /></div>
              </Specimen>

              <Subsection title="Stat cards">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard label="Bookings today" value="8" icon={Calendar} tone="accent" />
                  <StatCard label="Monthly income" value="৳1,24,500" icon={TrendingUp} tone="success" delta="+12%" deltaStatus="success" />
                  <StatCard label="Monthly expenses" value="৳38,200" icon={FileText} />
                  <StatCard label="Dues" value="৳12,800" icon={AlertCircle} tone="danger" hint="4 unpaid invoices" />
                </div>
              </Subsection>

              <Subsection title="Card anatomy">
                <Card>
                  <CardHeader
                    title="Today's schedule"
                    subtitle="Card header with an actions slot"
                    actions={<Button variant="ghost" size="sm">View all</Button>}
                  />
                  <CardBody>
                    <p className="text-body text-secondary">
                      Card body. The hairline border does the work a shadow usually would.
                    </p>
                  </CardBody>
                  <CardFooter>
                    <Button size="sm" variant="secondary">Secondary</Button>
                    <Button size="sm">Primary</Button>
                  </CardFooter>
                </Card>
              </Subsection>

              <Subsection title="Timeline">
                <Card className="p-5">
                  <Timeline>
                    <TimelineItem title="Root canal — visit 2" meta="11 Aug">
                      Prescription · Invoice ৳4,500
                    </TimelineItem>
                    <TimelineItem title="Root canal — visit 1" meta="04 Aug">
                      Prescription · Invoice ৳6,000
                    </TimelineItem>
                    <TimelineItem title="First consultation" meta="28 Jul" last>
                      X-ray uploaded
                    </TimelineItem>
                  </Timeline>
                </Card>
              </Subsection>
            </Section>

            {/* ── Tables ──────────────────────────────────────────────── */}
            <Section
              id="tables"
              title="Tables"
              description="Light header row, hairline row dividers, no vertical grid lines. Under md the table collapses to a stacked card list — resize this page to see it."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Search patients…"
                  className="sm:w-64"
                />
                <FilterBar
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'all', label: 'All', count: 3 },
                    { value: 'paid', label: 'Paid', count: 1 },
                    { value: 'unpaid', label: 'Unpaid', count: 1 },
                  ]}
                />
              </div>

              <Card>
                <DataTable
                  columns={[
                    {
                      key: 'patient', header: 'Patient', sortable: true,
                      cell: (r) => (
                        <span className="flex items-center gap-2.5">
                          <Avatar name={r.patient} size="sm" />
                          <span>
                            <span className="block text-body-md text-primary">{r.patient}</span>
                            <span className="block text-label text-tertiary">{r.bangla}</span>
                          </span>
                        </span>
                      ),
                    },
                    { key: 'date', header: 'Date', tabular: true, hideBelow: 'md', sortable: true },
                    {
                      key: 'amount', header: 'Amount', align: 'right', tabular: true, sortable: true,
                      cell: (r) => `৳${r.amount.toLocaleString()}`,
                    },
                    {
                      key: 'status', header: 'Status',
                      cell: (r) => <StatusPill status={STATUS_MAP[r.status]}>{r.status}</StatusPill>,
                    },
                    {
                      key: 'actions', header: '', align: 'right',
                      cell: () => (
                        <Tooltip label="Print">
                          <IconButton aria-label="Print" size="sm"><Printer size={14} strokeWidth={1.75} /></IconButton>
                        </Tooltip>
                      ),
                    },
                  ]}
                  data={SAMPLE_ROWS
                    .filter(r => filter === 'all' || r.status === filter)
                    .filter(r => r.patient.toLowerCase().includes(search.toLowerCase()))}
                  onRowClick={() => {}}
                  emptyState={{ icon: Users, title: 'No matches', description: 'Try a different filter.' }}
                  renderCard={(r) => (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={r.patient} size="sm" />
                        <span>
                          <span className="block text-body-md text-primary">{r.patient}</span>
                          <span className="tabular block text-label text-tertiary">৳{r.amount.toLocaleString()}</span>
                        </span>
                      </span>
                      <StatusPill status={STATUS_MAP[r.status]}>{r.status}</StatusPill>
                    </div>
                  )}
                />
                <Divider />
                <Pagination page={page} pageCount={3} onPageChange={setPage} />
              </Card>

              <Subsection title="Table states" rule="Every list has loading, empty and error. A screen isn't done until all three exist.">
                <div className="grid gap-3 lg:grid-cols-3">
                  <Card><SkeletonTable rows={3} cols={3} /></Card>
                  <Card>
                    <EmptyState
                      icon={Calendar}
                      title="No appointments today"
                      description="Book one and it will show up here."
                      action={<Button size="sm"><Plus size={14} strokeWidth={1.75} /> Add</Button>}
                      compact
                    />
                  </Card>
                  <Card>
                    <ErrorState action={<Button variant="secondary" size="sm">Try again</Button>} />
                  </Card>
                </div>
              </Subsection>
            </Section>

            {/* ── Overlays ────────────────────────────────────────────── */}
            <Section
              id="overlays"
              title="Overlays"
              description="All dialogs are Radix-backed: focus trap, scroll lock, ESC to close, correct roles. Sheets are side drawers on desktop and bottom sheets on mobile."
            >
              <Specimen label="Triggers" note="Open each and try Tab and Escape.">
                <Modal>
                  <ModalTrigger asChild><Button variant="secondary">Modal</Button></ModalTrigger>
                  <ModalContent>
                    <ModalHeader title="Add appointment" subtitle="Book a slot for a patient" />
                    <ModalBody>
                      <FormField label="Patient" required><Input placeholder="Type patient name…" /></FormField>
                    </ModalBody>
                    <ModalFooter>
                      <ModalClose asChild><Button variant="secondary">Cancel</Button></ModalClose>
                      <Button>Save</Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                <Sheet>
                  <SheetTrigger asChild><Button variant="secondary">Sheet / drawer</Button></SheetTrigger>
                  <SheetContent>
                    <SheetHeader title="Ayesha Rahman" subtitle="Female · 34 yrs · Patient since Mar 2025" />
                    <SheetBody>
                      <Timeline>
                        <TimelineItem title="Root canal — visit 2" meta="11 Aug">Invoice ৳4,500</TimelineItem>
                        <TimelineItem title="First consultation" meta="28 Jul" last>X-ray uploaded</TimelineItem>
                      </Timeline>
                    </SheetBody>
                  </SheetContent>
                </Sheet>

                <Button variant="danger" onClick={() => setConfirmOpen(true)}>Confirm dialog</Button>
                <ConfirmDialog
                  open={confirmOpen}
                  onOpenChange={setConfirmOpen}
                  title="Delete this expense?"
                  description="Rent · ৳25,000 · August office rent. This can't be undone."
                  onConfirm={() => setConfirmOpen(false)}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="secondary">Dropdown</Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Invoice</DropdownMenuLabel>
                    <DropdownMenuItem><Printer size={14} strokeWidth={1.75} /> Print</DropdownMenuItem>
                    <DropdownMenuItem><Plus size={14} strokeWidth={1.75} /> Record payment</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive><Trash2 size={14} strokeWidth={1.75} /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                  <PopoverTrigger asChild><Button variant="secondary">Popover</Button></PopoverTrigger>
                  <PopoverContent>
                    <p className="text-body-md text-primary">Quick note</p>
                    <p className="mt-1 text-small text-secondary">
                      Popovers sit on shadow-md with a hairline border.
                    </p>
                  </PopoverContent>
                </Popover>
              </Specimen>

              <Specimen label="Tooltips" note="Icon-only buttons always carry both a tooltip and an aria-label.">
                <Tooltip label="Print"><IconButton aria-label="Print"><Printer size={16} strokeWidth={1.75} /></IconButton></Tooltip>
                <Tooltip label="Delete" side="right"><IconButton aria-label="Delete"><Trash2 size={16} strokeWidth={1.75} /></IconButton></Tooltip>
              </Specimen>
            </Section>

            {/* ── Feedback ────────────────────────────────────────────── */}
            <Section
              id="feedback"
              title="Feedback"
              description="Toasts confirm actions. Alerts carry contextual state. Skeletons are shaped like the content they stand in for — never a grey blob."
            >
              <Specimen label="Toasts" note="Click to fire. They stack, auto-dismiss, and respect the safe area on mobile.">
                <ToastDemo />
              </Specimen>

              <Subsection title="Alerts">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Alert status="success" title="Payment recorded">৳4,500 received on 11 Aug.</Alert>
                  <Alert status="warning" title="Trial ends in 3 days">Renew for ৳350/month to keep access.</Alert>
                  <Alert status="danger" title="Payment failed">Check the amount and try again.</Alert>
                  <Alert status="info" title="Reminder scheduled">The patient will get an SMS at 9:00 AM.</Alert>
                </div>
              </Subsection>

              <Subsection title="Skeletons" rule="Match the shape of what's loading, so the layout doesn't jump.">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SkeletonStat />
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <SkeletonCircle />
                      <SkeletonText lines={2} className="flex-1" />
                    </div>
                  </Card>
                  <Card className="p-4"><Skeleton className="h-20 w-full" /></Card>
                </div>
              </Subsection>

              <Subsection title="Loading">
                <Card><SpinnerBlock /></Card>
              </Subsection>

              <Subsection title="Navigation">
                <div className="space-y-4">
                  <Breadcrumb items={[{ label: 'Ora', href: '/' }, { label: 'Patients', href: '/patients' }, { label: 'Ayesha Rahman' }]} />
                  <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="visits">Visits</TabsTrigger>
                      <TabsTrigger value="billing">Billing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                      <p className="text-body text-secondary">Tab panels get focus management from Radix.</p>
                    </TabsContent>
                    <TabsContent value="visits">
                      <p className="text-body text-secondary">Visit history would render here.</p>
                    </TabsContent>
                    <TabsContent value="billing">
                      <p className="text-body text-secondary">Billing summary would render here.</p>
                    </TabsContent>
                  </Tabs>
                  <SectionHeader title="Section header" subtitle="Used inside cards and page sections" actions={<Button size="sm" variant="ghost">Action</Button>} />
                  <Eyebrow>Eyebrow label</Eyebrow>
                </div>
              </Subsection>
            </Section>
          </div>

          <footer className="mt-16 border-t pt-6">
            <p className="text-small text-secondary">
              Tokens live in <code className="font-mono text-primary">app/styles/tokens.css</code>.
              Components live in <code className="font-mono text-primary">components/ui/</code>.
              Decision rules are in <code className="font-mono text-primary">docs/DESIGN_SYSTEM.md</code>.
            </p>
          </footer>
        </div>
      </div>
    </ToastProvider>
  )
}
