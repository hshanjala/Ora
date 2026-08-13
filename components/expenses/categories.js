// Expense categories and their presentation. Previously a hard-coded
// CATEGORY_COLORS map of Tailwind palette classes inside the page file; now a
// single list mapped onto the system's status/neutral tones so a re-skin
// carries the category chips with it.
export const EXPENSE_CATEGORIES = [
  'Rent', 'Salaries', 'Utilities', 'Equipment', 'Supplies',
  'Medicines', 'Lab Fees', 'Marketing', 'Maintenance', 'Other',
]

// Categories are data, not status — they get neutral chips. Colour in this
// product means state (paid/overdue/expiring), and spending a hue on
// "Utilities" would dilute that signal.
export function categoryTone() {
  return 'neutral'
}
