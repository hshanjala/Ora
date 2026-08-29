'use client'
import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, Printer, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'
import {
  Button, IconButton, Eyebrow, StatusPill, Alert, Spinner, Textarea,
} from '@/components/ui'
import { printInvoice } from '@/lib/printInvoice'

const INVOICE_STATUS = { paid: 'success', partial: 'warning' }

// One visit (a date with a prescription and/or an invoice). Collapsed by
// default; expanding lazily loads that visit's images and treatment notes.
export default function VisitRow({ visit, clinicName }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState([])
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [viewingImage, setViewingImage] = useState(null)
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const notesRef = useRef('')
  const notesLoadedRef = useRef(false)
  const fileRef = useRef(null)

  async function loadImages() {
    if (imagesLoaded) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setImagesLoaded(true); return }
    const folder = `${user.id}/${visit.patientId}/${visit.date}`
    const { data: files } = await supabase.storage.from('patient-images').list(folder)
    if (files && files.length > 0) {
      setImages(files.map(f => ({
        url: supabase.storage.from('patient-images').getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
        label: f.name,
      })))
    }
    setImagesLoaded(true)
  }

  async function loadNotes() {
    if (notesLoadedRef.current) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { notesLoadedRef.current = true; return }
    const { data } = await supabase
      .from('visit_notes')
      .select('notes')
      .eq('clinic_id', user.id)
      .eq('patient_id', visit.patientId)
      .eq('date', visit.date)
      .maybeSingle()
    const loaded = data?.notes || ''
    notesRef.current = loaded
    notesLoadedRef.current = true
    setNotes(loaded)
  }

  async function saveNotes() {
    if (!notesLoadedRef.current) return
    setNotesSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setNotesSaving(false); return }
    const { error } = await supabase.from('visit_notes').upsert({
      clinic_id: user.id,
      patient_id: visit.patientId,
      date: visit.date,
      notes: notesRef.current,
    }, { onConflict: 'clinic_id,patient_id,date' })
    if (error) console.error('visit_notes save error:', error)
    setNotesSaving(false)
  }

  async function handleToggle() {
    if (!open) {
      await Promise.all([loadImages(), loadNotes()])
    }
    setOpen(o => !o)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setUploadError('')
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id
    if (!uid) {
      setUploadError('Not authenticated. Please refresh and try again.')
      setUploadingImage(false)
      e.target.value = ''
      return
    }
    const ext = file.name.split('.').pop()
    const folder = `${uid}/${visit.patientId}/${visit.date}`
    const filePath = `${folder}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('patient-images').upload(filePath, file, { upsert: true })
    if (upErr) {
      setUploadError(`Upload failed (${upErr.message}). Please try again.`)
      setUploadingImage(false)
      e.target.value = ''
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('patient-images').getPublicUrl(filePath)
    setImages(prev => [...prev, { url: publicUrl, label: file.name }])
    setUploadingImage(false)
    e.target.value = ''
  }

  const chips = []
  if (visit.rx) chips.push('Prescription')
  if (visit.inv) chips.push('Invoice')
  const due = visit.inv ? (visit.inv.total || 0) - (visit.inv.paid_amount || 0) : 0
  const visitDate = new Date(visit.date + 'T00:00:00')

  return (
    <div className="border-b last:border-0">
      <button
        onClick={handleToggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-fast ease-out hover:bg-surface-hover',
          open && 'bg-surface-subtle'
        )}
      >
        {/* Date tile */}
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md border',
            open ? 'border-transparent bg-accent-subtle text-accent-text' : 'bg-surface text-primary'
          )}
        >
          <span className="tabular text-label leading-none">{format(visitDate, 'd')}</span>
          <span className="text-micro uppercase leading-none opacity-70">{format(visitDate, 'MMM')}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-md text-primary">
            {visit.inv?.invoice_items?.[0]?.description || visit.rx?.diagnosis || 'Visit'}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-label text-tertiary">
            {chips.join(' · ') || 'No records'}
            {visit.inv && (
              <StatusPill status={INVOICE_STATUS[visit.inv.status] || 'danger'}>
                ৳{visit.inv.total?.toLocaleString()}
              </StatusPill>
            )}
          </span>
        </span>

        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-fast ease-out',
            open
              ? 'border-transparent bg-accent-subtle text-accent-text'
              : 'border-border bg-surface text-secondary'
          )}
        >
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className={cn(
              'transition-transform duration-base ease-out motion-reduce:transition-none',
              open && 'rotate-180'
            )}
          />
        </span>
      </button>

      {open && (
        <div className="space-y-4 bg-surface-subtle px-5 pb-5 pt-1">
          {/* Prescription */}
          <div>
            <Eyebrow className="mb-1.5">Prescription</Eyebrow>
            {visit.rx ? (
              <div className="rounded-md border bg-surface p-3">
                {visit.rx.diagnosis && (
                  <p className="text-body-md text-primary">Diagnosis: {visit.rx.diagnosis}</p>
                )}
                {visit.rx.prescription_items?.map((med, i) => (
                  <p key={i} className="mt-1 text-small text-secondary">
                    • {med.medicine}
                    {med.dosage ? ` ${med.dosage}` : ''}
                    {med.frequency ? ` — ${med.frequency}` : ''}
                    {med.duration ? ` · ${med.duration}` : ''}
                  </p>
                ))}
                {visit.rx.follow_up_date && (
                  <p className="mt-2 text-small text-accent-text">
                    Follow-up:{' '}
                    <span className="tabular">
                      {format(new Date(visit.rx.follow_up_date + 'T00:00:00'), 'dd MMM yyyy')}
                    </span>
                  </p>
                )}
                {visit.rx.notes && (
                  <p className="mt-2 text-label text-tertiary">Note: {visit.rx.notes}</p>
                )}
              </div>
            ) : (
              <p className="text-small text-tertiary">No prescription for this visit</p>
            )}
          </div>

          {/* Invoice */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Eyebrow>Invoice</Eyebrow>
              {visit.inv && (
                <Button variant="ghost" size="sm" onClick={() => printInvoice(visit.inv, visit.inv.invoice_items || [], clinicName)}>
                  <Printer size={14} strokeWidth={1.75} /> Print
                </Button>
              )}
            </div>
            {visit.inv ? (
              <div className="flex items-start justify-between gap-3 rounded-md border bg-surface p-3">
                <div className="min-w-0">
                  <p className="text-body-md text-primary">
                    <span className="tabular">{visit.inv.invoice_number}</span>
                    {' · '}
                    <span className="tabular">৳{visit.inv.total?.toLocaleString()}</span>
                  </p>
                  {visit.inv.invoice_items?.map((item, i) => (
                    <p key={i} className="mt-0.5 text-label text-secondary">
                      {item.description} × {item.quantity}
                    </p>
                  ))}
                  {due > 0 && (
                    <p className="mt-1 text-label text-danger">
                      Due: <span className="tabular">৳{due.toLocaleString()}</span>
                    </p>
                  )}
                </div>
                <StatusPill status={INVOICE_STATUS[visit.inv.status] || 'danger'}>
                  {visit.inv.status}
                </StatusPill>
              </div>
            ) : (
              <p className="text-small text-tertiary">No invoice for this visit</p>
            )}
          </div>

          {/* Treatment notes */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Eyebrow>Treatment notes</Eyebrow>
              {notesSaving && <span className="text-micro text-accent-text">Saving…</span>}
            </div>
            <Textarea
              value={notes}
              onChange={(e) => { notesRef.current = e.target.value; setNotes(e.target.value) }}
              onBlur={saveNotes}
              placeholder="Add treatment details, doctor name, observations…"
              rows={3}
              className="bg-surface"
            />
          </div>

          {/* Images */}
          <div>
            <Eyebrow className="mb-1.5">X-rays &amp; oral images</Eyebrow>
            {uploadError && (
              <Alert status="danger" className="mb-2">{uploadError}</Alert>
            )}
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setViewingImage(img)}
                  className="block h-14 w-14 overflow-hidden rounded-md border transition-opacity duration-fast hover:opacity-80"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.label || 'Visit image'} className="h-full w-full object-cover" />
                </button>
              ))}
              <button
                onClick={() => { setUploadError(''); fileRef.current?.click() }}
                disabled={uploadingImage}
                aria-label="Upload image"
                className="flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-strong bg-surface text-tertiary transition-colors duration-fast hover:bg-surface-hover disabled:opacity-50"
              >
                {uploadingImage
                  ? <Spinner size={14} className="text-accent-text" />
                  : <Plus size={14} strokeWidth={1.75} />}
                <span className="text-micro">Upload</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </div>
      )}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingImage(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setViewingImage(null) }}
          role="dialog"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setViewingImage(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close preview"
          >
            <X size={20} strokeWidth={2} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewingImage.url}
            alt={viewingImage.label || 'Visit image'}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
