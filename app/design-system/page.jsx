'use client'
// Design-system smoke page (auth-gated by middleware). Phase 5 expands this
// into the full living styleguide; for now it exercises every component so
// the build verifies the library end-to-end.
import { useState } from 'react'
import {
  Users, Calendar, FileText, TrendingUp, AlertCircle, Trash2, Plus, Printer,
} from 'lucide-react'
import {
  Button, IconButton, Spinner, SpinnerBlock,
  Input, Textarea, DateInput, TimeInput, FormField, Label,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Combobox, Checkbox, RadioGroup, RadioItem, Switch,
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
  Breadcrumb, Pagination, Timeline, TimelineItem, FileUpload,
} from '@/components/ui'

const SAMPLE_ROWS = [
  { id: 1, patient: 'Ayesha Rahman', bangla: 'আয়েশা রহমান', amount: 4500, status: 'paid', date: '2026-08-01' },
  { id: 2, patient: 'Kamal Hossain', bangla: 'কামাল হোসেন', amount: 12000, status: 'partial', date: '2026-08-05' },
  { id: 3, patient: 'Nusrat Jahan', bangla: 'নুসরাত জাহান', amount: 800, status: 'unpaid', date: '2026-08-11' },
]

const STATUS_MAP = { paid: 'success', partial: 'warning', unpaid: 'danger' }

function ToastDemo() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => toast.success('Invoice saved', 'INV-204512 · ৳4,500')}>
        Success toast
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.error('Could not save', 'Check your connection and retry.')}>
        Error toast
      </Button>
    </div>
  )
}

