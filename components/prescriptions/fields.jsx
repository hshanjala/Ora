'use client'
// Prescription form internals. These were previously declared twice —
// once in AddPrescriptionModal and again, verbatim, inside QuickAddFlow
// (~250 duplicated lines). One definition now serves both.
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  Button, IconButton, Input, Combobox, Label,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui'

export const CC_OPTIONS    = ['C/C', 'P/C', 'Hx', 'Complaint', 'Chief Complaint']
export const OE_OPTIONS    = ['O/E', 'Dx', 'Findings', 'Ix', 'On Examination']
export const ADV_OPTIONS   = ['Adv', 'Rx Note', 'Follow-up', 'Instructions', 'Plan']
export const EXTRA_OPTIONS = ['BP', 'Weight', 'Temperature', 'Sugar Level', 'SpO2', 'Pulse', 'Referral', 'Investigation', 'Diet', 'Next Visit']
export const FREQ_OPTIONS  = ['1+1+1', '1+0+1', '1+0+0', '0+1+0', '0+0+1', '1+1+0']
export const DUR_OPTIONS   = ['3 days', '5 days', '7 days', '1 month']
export const INSTR_OPTIONS = ['After meal', 'Before meal', 'Empty stomach']

/** Relabel a section (C/C → P/C, etc.). Now a real keyboard-navigable menu. */
export function LabelDropdown({ label, options, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 items-center gap-1 rounded-sm bg-surface-hover px-2 text-label text-primary transition-colors duration-fast hover:bg-surface-active"
        >
          {label}
          <ChevronDown size={11} strokeWidth={2} className="text-secondary" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36">
        {options.map(opt => (
          <DropdownMenuItem
            key={opt}
            onSelect={() => onChange(opt)}
            className={cn(opt === label && 'bg-accent-subtle text-accent-text')}
          >
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Free-text field with suggestions (frequency, duration, instructions).
 * Replaces the old hover-to-open dropdown, which was unreachable by keyboard
 * and opened on mouse-over — now a standard combobox that accepts any value.
 */
export function SuggestInput({ value, onChange, options, placeholder }) {
  return (
    <Combobox
      items={options.map(o => ({ value: o, label: o }))}
      query={value}
      onQueryChange={onChange}
      onSelect={(item) => onChange(item.label)}
      placeholder={placeholder}
      emptyText="Type your own"
    />
  )
}

/** Medicine name with server-backed autocomplete (/api/medicines). */
export function MedicineInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([])
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/medicines?q=${encodeURIComponent(value)}`)
        .then(r => r.json())
        .then(results => setSuggestions(Array.isArray(results) ? results : []))
        .catch(() => {})
    }, 180)
    return () => clearTimeout(debounceRef.current)
  }, [value])

  return (
    <Combobox
      items={suggestions.map(m => ({ value: m, label: m }))}
      query={value}
      onQueryChange={onChange}
      onSelect={(item) => onChange(item.label)}
      placeholder="Type medicine name…"
      emptyText={value.length < 2 ? 'Keep typing to search…' : 'No match — your text is kept'}
    />
  )
}

export function MedicineRow({ med, index, onChange, onRemove, disableRemove }) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-label text-secondary">Medicine {index + 1}</span>
        <IconButton
          aria-label={`Remove medicine ${index + 1}`}
          size="sm"
          onClick={() => onRemove(index)}
          disabled={disableRemove}
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </IconButton>
      </div>
      <MedicineInput value={med.medicine} onChange={val => onChange(index, 'medicine', val)} />
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SuggestInput
          value={med.frequency}
          options={FREQ_OPTIONS}
          onChange={val => onChange(index, 'frequency', val)}
          placeholder="Frequency"
        />
        <SuggestInput
          value={med.duration}
          options={DUR_OPTIONS}
          onChange={val => onChange(index, 'duration', val)}
          placeholder="Duration"
        />
        <SuggestInput
          value={med.instructions}
          options={INSTR_OPTIONS}
          onChange={val => onChange(index, 'instructions', val)}
          placeholder="Instructions"
        />
      </div>
    </div>
  )
}

export function AddFieldButton({ onAdd, existingLabels }) {
  const available = EXTRA_OPTIONS.filter(o => !existingLabels.includes(o))
  if (available.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Plus size={14} strokeWidth={1.75} /> Add field
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {available.map(opt => (
          <DropdownMenuItem key={opt} onSelect={() => onAdd(opt)}>{opt}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ExtraFieldRow({ field, onChange, onRemove }) {
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Label htmlFor={`extra-${field.id}`}>{field.label}</Label>
        <Input
          id={`extra-${field.id}`}
          className="mt-1"
          placeholder={`Enter ${field.label}…`}
          value={field.value}
          onChange={e => onChange(field.id, e.target.value)}
        />
      </div>
      <IconButton aria-label={`Remove ${field.label}`} onClick={() => onRemove(field.id)}>
        <X size={14} strokeWidth={1.75} />
      </IconButton>
    </div>
  )
}
