'use client'
import { forwardRef } from 'react'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/cn'

const DropdownMenu = DropdownPrimitive.Root
const DropdownMenuTrigger = DropdownPrimitive.Trigger
const DropdownMenuGroup = DropdownPrimitive.Group

const DropdownMenuContent = forwardRef(function DropdownMenuContent(
  { className, sideOffset = 4, align = 'end', ...props },
  ref
) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-40 rounded-lg border bg-surface p-1 shadow-md',
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
})

const DropdownMenuItem = forwardRef(function DropdownMenuItem(
  { className, destructive = false, ...props },
  ref
) {
  return (
    <DropdownPrimitive.Item
      ref={ref}
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-sm px-2.5 py-1.5 text-body outline-none transition-colors duration-fast data-[highlighted]:bg-surface-hover data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
        destructive ? 'text-danger data-[highlighted]:bg-danger-subtle' : 'text-primary',
        className
      )}
      {...props}
    />
  )
})

const DropdownMenuLabel = forwardRef(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Label
      ref={ref}
      className={cn('px-2.5 py-1.5 text-micro uppercase text-tertiary', className)}
      {...props}
    />
  )
})

const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Separator
      ref={ref}
      className={cn('my-1 h-px bg-subtle', className)}
      {...props}
    />
  )
})

export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuGroup,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
}
