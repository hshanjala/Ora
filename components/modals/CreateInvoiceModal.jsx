'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Button, IconButton, FormField, Input, Textarea, DateInput, Combobox,
  Alert, Label, Card, Divider, Checkbox, useToast,
} from '@/components/ui'

export default function CreateInvoiceModal({ onClose, onSuccess, patientId, patientName }) {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')
  const [patientQuery, setPatientQuery] = useState(patientName || '')
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || null)
  const [discountType, setDiscountType] = useState('flat') // 'flat' | 'percent'

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    paid_now: '',
    discount: '',
  })
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: '' },
  ])

  useEffect(() => {
    async function loadPatients() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('patients').select('id, name')
        .eq('clinic_id', user.id).order('name')
      setPatients(data || [])
    }
    loadPatients()
  }, [])

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleItemChange(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: '' }])
  }

  function removeItem(index) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) =>
    sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1)), 0)

  const discountAmount = discountType === 'percent'
    ? subtotal * (parseFloat(form.discount || 0) / 100)
    : parseFloat(form.discount || 0)

  const total = Math.max(0, subtotal - discountAmount)
  const paidNow = parseFloat(form.paid_now || 0)
  const due = Math.max(0, total - paidNow)
  const status = paidNow >= total && total > 0 ? 'paid' : paidNow > 0 ? 'partial' : 'unpaid'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!patientQuery.trim()) { setError('Please enter a patient name.'); return }
    if (items.some(i => !i.description || !i.unit_price)) {
      setError('Please fill in all item fields'); return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    let resolvedPatientId = selectedPatientId
    if (!resolvedPatientId && patientQuery.trim()) {
      const { data: newPatient } = await supabase
        .from('patients').insert({ clinic_id: user.id, name: patientQuery.trim() })
        .select().single()
      resolvedPatientId = newPatient?.id || null
    }

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`

    const { data: invoice, error: invErr } = await supabase
      .from('invoices').insert({
        clinic_id: user.id,
        patient_id: resolvedPatientId,
        invoice_number: invoiceNum,
        date: form.date,
        due_date: null,
        status,
        total,
        discount: discountAmount,
        paid_amount: paidNow,
        notes: form.notes || null,
      }).select().single()

    if (invErr) { setError('Failed to create invoice.'); setLoading(false); return }

    await supabase.from('invoice_items').insert(
      items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total: parseFloat(item.unit_price) * parseInt(item.quantity),
      }))
    )

    toast.success('Invoice created', `${invoiceNum} · ৳${total.toLocaleString()}`)
    onSuccess()
    onClose()
  }

  const patientLocked = Boolean(patientId && patientName)

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent size="lg">
        <ModalHeader title="Create invoice" />
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-5">
            {error && <Alert status="danger">{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Patient"
                required
                hint={patientLocked ? undefined : 'Type a new name to register a patient'}
              >
                {patientLocked ? (
                  <Input value={patientName} readOnly className="bg-surface-subtle" />
                ) : (
                  <Combobox
                    items={patients.map(p => ({ value: p.id, label: p.name }))}
                    query={patientQuery}
                    onQueryChange={(q) => { setPatientQuery(q); setSelectedPatientId(null) }}
                    onSelect={(item) => { setPatientQuery(item.label); setSelectedPatientId(item.value) }}
                    onCreate={(q) => { setPatientQuery(q); setSelectedPatientId(null) }}
                    createLabel={(q) => `Add “${q}” as a new patient`}
                    placeholder="Type patient name…"
                  />
                )}
              </FormField>
              <FormField label="Invoice date">
                <DateInput name="date" value={form.date} onChange={handleFormChange} />
              </FormField>
            </div>

            {/* Line items */}
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
                        <Label htmlFor={`inv-qty-${i}`}>Qty</Label>
                        <Input
                          id={`inv-qty-${i}`}
                          className="tabular mt-1"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`inv-price-${i}`}>Price (৳)</Label>
                        <Input
                          id={`inv-price-${i}`}
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
                    onClick={() => setDiscountType(t => t === 'flat' ? 'percent' : 'flat')}
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
                  <span className="text-small text-tertiary">
                    {discountType === 'percent' ? '%' : '৳'}
                  </span>
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
                <label className="flex cursor-pointer items-center gap-2 text-small text-secondary">
                  <Checkbox
                    checked={paidNow >= total && total > 0}
                    onCheckedChange={(checked) =>
                      setForm(f => ({ ...f, paid_now: checked ? String(total) : '' }))
                    }
                    aria-label="Mark as fully paid"
                  />
                  Paid now
                </label>
                <div className="flex items-center gap-1.5">
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
              <Textarea
                name="notes"
                rows={2}
                placeholder="Payment terms, notes to patient…"
                value={form.notes}
                onChange={handleFormChange}
              />
            </FormField>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </ModalClose>
            <Button type="submit" loading={loading}>
              {loading ? 'Creating…' : 'Create invoice'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
