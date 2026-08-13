'use client'
import { forwardRef, useState } from 'react'
import { cn } from '@/lib/cn'

function initialsOf(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const SIZES = {
  sm: 'h-7 w-7 text-micro',
  md: 'h-9 w-9 text-label',
  lg: 'h-12 w-12 text-body-md',
}

const Avatar = forwardRef(function Avatar(
  { className, name, src, size = 'md', ...props },
  ref
) {
  const [broken, setBroken] = useState(false)
  const showImage = src && !broken
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-accent-subtle font-medium text-accent-text',
        SIZES[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  )
})

const AvatarGroup = forwardRef(function AvatarGroup(
  { className, children, max = 4, size = 'md', total, ...props },
  ref
) {
  const items = Array.isArray(children) ? children.flat() : [children]
  const visible = items.slice(0, max)
  const overflow = (total ?? items.length) - visible.length
  return (
    <span ref={ref} className={cn('flex -space-x-2', className)} {...props}>
      {visible.map((child, i) => (
        <span key={i} className="rounded-full ring-2 ring-surface">
          {child}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-full ring-2 ring-surface">
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full bg-surface-hover font-medium text-secondary',
              SIZES[size]
            )}
          >
            +{overflow}
          </span>
        </span>
      )}
    </span>
  )
})

export { Avatar, AvatarGroup }
