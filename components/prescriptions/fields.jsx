'use client'
// Prescription form internals. These were previously declared twice —
// once in AddPrescriptionModal and again, verbatim, inside QuickAddFlow
// (~250 duplicated lines). One definition now serves both.
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  IconButton, Input, Textarea, Combobox, Label,
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

/**
 * Add-field trigger, styled as a dashed tile so it can sit in the column
 * beside the advice box and fill it. `className` carries the flex sizing from
 * ClinicalNotes: on its own it stretches to match the advice box, and once
 * extra fields stack above it, it collapses to a normal button height.
 */
export function AddFieldButton({ onAdd, existingLabels, className }) {
  const available = EXTRA_OPTIONS.filter(o => !existingLabels.includes(o))
  if (available.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-dashed text-small font-medium text-secondary transition-colors duration-fast ease-out hover:border-strong hover:bg-surface-hover hover:text-primary',
            className
          )}
        >
          <Plus size={14} strokeWidth={1.75} /> Add field
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {available.map(opt => (
          <DropdownMenuItem key={opt} onSelect={() => onAdd(opt)}>{opt}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * One relabelable note: the dropdown chip sits in a fixed-height row above its
 * textarea. The fixed height is the point — the chips were previously laid out
 * by whatever happened to share their row, so the "Adv" chip (which sat beside
 * the Add field button) pushed its textarea lower than the other two.
 */
function NoteField({ label, options, onLabelChange, ...textareaProps }) {
  return (
    <div>
      <div className="mb-1.5 flex h-6 items-center">
        <LabelDropdown label={label} options={options} onChange={onLabelChange} />
      </div>
      {/* One row rather than two: these notes are usually a short phrase, and
          the box stays drag-resizable for the times they are not.
          `block` drops the inline descender gap that otherwise left this cell
          taller than its neighbours, and `py-1.5` lands the box on exactly 36px
          — the height of the Input an added field uses, so the two match when
          they sit side by side. */}
      <Textarea rows={1} aria-label={label} className="block py-1.5" {...textareaProps} />
    </div>
  )
}

/**
 * The clinical notes block — complaint, examination, advice, plus whatever
 * extra fields the doctor adds. Shared by the prescription modal and the
 * quick-add wizard, which previously kept identical copies of this markup.
 *
 * Grouped in one bordered box so the chips read as labels of a section rather
 * than as three loose controls, and Add field moved to the foot of that box:
 * it creates the rows underneath it, so that is where it belongs.
 */
export function ClinicalNotes({
  ccLabel, oeLabel, advLabel,
  onCcLabelChange, onOeLabelChange, onAdvLabelChange,
  form, onFormChange,
  extraFields, onAddField, onUpdateField, onRemoveField,
}) {
  const canAddField = EXTRA_OPTIONS.some(o => !extraFields.some(f => f.label === o))

  return (
    <div className="rounded-md border p-3">
      {/* Every field — the three notes and any extra ones — is a cell of one
          grid, which is what keeps them aligned. Laying the extra fields out
          in their own container beside advice could only ever approximate the
          column widths and row heights of the notes above them. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <NoteField
          label={ccLabel}
          options={CC_OPTIONS}
          onLabelChange={onCcLabelChange}
          name="chief_complaint"
          placeholder="Chief complaint…"
          value={form.chief_complaint}
          onChange={onFormChange}
        />
        <NoteField
          label={oeLabel}
          options={OE_OPTIONS}
          onLabelChange={onOeLabelChange}
          name="on_examination"
          placeholder="Examination findings…"
          value={form.on_examination}
          onChange={onFormChange}
        />
        <NoteField
          label={advLabel}
          options={ADV_OPTIONS}
          onLabelChange={onAdvLabelChange}
          name="advice"
          placeholder="Advice given to patient…"
          value={form.advice}
          onChange={onFormChange}
        />
        {extraFields.map(field => (
          <ExtraFieldRow
            key={field.id}
            field={field}
            onChange={onUpdateField}
            onRemove={onRemoveField}
          />
        ))}
      </div>

      {/* Full width under the grid: it adds to whichever cell comes next, not
          to one column. */}
      {canAddField && (
        <AddFieldButton
          className="mt-3"
          onAdd={onAddField}
          existingLabels={extraFields.map(f => f.label)}
        />
      )}
    </div>
  )
}

/**
 * An added field, shaped as a copy of NoteField so the two line up when they
 * share a grid: same h-6 header row, and the input spans the full cell. The
 * remove button sits in the header rather than beside the input, which is what
 * used to make these inputs narrower than the note boxes above them.
 */
export function ExtraFieldRow({ field, onChange, onRemove }) {
  return (
    <div>
      <div className="mb-1.5 flex h-6 items-center justify-between gap-2">
        <Label htmlFor={`extra-${field.id}`} className="truncate">{field.label}</Label>
        <IconButton
          aria-label={`Remove ${field.label}`}
          className="h-6 w-6 shrink-0"
          onClick={() => onRemove(field.id)}
        >
          <X size={13} strokeWidth={1.75} />
        </IconButton>
      </div>
      <Input
        id={`extra-${field.id}`}
        placeholder={`Enter ${field.label}…`}
        value={field.value}
        onChange={e => onChange(field.id, e.target.value)}
      />
    </div>
  )
}
