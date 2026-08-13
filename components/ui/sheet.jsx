'use client'
import { forwardRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './button'
import { ModalOverlay } from './modal'

// Drawer: side panel on desktop, bottom sheet on mobile (side="responsive").
const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const SIDE = {
  right:
    'inset-y-0 right-0 h-full w-full max-w-md border-l animate-sheet-in-right',
  bottom:
    'inset-x-0 bottom-0 max-h-sheet w-full rounded-t-xl border-t animate-sheet-in-bottom pb-safe',
  // bottom sheet under md, right drawer from md up
  responsive:
    'inset-x-0 bottom-0 max-h-sheet w-full rounded-t-xl border-t animate-sheet-in-bottom pb-safe md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:max-h-full md:w-full md:max-w-md md:rounded-none md:border-l md:border-t-0 md:animate-sheet-in-right',
}

const SheetContent = forwardRef(function SheetContent(
  { className, children, side = 'responsive', ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col bg-surface shadow-lg focus:outline-none',
          SIDE[side],
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

function SheetHeader({ className, title, subtitle, hideClose = false, children, ...props }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b px-5 py-4', className)} {...props}>
      <div className="min-w-0">
        {title && (
          <DialogPrimitive.Title className="text-h2 text-primary">{title}</DialogPrimitive.Title>
        )}
        {subtitle && (
          <DialogPrimitive.Description className="mt-0.5 text-small text-secondary">
            {subtitle}
          </DialogPrimitive.Description>
        )}
        {children}
      </div>
      {!hideClose && (
        <DialogPrimitive.Close asChild>
          <IconButton aria-label="Close" size="sm" className="-mr-1 -mt-1 shrink-0">
            <X size={16} strokeWidth={1.75} />
          </IconButton>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function SheetBody({ className, ...props }) {
  return <div className={cn('flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
}

function SheetFooter({ className, ...props }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 border-t px-5 py-3', className)} {...props} />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetBody, SheetFooter }
