'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { useFormField } from './form-field'

const inputClasses =
  'w-full h-9 rounded-md border bg-surface px-3 text-body text-primary placeholder:text-placeholder transition-colors duration-fast ease-out hover:border-strong focus:border-strong disabled:opacity-50 disabled:pointer-events-none aria-[invalid=true]:border-danger'

const Input = forwardRef(function Input({ className, ...props }, ref) {
  const field = useFormField()
  return (
    <input
      ref={ref}
      className={cn(inputClasses, className)}
      {...field}
      {...props}
    />
  )
})

const Textarea = forwardRef(function Textarea({ className, rows = 3, ...props }, ref) {
  const field = useFormField()
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputClasses, 'h-auto py-2 resize-y', className)}
      {...field}
      {...props}
    />
  )
})

// Native date/time inputs, styled. (Deliberate: dentists' browsers provide
// solid pickers; a custom calendar adds risk without benefit. Values render
// in tabular figures.)
const DateInput = forwardRef(function DateInput({ className, ...props }, ref) {
  const field = useFormField()
  return (
    <input
      ref={ref}
      type="date"
      className={cn(inputClasses, 'tabular', className)}
      {...field}
      {...props}
    />
  )
})

const TimeInput = forwardRef(function TimeInput({ className, ...props }, ref) {
  const field = useFormField()
  return (
    <input
      ref={ref}
      type="time"
      className={cn(inputClasses, 'tabular', className)}
      {...field}
      {...props}
    />
  )
})

export { Input, Textarea, DateInput, TimeInput, inputClasses }
