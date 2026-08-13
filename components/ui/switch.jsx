'use client'
import { forwardRef } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/cn'

const Switch = forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'inline-flex h-5 w-8 shrink-0 items-center rounded-full border border-transparent bg-strong transition-colors duration-base ease-out disabled:opacity-50 disabled:pointer-events-none data-[state=checked]:bg-accent',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-surface shadow-xs transition-transform duration-base ease-out data-[state=checked]:translate-x-3.5 motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  )
})

export { Switch }
