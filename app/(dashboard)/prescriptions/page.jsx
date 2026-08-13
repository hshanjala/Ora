'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddPrescriptionModal from '@/components/modals/AddPrescriptionModal'
import TemplateSetupModal from '@/components/prescriptions/template-setup-modal'
import PrescriptionDetailModal from '@/components/prescriptions/prescription-detail-modal'
import { Plus, Pill, Trash2, Settings2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import {
  Button, IconButton, Tooltip, Card, PageHeader, SearchInput,
  DataTable, Badge, ConfirmDialog, useToast,
} from '@/components/ui'

export default function PrescriptionsPage() {
  const supabase = createClient()
  const toast = useToast()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [tplSettings, setTplSettings] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function loadPrescriptions() {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: qErr } = await supabase
        .from('prescriptions')
        .select('*, patients(name, age, gender), prescription_items(id)')
        .eq('clinic_id', user.id)
        .order('created_at', { ascending: false })
      if (qErr) throw qErr
      setPrescriptions(data || [])
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  async function loadTplSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('clinic_settings')
      .select('*').eq('clinic_id', user.id).single()
    if (data) setTplSettings(data)
  }

  useEffect(() => {
    loadPrescriptions()
    loadTplSettings()
  }, [])

  async function confirmDelete() {
    setDeleting(true)
    await supabase.from('prescriptions').delete().eq('id', pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
    loadPrescriptions()
    toast.success('Prescription deleted')
  }

  const filtered = prescriptions.filter(rx =>
    (rx.patients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (rx.diagnosis || '').toLowerCase().includes(search.toLowerCase()) ||
    (rx.chief_complaint || '').toLowerCase().includes(search.toLowerCase())
  )

  function rowActions(rx) {
    return (
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <Tooltip label="View & print">
          <IconButton aria-label="View and print prescription" size="sm" onClick={() => setSelected(rx)}>
            <Eye size={14} strokeWidth={1.75} />
          </IconButton>
        </Tooltip>
        <Tooltip label="Delete">
          <IconButton aria-label="Delete prescription" size="sm" onClick={() => setPendingDelete(rx)}>
            <Trash2 size={14} strokeWidth={1.75} />
          </IconButton>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-content p-4 md:p-6">
      <PageHeader
        title="Prescriptions"
        subtitle={`${prescriptions.length} prescription${prescriptions.length !== 1 ? 's' : ''} total`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowTemplate(true)}>
              <Settings2 size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">Template</span>
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} strokeWidth={1.75} />
              <span className="hidden sm:inline">New prescription</span>
            </Button>
          </>
        }
      />

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search by patient, complaint, or findings…"
        className="mb-4 max-w-md"
      />

      <Card>
        <DataTable
          columns={[
            {
              key: 'date', header: 'Date', tabular: true, sortable: true,
              cell: (rx) => format(new Date(rx.date), 'MMM d, yyyy'),
            },
            {
              key: 'patient', header: 'Patient', sortable: true,
              sortValue: (rx) => rx.patients?.name || '',
              cell: (rx) => <span className="text-body-md text-primary">{rx.patients?.name || '—'}</span>,
            },
            {
              key: 'chief_complaint', header: 'C/C', hideBelow: 'md',
              cell: (rx) => (
                <span className="block max-w-cell truncate text-secondary">
                  {rx.chief_complaint || '—'}
                </span>
              ),
            },
            {
              key: 'diagnosis', header: 'O/E', hideBelow: 'lg',
              cell: (rx) => (
                <span className="block max-w-cell truncate text-secondary">
                  {rx.diagnosis || '—'}
                </span>
              ),
            },
            {
              key: 'medicines', header: 'Medicines',
              cell: (rx) => (
                <Badge>
                  {rx.prescription_items?.length || 0} medicine{rx.prescription_items?.length !== 1 ? 's' : ''}
                </Badge>
              ),
            },
            { key: 'actions', header: '', align: 'right', cell: rowActions },
          ]}
          data={filtered}
          loading={loading}
          error={error}
          onRetry={() => { setLoading(true); loadPrescriptions() }}
          onRowClick={(rx) => setSelected(rx)}
          emptyState={{
            icon: Pill,
            title: search ? 'No prescriptions match your search' : 'No prescriptions yet',
            description: search
              ? 'Try a different patient name, complaint, or finding.'
              : 'Write your first prescription — the printed layout comes from your template settings.',
            action: !search && (
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus size={14} strokeWidth={1.75} /> New prescription
              </Button>
            ),
          }}
          renderCard={(rx) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body-md text-primary">{rx.patients?.name || '—'}</p>
                <p className="tabular mt-0.5 text-label text-tertiary">
                  {format(new Date(rx.date), 'MMM d, yyyy')}
                </p>
                {rx.chief_complaint && (
                  <p className="mt-0.5 truncate text-label text-secondary">{rx.chief_complaint}</p>
                )}
                <div className="mt-1.5">
                  <Badge>{rx.prescription_items?.length || 0} medicines</Badge>
                </div>
              </div>
              {rowActions(rx)}
            </div>
          )}
        />
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(v) => { if (!v) setPendingDelete(null) }}
        title="Delete this prescription?"
        description={
          pendingDelete
            ? `${pendingDelete.patients?.name || 'This prescription'} · ${format(new Date(pendingDelete.date), 'MMM d, yyyy')}. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <TemplateSetupModal
        open={showTemplate}
        onOpenChange={setShowTemplate}
        onSaved={(data) => setTplSettings(prev => ({ ...prev, ...data }))}
      />

      {showModal && (
        <AddPrescriptionModal onClose={() => setShowModal(false)} onSuccess={loadPrescriptions} />
      )}

      {selected && (
        <PrescriptionDetailModal
          key={selected.id}
          prescription={selected}
          tplSettings={tplSettings}
          open
          onOpenChange={(v) => { if (!v) setSelected(null) }}
        />
      )}
    </div>
  )
}
