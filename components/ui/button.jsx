'use client'
import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

const buttonVariants = cva(
  // Base: every interactive state defined. Hover is a background shift, never
  // a transform. Focus ring comes from the global :focus-visible rule.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-fast ease-out select-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-inverse hover:bg-accent-hover active:bg-accent-hover',
        secondary:
          'bg-surface text-primary border hover:bg-surface-hover active:bg-surface-active',
        ghost:
          'text-secondary hover:bg-surface-hover hover:text-primary active:bg-surface-active',
        danger:
          'bg-danger text-inverse hover:opacity-90 active:opacity-80',
        link:
          'text-accent-text underline-offset-4 hover:underline h-auto px-0',
      },
      size: {
        sm: 'h-8 px-3 text-small',
        md: 'h-9 px-3.5 text-body-md',
        lg: 'h-10 px-4 text-body-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

const Button = forwardRef(function Button(
  { className, variant, size, loading = false, disabled, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Spinner size={14} className="shrink-0" />}
      {children}
    </button>
  )
})

// Icon-only button. Requires aria-label.
const IconButton = forwardRef(function IconButton(
  { className, variant = 'ghost', size = 'md', 'aria-label': ariaLabel, children, ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      variant={variant}
      aria-label={ariaLabel}
      className={cn(
        'p-0',
        size === 'sm' && 'h-7 w-7',
        size === 'md' && 'h-8 w-8',
        size === 'lg' && 'h-9 w-9',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
})

export { Button, IconButton, buttonVariants }
