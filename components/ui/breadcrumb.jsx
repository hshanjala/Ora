'use client'
import { forwardRef, Fragment } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

// items: [{ label, href? }] — last item is the current page.
const Breadcrumb = forwardRef(function Breadcrumb({ className, items = [], ...props }, ref) {
  return (
    <nav ref={ref} aria-label="Breadcrumb" className={className} {...props}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <Fragment key={i}>
              {i > 0 && (
                <ChevronRight size={13} strokeWidth={1.75} className="shrink-0 text-tertiary" aria-hidden="true" />
              )}
              <li className="min-w-0">
                {item.href && !last ? (
                  <Link
                    href={item.href}
                    className="text-small text-secondary transition-colors duration-fast hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? 'page' : undefined}
                    className={cn('block truncate text-small', last ? 'text-primary' : 'text-secondary')}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
})

export { Breadcrumb }
