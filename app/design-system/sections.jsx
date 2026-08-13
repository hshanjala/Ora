'use client'
// Presentational scaffolding for the styleguide itself.
import { cn } from '@/lib/cn'
import { Card, Eyebrow } from '@/components/ui'

export function Section({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 border-b pb-3">
        <h2 className="text-h1 text-primary">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-small text-secondary">{description}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

export function Subsection({ title, rule, children }) {
  return (
    <div>
      {title && (
        <div className="mb-2.5">
          <h3 className="text-h3 text-primary">{title}</h3>
          {rule && <p className="mt-0.5 max-w-2xl text-small text-secondary">{rule}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

/** A component shown with its usage note. */
export function Specimen({ label, note, className, children }) {
  return (
    <div>
      {label && <Eyebrow className="mb-1.5">{label}</Eyebrow>}
      <Card className={cn('flex flex-wrap items-center gap-3 p-4', className)}>
        {children}
      </Card>
      {note && <p className="mt-1.5 text-label text-tertiary">{note}</p>}
    </div>
  )
}

/** Colour swatch — the chip renders from the live CSS variable. */
export function Swatch({ token, util, value, use }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* design-lint-allow-inline-style: swatch reads the live token variable */}
      <span
        className="h-9 w-9 shrink-0 rounded-md border"
        style={{ background: `var(${token.replace('-*', '-fg')})` }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-label text-primary">{token}</p>
        <p className="text-label text-tertiary">{util}</p>
      </div>
      <div className="hidden min-w-0 flex-1 sm:block">
        <p className="tabular text-label text-secondary">{value}</p>
      </div>
      <div className="hidden min-w-0 flex-[1.5] md:block">
        <p className="text-label text-tertiary">{use}</p>
      </div>
    </div>
  )
}
