'use client'
import { useRef } from 'react'
import { Camera, Plus, Trash2, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  Button, IconButton, FormField, Input, Textarea, DateInput, TimeInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Alert, Label, Avatar, Checkbox, Card, Divider, Tooltip,
} from '@/components/ui'
import {
  LabelDropdown, MedicineRow, AddFieldButton, ExtraFieldRow,
  CC_OPTIONS, OE_OPTIONS, ADV_OPTIONS,
} from '@/components/prescriptions/fields'

const PROCEDURES = [
  'General Checkup', 'Cleaning & Scaling', 'Tooth Extraction',
  'Root Canal', 'Filling', 'Crown & Bridge', 'Teeth Whitening',
  'Braces / Orthodontics', 'Dentures', 'X-Ray', 'Consultation', 'Other',
]

/** The patient this wizard is building, shown on every step after step 1. */
function PatientChip({ name }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-accent-subtle px-3 py-2">
      <Avatar name={name} size="sm" />
      <span className="truncate text-body-md text-accent-text">{name}</span>
    </div>
  )
}

export function Step1Patient({ form, setForm, error, photoPreview, onPhotoChange }) {
  const photoRef = useRef(null)
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  return (
    <div className="space-y-4">
      {error && <Alert status="danger">{error}</Alert>}

      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          aria-label="Add patient photo"
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-full border border-dashed border-strong text-tertiary transition-colors duration-fast hover:bg-surface-hover"
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Patient preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <Camera size={16} strokeWidth={1.75} />
              <span className="text-micro">Photo</span>
            </>
          )}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
        <FormField label="Full name" required className="flex-1">
          <Input
            name="name"
            placeholder="Patient's full name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Phone" hint="Needed for WhatsApp sharing">
          <Input name="phone" placeholder="01XXXXXXXXX" value={form.phone} onChange={handleChange} />
        </FormField>
        <FormField label="Email">
          <Input name="email" type="email" placeholder="patient@email.com" value={form.email} onChange={handleChange} />
        </FormField>
        <FormField label="Age">
          <Input name="age" type="number" min="0" max="120" placeholder="e.g. 35" value={form.age} onChange={handleChange} />
        </FormField>
        <FormField label="Gender">
          <Select value={form.gender || undefined} onValueChange={(v) => setForm(prev => ({ ...prev, gender: v }))}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Address" className="sm:col-span-2">
          <Input name="address" placeholder="Full address" value={form.address} onChange={handleChange} />
        </FormField>
        <FormField label="Referred by" className="sm:col-span-2">
          <Input name="referred_by" placeholder="Doctor or clinic name" value={form.referred_by} onChange={handleChange} />
        </FormField>
        <FormField label="Medical history / allergies" className="sm:col-span-2">
          <Textarea
            name="medical_history"
            rows={2}
            placeholder="Allergies, chronic conditions, previous treatments…"
            value={form.medical_history}
            onChange={handleChange}
          />
        </FormField>
      </div>
    </div>
  )
}