export default function DesignSystemPage() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tab, setTab] = useState('components')
  const [page, setPage] = useState(1)

  return (
    <ToastProvider>
      <div className="mx-auto max-w-5xl p-6 space-y-10">
        <PageHeader
          title="Design system"
          subtitle="Every component in every state — the mirror the product is built against."
          actions={<Badge variant="accent">Phase 2 smoke</Badge>}
        />

        <Breadcrumb items={[{ label: 'Ora', href: '/' }, { label: 'Design system' }]} />

        {/* Buttons */}
        <section className="space-y-3">
          <SectionHeader title="Buttons" />
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
            <Button loading>Saving…</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm" variant="secondary">Small</Button>
            <Button size="lg">Large</Button>
            <Tooltip label="Delete">
              <IconButton aria-label="Delete"><Trash2 size={16} strokeWidth={1.75} /></IconButton>
            </Tooltip>
          </div>
        </section>

        {/* Forms */}
        <section className="space-y-3">
          <SectionHeader title="Forms" />
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Patient name" required hint="As it appears on records">
                <Input placeholder="আয়েশা রহমান (Bangla renders in Anek Bangla)" />
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
              <FormField label="Search patient (combobox)">
                <Combobox
                  items={SAMPLE_ROWS.map((r) => ({ value: r.id, label: r.patient }))}
                  query={query}
                  onQueryChange={setQuery}
                  onSelect={(it) => setQuery(it.label)}
                  onCreate={(q) => setQuery(q)}
                  placeholder="Type a name…"
                />
              </FormField>
              <FormField label="Date"><DateInput defaultValue="2026-08-13" /></FormField>
              <FormField label="Time"><TimeInput defaultValue="09:30" /></FormField>
              <FormField label="Notes" className="sm:col-span-2">
                <Textarea placeholder="Treatment notes…" />
              </FormField>
              <FormField label="X-ray" className="sm:col-span-2">
                <FileUpload accept="image/*" onFile={() => {}} label="Upload X-ray" hint="JPG or PNG" compact />
              </FormField>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-body text-primary">
                <Checkbox defaultChecked /> Send SMS reminder
              </label>
              <RadioGroup defaultValue="a" className="flex gap-4">
                <label className="flex items-center gap-2 text-body text-primary"><RadioItem value="a" /> A5</label>
                <label className="flex items-center gap-2 text-body text-primary"><RadioItem value="b" /> A4</label>
              </RadioGroup>
              <label className="flex items-center gap-2 text-body text-primary">
                <Switch defaultChecked /> Notifications
              </label>
            </div>
          </Card>
        </section>

        {/* Badges, avatars, tiles */}
        <section className="space-y-3">
          <SectionHeader title="Badges · Avatars · Icon tiles" />
          <div className="flex flex-wrap items-center gap-3">
            <Badge>12 medicines</Badge>
            <Badge variant="accent">New</Badge>
            <Badge variant="outline">Draft</Badge>
            <StatusPill status="success">Paid</StatusPill>
            <StatusPill status="warning">Partial</StatusPill>
            <StatusPill status="danger">Unpaid</StatusPill>
            <StatusPill status="info">Scheduled</StatusPill>
            <StatusPill status="neutral">Archived</StatusPill>
            <Avatar name="Ayesha Rahman" />
            <Avatar name="আয়েশা রহমান" size="sm" />
            <AvatarGroup max={3} total={7}>
              <Avatar name="A B" size="sm" />
              <Avatar name="C D" size="sm" />
              <Avatar name="E F" size="sm" />
            </AvatarGroup>
            <IconTile icon={Users} tone="accent" />
            <IconTile icon={Calendar} tone="info" />
            <IconTile icon={AlertCircle} tone="danger" size="sm" />
            <Kbd>⌘K</Kbd>
            <Spinner />
          </div>
          <div className="max-w-xs space-y-2">
            <Progress value={64} />
            <Progress value={92} tone="warning" />
          </div>
        </section>

        {/* Stat cards */}
        <section className="space-y-3">
          <SectionHeader title="Stat cards" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Bookings today" value="8" icon={Calendar} tone="accent" />
            <StatCard label="Monthly income" value="৳1,24,500" icon={TrendingUp} tone="success" delta="+12%" deltaStatus="success" />
            <StatCard label="Monthly expenses" value="৳38,200" icon={FileText} />
            <StatCard label="Dues" value="৳12,800" icon={AlertCircle} tone="danger" hint="4 unpaid invoices" />
          </div>
        </section>

        {/* Table */}
        <section className="space-y-3">
          <SectionHeader title="Data table" />
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
                { key: 'patient', header: 'Patient', sortable: true, cell: (r) => (
                  <span className="flex items-center gap-2.5">
                    <Avatar name={r.patient} size="sm" />
                    <span>
                      <span className="block text-body-md text-primary">{r.patient}</span>
                      <span className="block text-label text-tertiary">{r.bangla}</span>
                    </span>
                  </span>
                ) },
                { key: 'date', header: 'Date', tabular: true, hideBelow: 'md', sortable: true },
                { key: 'amount', header: 'Amount', align: 'right', tabular: true, sortable: true, cell: (r) => `৳${r.amount.toLocaleString()}` },
                { key: 'status', header: 'Status', cell: (r) => <StatusPill status={STATUS_MAP[r.status]}>{r.status}</StatusPill> },
                { key: 'actions', header: '', align: 'right', cell: () => (
                  <IconButton aria-label="Print" size="sm"><Printer size={14} strokeWidth={1.75} /></IconButton>
                ) },
              ]}
              data={SAMPLE_ROWS.filter((r) => filter === 'all' || r.status === filter)
                .filter((r) => r.patient.toLowerCase().includes(search.toLowerCase()))}
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
        </section>

        {/* Overlays */}
        <section className="space-y-3">
          <SectionHeader title="Overlays" />
          <div className="flex flex-wrap gap-2">
            <Modal>
              <ModalTrigger asChild><Button variant="secondary">Open modal</Button></ModalTrigger>
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
              <SheetTrigger asChild><Button variant="secondary">Open drawer</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader title="Ayesha Rahman" subtitle="Female · 34 yrs · Patient since Mar 2025" />
                <SheetBody>
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
                </SheetBody>
              </SheetContent>
            </Sheet>

            <Button variant="danger" onClick={() => setConfirmOpen(true)}>Delete something</Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Delete this expense?"
              description="This can't be undone."
              onConfirm={() => setConfirmOpen(false)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="secondary">Menu</Button></DropdownMenuTrigger>
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
                <p className="mt-1 text-small text-secondary">Popovers sit on shadow-md with a hairline border.</p>
              </PopoverContent>
            </Popover>
          </div>
          <ToastDemo />
        </section>

        {/* Feedback */}
        <section className="space-y-3">
          <SectionHeader title="Feedback states" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Alert status="warning" title="Trial ends in 3 days">Renew for ৳299/month to keep access.</Alert>
            <Alert status="danger" title="Payment failed">Check the amount and try again.</Alert>
            <Card><EmptyState icon={Calendar} title="No appointments today" description="Book the first one to fill the schedule." action={<Button size="sm"><Plus size={14} strokeWidth={1.75} /> Add appointment</Button>} compact /></Card>
            <Card><ErrorState action={<Button variant="secondary" size="sm">Try again</Button>} /></Card>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SkeletonStat />
            <Card className="p-4"><div className="flex items-center gap-3"><SkeletonCircle /><SkeletonText lines={2} className="flex-1" /></div></Card>
            <Card className="p-4"><Skeleton className="h-20 w-full" /></Card>
          </div>
          <Card><SkeletonTable rows={2} cols={4} /></Card>
          <SpinnerBlock />
        </section>

        {/* Tabs + type scale */}
        <section className="space-y-3">
          <SectionHeader title="Tabs · Type scale" />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
            </TabsList>
            <TabsContent value="components">
              <p className="text-body text-secondary">Everything on this page is built from tokens — re-skinning is a token-file edit.</p>
            </TabsContent>
            <TabsContent value="type">
              <div className="space-y-2">
                <p className="text-display text-primary tabular">৳1,24,500</p>
                <p className="text-h1 text-primary">Page title — H1</p>
                <p className="text-h2 text-primary">Section title — H2</p>
                <p className="text-h3 text-primary">Sub-section — H3</p>
                <p className="text-body text-primary">Body — আয়েশা রহমান visits on Thursday. Bangla and English share one stack.</p>
                <p className="text-small text-secondary">Small — table cells, secondary copy</p>
                <p className="text-label text-secondary">Label — form labels, table headers</p>
                <Eyebrow>Micro eyebrow label</Eyebrow>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </ToastProvider>
  )
}
