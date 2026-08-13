'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Printer, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'
import {
  Modal, ModalContent, ModalHeader, ModalBody,
  Button, Card, Divider, Alert, Eyebrow, Input, DateInput, Label,
  SpinnerBlock, StatusPill,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  useToast,
} from '@/components/ui'
import { printInvoice } from '@/lib/printInvoice'
import { INVOICE_STATUS } from './status'

function Row({ label, value, tone, strong }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className={cn('text-small', tone || 'text-secondary')}>{label}</span>
      <span className={cn('tabular', strong ? 'text-h3' : 'text-body-md', tone || 'text-primary')}>
        {value}
      </span>
    </div>
  )
}

export default function InvoiceDetailModal({ invoice, open, onOpenChange, onUpdate, clinicName }) {
  const supabase = createClient()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [payNote, setPayNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [payError, setPayError] = useState('')
  const [inv, setInv] = useState(invoice)

  useEffect(() => {
    async function load() {
      const [{ data: itemData }, { data: payData }] = await Promise.all([
        supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id),
        supabase.from('invoice_payments').select('*').eq('invoice_id', invoice.id).order('created_at', { ascending: true }),
      ])
      setItems(itemData || [])
      setPayments(payData || [])
      setLoading(false)
    }
    load()
  }, [invoice.id])

  async function recordPayment() {
    setUpdating(true)
    setPayError('')
    const addPaid = parseFloat(payAmount || 0)
    if (!addPaid || addPaid <= 0) { setUpdating(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    const newPaid = Math.min(inv.total, (inv.paid_amount || 0) + addPaid)
    const status = newPaid >= inv.total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

    const { error: insertError } = await supabase.from('invoice_payments').insert({
      invoice_id: invoice.id,
      clinic_id: user.id,
      amount: addPaid,
      date: payDate,
      note: payNote || null,
    })

    if (insertError) {
      setPayError('Failed to save payment: ' + insertError.message)
      setUpdating(false)
      return
    }

    await supabase.from('invoices').update({ paid_amount: newPaid, status }).eq('id', invoice.id)

    const { data: payData } = await supabase.from('invoice_payments').select('*')
      .eq('invoice_id', invoice.id).order('created_at', { ascending: true })
    setPayments(payData || [])
    setInv(prev => ({ ...prev, paid_amount: newPaid, status }))
    setPayAmount('')
    setPayNote('')
    setPayDate(format(new Date(), 'yyyy-MM-dd'))
    setUpdating(false)
    toast.success('Payment recorded', `৳${addPaid.toLocaleString()}`)
    onUpdate()
  }

  const remaining = Math.max(0, (inv.total || 0) - (inv.paid_amount || 0))
  const discount = inv.discount || 0
  const subtotal = (inv.total || 0) + discount

  // Ledger rows, including any balance paid before itemised payments existed.
  const ledgerTotal = payments.reduce((s, p) => s + Number(p.amount), 0)
  const priorAmount = Math.round(((inv.paid_amount || 0) - ledgerTotal) * 100) / 100
  const ledger = []
  let cumulative = 0
  if (priorAmount > 0) {
    cumulative += priorAmount
    ledger.push({
      key: 'prior',
      date: inv.date,
      amount: priorAmount,
      balance: Math.max(0, inv.total - cumulative),
    })
  }
  payments.forEach(p => {
    cumulative += Number(p.amount)
    ledger.push({
      key: p.id,
      date: p.date,
      amount: Number(p.amount),
      balance: Math.max(0, inv.total - cumulative),
    })
  })

  function handlePrint(paperSize) {
    printInvoice(inv, items, clinicName, payments, { paperSize })
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader
          title={inv.invoice_number}
          subtitle={`${inv.patients?.name || '—'} · ${format(new Date(inv.date), 'MMMM d, yyyy')}`}
        >
          <div className="mt-2 flex items-center gap-2">
            <StatusPill status={INVOICE_STATUS[inv.status] || 'danger'}>{inv.status}</StatusPill>
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
          {loading ? (
            <SpinnerBlock />
          ) : (
            <>
              {/* Line items */}
              <div>
                <Eyebrow className="mb-2">Line items</Eyebrow>
                <Card className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-surface-subtle">
                        <th className="px-3 py-2 text-left text-label font-medium text-secondary">Description</th>
                        <th className="px-3 py-2 text-right text-label font-medium text-secondary">Qty</th>
                        <th className="px-3 py-2 text-right text-label font-medium text-secondary">Price</th>
                        <th className="px-3 py-2 text-right text-label font-medium text-secondary">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="px-3 py-2.5 text-small text-primary">{item.description}</td>
                          <td className="tabular px-3 py-2.5 text-right text-small text-secondary">{item.quantity}</td>
                          <td className="tabular px-3 py-2.5 text-right text-small text-secondary">৳{item.unit_price?.toLocaleString()}</td>
                          <td className="tabular px-3 py-2.5 text-right text-body-md text-primary">৳{item.total?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Totals */}
              <Card className="overflow-hidden">
                {discount > 0 && (
                  <>
                    <Row label="Subtotal" value={`৳${subtotal.toLocaleString()}`} />
                    <Divider />
                    <Row
                      label="Discount"
                      value={`−৳${discount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                      tone="text-warning"
                    />
                    <Divider />
                  </>
                )}
                <Row label="Total" value={`৳${inv.total?.toLocaleString()}`} strong />
                <Divider />
                <Row label="Paid" value={`৳${(inv.paid_amount || 0).toLocaleString()}`} tone="text-success" />
                <Divider />
                <Row
                  label="Due"
                  value={`৳${remaining.toLocaleString()}`}
                  tone={remaining > 0 ? 'text-danger' : 'text-success'}
                  strong
                />
              </Card>

              {/* Payment ledger */}
              {ledger.length > 0 && (
                <div>
                  <Eyebrow className="mb-2 flex items-center gap-1.5">
                    <Clock size={12} strokeWidth={1.75} /> Payment details
                  </Eyebrow>
                  <Card className="overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-surface-subtle">
                          <th className="px-4 py-2 text-left text-label font-medium text-secondary">Date</th>
                          <th className="px-4 py-2 text-center text-label font-medium text-secondary">Paid amount</th>
                          <th className="px-4 py-2 text-right text-label font-medium text-secondary">Due amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map(row => (
                          <tr key={row.key} className="border-b last:border-0">
                            <td className="tabular px-4 py-2.5 text-small text-primary">
                              {format(new Date(row.date + 'T00:00:00'), 'dd.MM.yy')}
                            </td>
                            <td className="tabular px-4 py-2.5 text-center text-body-md text-success">
                              ৳{row.amount.toLocaleString()}
                            </td>
                            <td className={cn(
                              'tabular px-4 py-2.5 text-right text-body-md',
                              row.balance > 0 ? 'text-danger' : 'text-success'
                            )}>
                              ৳{row.balance.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

              {inv.notes && (
                <div>
                  <Eyebrow className="mb-1">Notes</Eyebrow>
                  <p className="text-small text-secondary">{inv.notes}</p>
                </div>
              )}

              {/* Record payment */}
              {inv.status !== 'paid' && (
                <Card className="p-4">
                  <Eyebrow className="mb-3">Record payment</Eyebrow>
                  {payError && <Alert status="danger" className="mb-3">{payError}</Alert>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="pay-amount">Amount</Label>
                      <Input
                        id="pay-amount"
                        type="number"
                        min="0"
                        max={remaining}
                        placeholder={`Max ৳${remaining.toLocaleString()}`}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="tabular mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pay-date">Date</Label>
                      <DateInput
                        id="pay-date"
                        className="mt-1"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="pay-note">Note</Label>
                      <Input
                        id="pay-note"
                        className="mt-1"
                        placeholder="Optional"
                        value={payNote}
                        onChange={(e) => setPayNote(e.target.value)}
                      />
                    </div>
                    <Button onClick={recordPayment} disabled={!payAmount} loading={updating}>
                      Record
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
