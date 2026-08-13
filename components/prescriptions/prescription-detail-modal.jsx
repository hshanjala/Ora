'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Printer, Pill } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Modal, ModalContent, ModalHeader, ModalBody,
  Button, Badge, Alert, Eyebrow, DateInput, EmptyState, SpinnerBlock, Card,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  useToast,
} from '@/components/ui'
import { printPrescription } from '@/lib/buildPrescriptionPrint'

export default function PrescriptionDetailModal({ prescription, open, onOpenChange, tplSettings }) {
  const supabase = createClient()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [rx, setRx] = useState(prescription)
  const [editFollowUp, setEditFollowUp] = useState(false)
  const [followUpVal, setFollowUpVal] = useState(prescription.follow_up_date || '')
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('prescription_items').select('*')
        .eq('prescription_id', prescription.id)
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [prescription.id])

  async function saveFollowUp() {
    setSavingFollowUp(true)
    await supabase.from('prescriptions').update({
      follow_up_date: followUpVal || null,
    }).eq('id', rx.id)
    setRx(prev => ({ ...prev, follow_up_date: followUpVal || null }))
    setSavingFollowUp(false)
    setEditFollowUp(false)
    toast.success('Follow-up date saved')
  }

  function handlePrint(paperSize) {
    printPrescription(
      tplSettings?.prescription_template || 1,
      tplSettings || {},
      rx,
      items,
      { paperSize }
    )
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader
          title="Prescription"
          subtitle={`${prescription.patients?.name || '—'} · ${format(new Date(prescription.date), 'MMM d, yyyy')}`}
        >
          <div className="mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Printer size={14} strokeWidth={1.75} /> Print
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Paper size</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => handlePrint('A4')}>A4</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handlePrint('A5')}>A5</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {(prescription.chief_complaint || prescription.diagnosis) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {prescription.chief_complaint && (
                <Card className="p-3">
                  <Eyebrow>C/C — chief complaint</Eyebrow>
                  <p className="mt-1 text-small text-primary">{prescription.chief_complaint}</p>
                </Card>
              )}
              {prescription.diagnosis && (
                <Card className="p-3">
                  <Eyebrow>O/E — on examination</Eyebrow>
                  <p className="mt-1 text-small text-primary">{prescription.diagnosis}</p>
                </Card>
              )}
            </div>
          )}

          <div>
            <Eyebrow className="mb-2">℞ Prescribed medicines</Eyebrow>
            {loading ? (
              <SpinnerBlock />
            ) : items.length === 0 ? (
              <EmptyState icon={Pill} title="No medicines listed" compact />
            ) : (
              <ol className="space-y-2">
                {items.map((item, i) => (
                  <li key={item.id} className="rounded-md border p-3">
                    <p className="text-body-md text-primary">{i + 1}. {item.medicine}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.frequency && <Badge variant="accent">{item.frequency}</Badge>}
                      {item.duration && <Badge>{item.duration}</Badge>}
                      {item.instructions && <Badge variant="outline">{item.instructions}</Badge>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {prescription.advice && (
            <Alert status="warning" title="Advice">{prescription.advice}</Alert>
          )}

          {prescription.notes && (
            <div>
              <Eyebrow className="mb-1">Doctor&apos;s notes</Eyebrow>
              <p className="whitespace-pre-line text-small text-secondary">{prescription.notes}</p>
            </div>
          )}

          {/* Follow-up */}
          <Card className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Eyebrow>Next visit / follow-up</Eyebrow>
                {editFollowUp ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <DateInput
                      aria-label="Follow-up date"
                      className="w-40"
                      value={followUpVal}
                      onChange={(e) => setFollowUpVal(e.target.value)}
                    />
                    <Button size="sm" onClick={saveFollowUp} loading={savingFollowUp}>
                      {savingFollowUp ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditFollowUp(false); setFollowUpVal(rx.follow_up_date || '') }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <p className="tabular mt-1 text-body-md text-primary">
                    {rx.follow_up_date
                      ? format(new Date(rx.follow_up_date + 'T00:00:00'), 'dd MMM yyyy')
                      : <span className="text-tertiary">Not set</span>}
                  </p>
                )}
              </div>
              {!editFollowUp && (
                <Button variant="secondary" size="sm" onClick={() => setEditFollowUp(true)}>
                  {rx.follow_up_date ? 'Edit' : 'Set date'}
                </Button>
              )}
            </div>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
