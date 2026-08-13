'use client'
import { createContext, useContext, useId, forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Label } from './label'

const FormFieldContext = createContext(null)

// Inputs rendered inside a FormField automatically pick up id, aria-invalid
// and aria-describedby from this hook.
export function useFormField() {
  const ctx = useContext(FormFieldContext)
  if (!ctx) return {}
  const { id, error, hintId, errorId } = ctx
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : ctx.hint ? hintId : undefined,
  }
}

// The one wrapper every form uses: label + control + hint + error.
const FormField = forwardRef(function FormField(
  { className, label, hint, error, required = false, children, ...props },
  ref
) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <FormFieldContext.Provider value={{ id, hint, error, hintId, errorId }}>
      <div ref={ref} className={cn('space-y-1.5', className)} {...props}>
        {label && (
          <Label htmlFor={id}>
            {label}
            {required && (
              <span className="text-danger ml-0.5" aria-hidden="true">*</span>
            )}
          </Label>
        )}
        {children}
        {error ? (
          <p id={errorId} className="text-label text-danger">{error}</p>
        ) : hint ? (
          <p id={hintId} className="text-label text-tertiary">{hint}</p>
        ) : null}
      </div>
    </FormFieldContext.Provider>
  )
})

export { FormField }
