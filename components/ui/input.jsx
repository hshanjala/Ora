'use client'
import { forwardRef, useRef, useCallback } from 'react'
import { Calendar, Clock } from 'lucide-react'
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

const DateInput = forwardRef(function DateInput({ className, onChange, value, ...props }, ref) {
  const field = useFormField()
  const pickerRef = useRef(null)

  const openPicker = useCallback(() => {
    pickerRef.current?.showPicker?.()
  }, [])

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        value={value || ''}
        onChange={onChange}
        className={cn(inputClasses, 'tabular pr-9', className)}
        {...field}
        {...props}
      />
      <input
        ref={pickerRef}
        type="date"
        value={value || ''}
        onChange={onChange}
        className="invisible absolute inset-0 h-0 w-0"
        tabIndex={-1}
        aria-hidden="true"
        {...(props.name ? { name: undefined } : {})}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-tertiary hover:text-primary"
        tabIndex={-1}
        aria-label="Open date picker"
      >
        <Calendar size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
})

const TimeInput = forwardRef(function TimeInput({ className, onChange, value, ...props }, ref) {
  const field = useFormField()
  const pickerRef = useRef(null)

  const openPicker = useCallback(() => {
    pickerRef.current?.showPicker?.()
  }, [])

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="HH:MM"
        pattern="\d{2}:\d{2}"
        value={value || ''}
        onChange={onChange}
        className={cn(inputClasses, 'tabular pr-9', className)}
        {...field}
        {...props}
      />
      <input
        ref={pickerRef}
        type="time"
        value={value || ''}
        onChange={onChange}
        className="invisible absolute inset-0 h-0 w-0"
        tabIndex={-1}
        aria-hidden="true"
        {...(props.name ? { name: undefined } : {})}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-tertiary hover:text-primary"
        tabIndex={-1}
        aria-label="Open time picker"
      >
        <Clock size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
})

export { Input, Textarea, DateInput, TimeInput, inputClasses }
