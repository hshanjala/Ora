'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose,
  Button, FormField, Input, DateInput, Alert,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from '@/components/ui'
import { EXPENSE_CATEGORIES } from '@/components/expenses/categories'

export default function AddExpenseModal({ onClose, onSuccess }) {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('expenses').insert({
      clinic_id: user.id,
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount),
      date: form.date,
    })

    if (error) {
      setError('Failed to add expense.')
      setLoading(false)
      return
    }

    toast.success('Expense added', `${form.category} · ৳${Number(form.amount).toLocaleString()}`)
    onSuccess()
    onClose()
  }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent size="sm">
        <ModalHeader title="Add expense" />
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-4">
            {error && <Alert status="danger">{error}</Alert>}

            <FormField label="Category" required>
              <Select
                value={form.category || undefined}
                onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Description">
              <Input
                name="description"
                placeholder="Brief description of expense"
                value={form.description}
                onChange={handleChange}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Amount (৳)" required>
                <Input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  className="tabular"
                  required
                />
              </FormField>
              <FormField label="Date" required>
                <DateInput name="date" value={form.date} onChange={handleChange} required />
              </FormField>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </ModalClose>
            <Button type="submit" loading={loading}>
              {loading ? 'Saving…' : 'Add expense'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
