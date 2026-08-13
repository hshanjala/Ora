'use client'
import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClasses } from './input'

const SearchInput = forwardRef(function SearchInput(
  { className, value, onChange, onClear, placeholder = 'Search…', ...props },
  ref
) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={15}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
      />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(inputClasses, 'pl-9', value && onClear && 'pr-8')}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-tertiary transition-colors duration-fast hover:text-primary"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
})

export { SearchInput }
