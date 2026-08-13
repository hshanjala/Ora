'use client'
import { forwardRef } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

const Checkbox = forwardRef(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border border-strong bg-surface transition-colors duration-fast ease-out hover:border-strong disabled:opacity-50 disabled:pointer-events-none data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-inverse',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check size={12} strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})

export { Checkbox }
