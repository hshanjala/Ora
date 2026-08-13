'use client'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClasses } from './input'
import { useFormField } from './form-field'

/**
 * Searchable select: type to filter, arrow keys to navigate, Enter to pick.
 * Follows the WAI-ARIA combobox pattern (input + listbox popup).
 *
 * Props:
 *   items          [{ value, label }]
 *   query          controlled input text
 *   onQueryChange  (text) => void
 *   onSelect       (item) => void
 *   onCreate       optional (query) => void — shows a "create" row when the
 *                  typed text matches no item exactly
 *   createLabel    optional (query) => node for the create row
 *   emptyText      shown when there are no matches and no onCreate
 */
const Combobox = forwardRef(function Combobox(
  {
    className,
    items = [],
    query = '',
    onQueryChange,
    onSelect,
    onCreate,
    createLabel = (q) => `Add “${q}”`,
    emptyText = 'No matches',
    placeholder,
    disabled,
    ...props
  },
  ref
) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef(null)
  const listId = useId()
  const field = useFormField()

  const filtered = items.filter((it) =>
    it.label.toLowerCase().includes(query.toLowerCase())
  )
  const hasExact = items.some(
    (it) => it.label.toLowerCase() === query.trim().toLowerCase()
  )
  const showCreate = Boolean(onCreate) && query.trim() && !hasExact
  const optionCount = filtered.length + (showCreate ? 1 : 0)

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(index) {
    if (index < filtered.length) {
      onSelect?.(filtered[index])
    } else if (showCreate) {
      onCreate?.(query.trim())
    }
    setOpen(false)
    setActiveIndex(-1)
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      setActiveIndex(0)
      e.preventDefault()
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      setActiveIndex((i) => (i + 1) % Math.max(optionCount, 1))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setActiveIndex((i) => (i - 1 + optionCount) % Math.max(optionCount, 1))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < optionCount) {
        pick(activeIndex)
        e.preventDefault()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input
        ref={ref}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
        }
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          onQueryChange?.(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={inputClasses}
        {...field}
        {...props}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-surface p-1 shadow-md"
        >
          {filtered.map((it, i) => (
            <li
              key={it.value}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => { e.preventDefault(); pick(i) }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                'cursor-default rounded-sm px-2.5 py-1.5 text-body text-primary transition-colors duration-fast',
                i === activeIndex && 'bg-surface-hover'
              )}
            >
              {it.label}
            </li>
          ))}
          {showCreate && (
            <li
              id={`${listId}-opt-${filtered.length}`}
              role="option"
              aria-selected={activeIndex === filtered.length}
              onMouseDown={(e) => { e.preventDefault(); pick(filtered.length) }}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              className={cn(
                'cursor-default rounded-sm px-2.5 py-1.5 text-body-md text-accent-text transition-colors duration-fast',
                filtered.length > 0 && 'border-t',
                activeIndex === filtered.length && 'bg-accent-subtle'
              )}
            >
              {createLabel(query.trim())}
            </li>
          )}
          {filtered.length === 0 && !showCreate && (
            <li className="px-2.5 py-2 text-small text-tertiary">{emptyText}</li>
          )}
        </ul>
      )}
    </div>
  )
})

export { Combobox }
