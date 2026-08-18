'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet, SheetContent, SheetHeader, SheetBody,
  IconButton, Alert, Eyebrow, SpinnerBlock, EmptyState, ErrorState, Button,
} from '@/components/ui'
import VisitRow from './visit-row'
import EditPatientModal from './edit-patient-modal'
import PatientPhoto from './patient-photo'

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-label text-tertiary">{label}</p>
      <p className={value ? 'truncate text-small text-primary' : 'text-small text-tertiary'}>
        {value || '—'}
      </p>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="flex-1 rounded-md bg-surface-subtle px-3 py-2.5 text-center">
      <p className="text-label text-tertiary">{label}</p>
      <p className={`tabular mt-0.5 text-h3 ${tone || 'text-primary'}`}>{value}</p>
    </div>
  )
}

export default function PatientPanel({ patient: initialPatient, open, onOpenChange, clinicName }) {
  const supabase = createClient()
  const [patient, setPatient] = useState(initialPatient)
  const [visits, setVisits] = useState([])
  const [stats, setStats] = useState({ visits: 0, spent: 0, dues: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEdit, setShowEdit] = useState(false)

  async function load() {
    setError(null)
    try {
      // Fetch all invoices for this patient
      const { data: invs } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('patient_id', patient.id)
        .order('date', { ascending: false })

      // Fetch all prescriptions for this patient
      const { data: rxs } = await supabase
        .from('prescriptions')
        .select('*, prescription_items(*)')
        .eq('patient_id', patient.id)
        .order('date', { ascending: false })

      // Build a map of date → { rx, inv }
      const dateMap = {}

      for (const inv of invs || []) {
        if (!dateMap[inv.date]) dateMap[inv.date] = { date: inv.date, patientId: patient.id, rx: null, inv: null }
        dateMap[inv.date].inv = inv
      }

      for (const rx of rxs || []) {
        if (!dateMap[rx.date]) dateMap[rx.date] = { date: rx.date, patientId: patient.id, rx: null, inv: null }
        dateMap[rx.date].rx = rx
      }

      const sortedVisits = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date))
      setVisits(sortedVisits)

      const spent = invs?.reduce((s, i) => s + (i.paid_amount || 0), 0) || 0
      const dues = invs?.reduce((s, i) => s + (i.status !== 'paid' ? ((i.total || 0) - (i.paid_amount || 0)) : 0), 0) || 0

      setStats({ visits: sortedVisits.length, spent, dues })
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [patient.id])

  const meta = [
    patient.gender,
    patient.age ? `${patient.age} yrs` : null,
    `Patient since ${format(new Date(patient.created_at), 'MMM yyyy')}`,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="md:max-w-lg">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <PatientPhoto name={patient.name} src={patient.photo_url} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-h2 text-primary">{patient.name}</p>
                <p className="mt-0.5 text-small text-secondary">{meta}</p>
              </div>
              <IconButton
                aria-label="Edit patient"
                size="sm"
                className="ml-auto shrink-0"
                onClick={() => setShowEdit(true)}
              >
                <Pencil size={14} strokeWidth={1.75} />
              </IconButton>
            </div>
          </SheetHeader>

          <SheetBody className="p-0">
            {/* Contact details */}
            <div className="space-y-3 px-5 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Phone" value={patient.phone} />
                <Field label="Email" value={patient.email} />
                <Field label="Address" value={patient.address} />
                <Field label="Referred by" value={patient.referred_by} />
              </div>

              {patient.medical_history && (
                <Alert status="warning" title="Medical history / allergies">
                  {patient.medical_history}
                </Alert>
              )}

              <div className="flex gap-2">
                <Stat label="Total visits" value={stats.visits} />
                <Stat label="Total spent" value={`৳${stats.spent.toLocaleString()}`} tone="text-success" />
                <Stat
                  label="Dues"
                  value={`৳${stats.dues.toLocaleString()}`}
                  tone={stats.dues > 0 ? 'text-danger' : 'text-success'}
                />
              </div>
            </div>

            {/* Visit history */}
            <div className="border-y bg-surface-subtle px-5 py-2">
              <Eyebrow>Visit history — tap a date to expand</Eyebrow>
            </div>

            {loading ? (
              <SpinnerBlock />
            ) : error ? (
              <ErrorState
                title="Could not load visit history"
                action={
                  <Button variant="secondary" size="sm" onClick={() => { setLoading(true); load() }}>
                    Try again
                  </Button>
                }
              />
            ) : visits.length === 0 ? (
              <EmptyState
                title="No visits recorded yet"
                description="Visits appear here when an invoice or prescription is created."
                compact
              />
            ) : (
              <div>
                {visits.map((visit) => (
                  <VisitRow key={visit.date} visit={visit} clinicName={clinicName} />
                ))}
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {showEdit && (
        <EditPatientModal
          patient={patient}
          open={showEdit}
          onOpenChange={setShowEdit}
          onSaved={(updated) => setPatient(prev => ({ ...prev, ...updated }))}
        />
      )}
    </>
  )
}
