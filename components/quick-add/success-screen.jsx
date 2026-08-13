'use client'
import { Check, Printer, MessageCircle } from 'lucide-react'
import { Button, Eyebrow, Divider } from '@/components/ui'
import { printInvoice } from '@/lib/printInvoice'
import { printPrescription } from '@/lib/buildPrescriptionPrint'

// Normalise a Bangladeshi number for wa.me (unchanged behaviour).
function waPhone(raw) {
  const digits = raw.replace(/\D/g, '')
  const local = digits.replace(/^880/, '').replace(/^0/, '')
  return `880${local}`
}

function ShareRow({ title, onPrint, onShare, hasPhone }) {
  return (
    <div className="px-5 py-4">
      <Eyebrow className="mb-2">{title}</Eyebrow>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={onPrint}>
          <Printer size={15} strokeWidth={1.75} /> Print
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onShare} disabled={!hasPhone}>
          <MessageCircle size={15} strokeWidth={1.75} /> Share via WhatsApp
        </Button>
      </div>
      {!hasPhone && (
        <p className="mt-2 text-center text-label text-tertiary">
          Add a phone number to enable WhatsApp sharing
        </p>
      )}
    </div>
  )
}

export default function SuccessScreen({
  patientName, patientPhone, onClose, savedInvoice, savedRx, tplSettings,
}) {
  const clinicName = tplSettings?.clinic_name || 'Ora Dental Clinic'
  const hasInvoice = Boolean(savedInvoice)
  const hasRx = Boolean(savedRx)
  const hasPhone = Boolean(patientPhone)

  function handlePrintInvoice() {
    if (!savedInvoice) return
    printInvoice(
      { ...savedInvoice, patients: { name: patientName } },
      savedInvoice.invoice_items || [],
      clinicName
    )
  }

  function handlePrintRx() {
    if (!savedRx) return
    printPrescription(
      tplSettings?.prescription_template || 1,
      tplSettings || {},
      savedRx,
      savedRx.prescription_items || []
    )
  }

  function shareInvoiceWhatsApp() {
    if (!savedInvoice || !patientPhone) return
    const due = Math.max(0, (savedInvoice.total || 0) - (savedInvoice.paid_amount || 0))
    const msg = `Hello ${patientName}, your invoice ${savedInvoice.invoice_number} from ${clinicName}:\nTotal: ৳${savedInvoice.total?.toLocaleString()}\nPaid: ৳${(savedInvoice.paid_amount || 0).toLocaleString()}${due > 0 ? `\nDue: ৳${due.toLocaleString()}` : '\nStatus: Fully Paid'}\nThank you!`
    window.open(`https://wa.me/${waPhone(patientPhone)}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function shareRxWhatsApp() {
    if (!savedRx || !patientPhone) return
    const items = savedRx.prescription_items || []
    const medList = items
      .map((m, i) => `${i + 1}. ${m.medicine}${m.frequency ? ` - ${m.frequency}` : ''}${m.duration ? ` (${m.duration})` : ''}`)
      .join('\n')
    const msg = `Hello ${patientName}, your prescription from ${clinicName}:${savedRx.chief_complaint ? `\nC/C: ${savedRx.chief_complaint}` : ''}${savedRx.diagnosis ? `\nO/E: ${savedRx.diagnosis}` : ''}\n\nMedicines:\n${medList}${savedRx.advice ? `\n\nAdv: ${savedRx.advice}` : ''}\n\nGet well soon!`
    window.open(`https://wa.me/${waPhone(patientPhone)}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="px-6 py-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success">
          <Check size={24} strokeWidth={2} />
        </span>
        <h2 className="text-h2 text-primary">All done</h2>
        <p className="mt-1 text-small text-secondary">
          <span className="text-primary">{patientName}</span> has been added successfully.
        </p>
      </div>

      {(hasInvoice || hasRx) && <Divider />}

      {hasInvoice && (
        <ShareRow
          title="Invoice"
          onPrint={handlePrintInvoice}
          onShare={shareInvoiceWhatsApp}
          hasPhone={hasPhone}
        />
      )}

      {hasInvoice && hasRx && <Divider />}

      {hasRx && (
        <ShareRow
          title="Prescription"
          onPrint={handlePrintRx}
          onShare={shareRxWhatsApp}
          hasPhone={hasPhone}
        />
      )}

      <div className="mt-auto border-t px-5 py-4">
        <Button className="w-full" size="lg" onClick={onClose}>
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
