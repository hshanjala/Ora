'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddPatientModal from '@/components/modals/AddPatientModal'
import PatientPanel from '@/components/patients/patient-panel'
import AddPrescriptionModal from '@/components/modals/AddPrescriptionModal'
import CreateInvoiceModal from '@/components/modals/CreateInvoiceModal'
import AddAppointmentModal from '@/components/modals/AddAppointmentModal'
import { Plus, Users, Pill, FileText, CalendarPlus } from 'lucide-react'
import { format } from 'date-fns'
import {
  Button, IconButton, Tooltip, Card, PageHeader, SearchInput,
  DataTable, Avatar, EmptyState,
} from '@/components/ui'

export default function PatientsPage() {
  const supabase = createClient()
  const [patients, setPatients] = useState([])
  const [clinicName, setClinicName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [rxPatient, setRxPatient] = useState(null)
  const [invoicePatient, setInvoicePatient] = useState(null)
  const [schedulePatient, setSchedulePatient] = useState(null)

  async function loadPatients() {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: qErr } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', user.id)
        .neq('is_active', false)        // ← only show active patients
        .order('created_at', { ascending: false })
      if (qErr) throw qErr
      setPatients(data || [])

      const { data: sett } = await supabase
        .from('clinic_settings').select('clinic_name').eq('clinic_id', user.id).single()
      setClinicName(sett?.clinic_name || '')
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  useEffect(() => { loadPatients() }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  )

  function rowActions(patient) {
    return (
      <div
        className="flex items-center justify-end gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip label="New appointment">
          <IconButton aria-label="New appointment" size="sm" onClick={() => setSchedulePatient(patient)}>
            <CalendarPlus size={14} strokeWidth={1.75} />
          </IconButton>
        </Tooltip>
        <Tooltip label="New prescription">
          <IconButton aria-label="New prescription" size="sm" onClick={() => setRxPatient(patient)}>
            <Pill size={14} strokeWidth={1.75} />
          </IconButton>
        </Tooltip>
        <Tooltip label="New invoice">
          <IconButton aria-label="New invoice" size="sm" onClick={() => setInvoicePatient(patient)}>
            <FileText size={14} strokeWidth={1.75} />
          </IconButton>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-content p-4 md:p-6">
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} patient${patients.length !== 1 ? 's' : ''} registered`}
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={15} strokeWidth={1.75} /> Add patient
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search by name, phone, or email…"
        className="mb-4 max-w-md"
      />

      <Card>
        <DataTable
          columns={[
            {
              key: 'name', header: 'Patient', sortable: true,
              cell: (p) => (
                <span className="flex items-center gap-2.5">
                  <Avatar name={p.name} src={p.photo_url} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-body-md text-primary">{p.name}</span>
                    <span className="block text-label text-tertiary sm:hidden">
                      {[p.gender, p.age ? `${p.age} yrs` : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </span>
              ),
            },
            {
              key: 'phone', header: 'Phone', tabular: true,
              cell: (p) => p.phone || <span className="text-tertiary">—</span>,
            },
            {
              key: 'email', header: 'Email', hideBelow: 'md',
              cell: (p) => p.email
                ? <span className="block max-w-cell truncate text-secondary">{p.email}</span>
                : <span className="text-tertiary">—</span>,
            },
            {
              key: 'gender', header: 'Gender', hideBelow: 'sm',
              cell: (p) => <span className="text-secondary">{p.gender || '—'}</span>,
            },
            {
              key: 'age', header: 'Age', hideBelow: 'sm', align: 'right', tabular: true,
              cell: (p) => p.age ? `${p.age}` : '—',
            },
            {
              key: 'created_at', header: 'Joined', hideBelow: 'lg', tabular: true, sortable: true,
              cell: (p) => format(new Date(p.created_at), 'MMM d, yyyy'),
            },
            { key: 'actions', header: '', align: 'right', cell: rowActions },
          ]}
          data={filtered}
          loading={loading}
          error={error}
          onRetry={() => { setLoading(true); loadPatients() }}
          onRowClick={(p) => setSelectedPatient(p)}
          emptyState={{
            icon: Users,
            title: search ? 'No patients match your search' : 'No patients yet',
            description: search
              ? 'Try a different name, phone number, or email.'
              : 'Add your first patient to start booking appointments and invoices.',
            action: !search && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus size={14} strokeWidth={1.75} /> Add first patient
              </Button>
            ),
          }}
          renderCard={(p) => (
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={p.name} src={p.photo_url} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-body-md text-primary">{p.name}</span>
                  <span className="tabular block text-label text-tertiary">
                    {p.phone || 'No phone'}
                  </span>
                </span>
              </span>
              {rowActions(p)}
            </div>
          )}
        />
      </Card>

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadPatients}
        />
      )}
      {selectedPatient && (
        <PatientPanel
          key={selectedPatient.id}
          patient={selectedPatient}
          clinicName={clinicName}
          open
          onOpenChange={(v) => { if (!v) setSelectedPatient(null) }}
        />
      )}
      {rxPatient && (
        <AddPrescriptionModal
          patientId={rxPatient.id}
          patientName={rxPatient.name}
          onClose={() => setRxPatient(null)}
          onSuccess={() => setRxPatient(null)}
        />
      )}
      {invoicePatient && (
        <CreateInvoiceModal
          patientId={invoicePatient.id}
          patientName={invoicePatient.name}
          onClose={() => setInvoicePatient(null)}
          onSuccess={() => setInvoicePatient(null)}
        />
      )}
      {schedulePatient && (
        <AddAppointmentModal
          defaultPatient={schedulePatient}
          onClose={() => setSchedulePatient(null)}
          onSuccess={() => setSchedulePatient(null)}
        />
      )}
    </div>
  )
}
