'use client'
import { forwardRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './button'

// Radix Dialog: focus trap, scroll lock, ESC, aria-modal — all built in.
const Modal = DialogPrimitive.Root
const ModalTrigger = DialogPrimitive.Trigger
const ModalClose = DialogPrimitive.Close

const ModalOverlay = forwardRef(function ModalOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-overlay animate-overlay-in', className)}
      {...props}
    />
  )
})

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
}

const ModalContent = forwardRef(function ModalContent(
  { className, children, size = 'md', ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-4 z-50 m-auto flex h-fit max-h-full w-auto flex-col rounded-xl border bg-surface shadow-lg focus:outline-none animate-modal-in',
          SIZES[size],
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

function ModalHeader({ className, title, subtitle, hideClose = false, children, ...props }) {
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

function ModalBody({ className, ...props }) {
  return <div className={cn('overflow-y-auto px-5 py-4', className)} {...props} />
}

function ModalFooter({ className, ...props }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 border-t px-5 py-3', className)} {...props} />
  )
}

export {
  Modal, ModalTrigger, ModalClose, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter,
}