export function Step2Schedule({ form, setForm, patientName }) {
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  return (
    <div className="space-y-4">
      <PatientChip name={patientName} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Date" required>
          <DateInput name="date" value={form.date} onChange={handleChange} />
        </FormField>
        <FormField label="Time" required>
          <TimeInput name="time" value={form.time} onChange={handleChange} />
        </FormField>
        <FormField label="Procedure" className="sm:col-span-2">
          <Select value={form.procedure || undefined} onValueChange={(v) => setForm(prev => ({ ...prev, procedure: v }))}>
            <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
            <SelectContent>
              {PROCEDURES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Notes" className="sm:col-span-2">
          <Textarea name="notes" rows={2} placeholder="Any additional notes…" value={form.notes} onChange={handleChange} />
        </FormField>
      </div>
    </div>
  )
}

export function Step3Prescription({
  form, setForm, medicines, setMedicines, patientName,
  extraFields, setExtraFields,
  ccLabel, setCcLabel, oeLabel, setOeLabel, advLabel, setAdvLabel,
}) {
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  function handleMedChange(i, field, value) {
    setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }
  function addMed() {
    setMedicines(prev => [...prev, { medicine: '', frequency: '', duration: '', instructions: '' }])
  }
  function removeMed(i) {
    if (medicines.length === 1) return
    setMedicines(prev => prev.filter((_, idx) => idx !== i))
  }
  function addExtraField(label) {
    setExtraFields(prev => [...prev, { id: Date.now(), label, value: '' }])
  }
  function removeExtraField(id) {
    setExtraFields(prev => prev.filter(f => f.id !== id))
  }
  function updateExtraField(id, value) {
    setExtraFields(prev => prev.map(f => f.id === id ? { ...f, value } : f))
  }

  return (
    <div className="space-y-4">
      <PatientChip name={patientName} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5">
            <LabelDropdown label={ccLabel} options={CC_OPTIONS} onChange={setCcLabel} />
          </div>
          <Textarea name="chief_complaint" rows={2} placeholder="Chief complaint…" value={form.chief_complaint} onChange={handleFormChange} />
        </div>
        <div>
          <div className="mb-1.5">
            <LabelDropdown label={oeLabel} options={OE_OPTIONS} onChange={setOeLabel} />
          </div>
          <Textarea name="on_examination" rows={2} placeholder="Examination findings…" value={form.on_examination} onChange={handleFormChange} />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <LabelDropdown label={advLabel} options={ADV_OPTIONS} onChange={setAdvLabel} />
          <AddFieldButton onAdd={addExtraField} existingLabels={extraFields.map(f => f.label)} />
        </div>
        <Textarea name="advice" rows={2} placeholder="Advice given to patient…" value={form.advice} onChange={handleFormChange} />
      </div>

      {extraFields.length > 0 && (
        <div className="space-y-3">
          {extraFields.map(field => (
            <ExtraFieldRow key={field.id} field={field} onChange={updateExtraField} onRemove={removeExtraField} />
          ))}
        </div>
      )}

      <FormField label="Follow-up date">
        <DateInput name="follow_up_date" value={form.follow_up_date} onChange={handleFormChange} />
      </FormField>

      <div>
        <Label className="mb-1.5">Medicines</Label>
        <div className="space-y-3">
          {medicines.map((med, i) => (
            <MedicineRow
              key={i}
              med={med}
              index={i}
              onChange={handleMedChange}
              onRemove={removeMed}
              disableRemove={medicines.length === 1}
            />
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addMed}>
          <Plus size={14} strokeWidth={1.75} /> Add medicine
        </Button>
      </div>
    </div>
  )
}

export function Step4Invoice({ items, setItems, form, setForm, patientName }) {
  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  function handleItemChange(i, field, value) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }
  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: '' }])
  }
  function removeItem(i) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  const subtotal = items.reduce((sum, item) =>
    sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)), 0)
  const discountType = form.discountType || 'flat'
  const discountAmount = discountType === 'percent'
    ? subtotal * (parseFloat(form.discount || 0) / 100)
    : parseFloat(form.discount || 0)
  const total = Math.max(0, subtotal - discountAmount)
  const paidNow = parseFloat(form.paid_now || 0)
  const due = Math.max(0, total - paidNow)

  return (
    <div className="space-y-4">
      <PatientChip name={patientName} />

      <FormField label="Invoice date">
        <DateInput name="date" value={form.date} onChange={handleFormChange} />
      </FormField>

      <div>
        <Label className="mb-1.5">Services / items</Label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-md border p-3">
              <Input
                placeholder="e.g. Root Canal, Tooth Extraction"
                value={item.description}
                onChange={(e) => handleItemChange(i, 'description', e.target.value)}
              />
              <div className="mt-2 flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`qty-${i}`}>Qty</Label>
                  <Input
                    id={`qty-${i}`}
                    className="tabular mt-1"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`price-${i}`}>Price (৳)</Label>
                  <Input
                    id={`price-${i}`}
                    className="tabular mt-1"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(i, 'unit_price', e.target.value)}
                  />
                </div>
                <div className="w-20 shrink-0 text-right">
                  <Label>Total</Label>
                  <p className="tabular mt-1 flex h-9 items-center justify-end text-body-md text-primary">
                    ৳{(parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)).toLocaleString()}
                  </p>
                </div>
                <IconButton
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addItem}>
          <Plus size={14} strokeWidth={1.75} /> Add item
        </Button>
      </div>

      {/* Totals */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-small text-secondary">Subtotal</span>
          <span className="tabular text-body-md text-primary">৳{subtotal.toLocaleString()}</span>
        </div>
        <Divider />
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-small text-secondary">Discount</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setForm(prev => ({
                ...prev,
                discountType: prev.discountType === 'flat' ? 'percent' : 'flat',
              }))}
            >
              {discountType === 'flat' ? '৳ Flat' : '% Off'}
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              name="discount"
              type="number"
              min="0"
              step="0.01"
              max={discountType === 'percent' ? 100 : subtotal}
              placeholder="0"
              value={form.discount}
              onChange={handleFormChange}
              aria-label={discountType === 'percent' ? 'Discount percent' : 'Discount amount'}
              className="tabular w-24 text-right"
            />
            <span className="text-small text-tertiary">{discountType === 'percent' ? '%' : '৳'}</span>
          </div>
        </div>
        {discountAmount > 0 && (
          <>
            <Divider />
            <div className="flex items-center justify-between bg-warning-subtle px-4 py-2">
              <span className="text-label text-warning">Discount applied</span>
              <span className="tabular text-body-md text-warning">
                −৳{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}
        <Divider />
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-small text-secondary">Total</span>
          <span className="tabular text-h3 text-primary">৳{total.toLocaleString()}</span>
        </div>
        <Divider />
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-small text-secondary">Paid now</span>
          {/* Fully-paid toggle sits beside the amount it fills in */}
          <div className="flex items-center gap-2">
            <Tooltip label="Mark as fully paid">
              <Checkbox
                checked={paidNow >= total && total > 0}
                onCheckedChange={(checked) =>
                  setForm(f => ({ ...f, paid_now: checked ? String(total) : '' }))
                }
                aria-label="Mark as fully paid"
              />
            </Tooltip>
            <span className="text-small text-tertiary">৳</span>
            <Input
              name="paid_now"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.paid_now}
              onChange={handleFormChange}
              aria-label="Amount paid now"
              className="tabular w-28 text-right"
            />
          </div>
        </div>
        <Divider />
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-small text-secondary">Due</span>
          <span className={cn('tabular text-h3', due > 0 ? 'text-danger' : 'text-success')}>
            ৳{due.toLocaleString()}
          </span>
        </div>
      </Card>

      <FormField label="Notes">
        <Textarea name="notes" rows={2} placeholder="Payment terms, notes to patient…" value={form.notes} onChange={handleFormChange} />
      </FormField>
    </div>
  )
}
