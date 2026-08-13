// Invoice status → design-system status tone. One definition for the list,
// the detail modal, the patient drawer and the print document.
export const INVOICE_STATUS = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'danger',
}

export const INVOICE_STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
]

export const PERIOD_FILTERS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
]
