'use client'
import { forwardRef, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

/**
 * Dropzone: click or drag a file. Keyboard accessible (it's a button).
 *
 * <FileUpload accept="image/*" onFile={(file) => …} loading={uploading}
 *             label="Upload X-ray" hint="JPG or PNG" />
 */
const FileUpload = forwardRef(function FileUpload(
  { className, accept, onFile, loading = false, disabled = false, label = 'Upload a file', hint, compact = false, children, ...props },
  ref
) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files) {
    const file = files?.[0]
    if (file) onFile?.(file)
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-strong bg-surface text-center transition-colors duration-fast ease-out hover:border-strong hover:bg-surface-subtle disabled:opacity-50 disabled:pointer-events-none',
          dragging && 'border-accent bg-accent-subtle',
          compact ? 'px-3 py-3' : 'px-4 py-6',
          className
        )}
        {...props}
      >
        {children}
        {loading ? (
          <Spinner size={16} className="text-accent-text" />
        ) : (
          <Upload size={16} strokeWidth={1.75} className="text-tertiary" aria-hidden="true" />
        )}
        <span className="text-small text-secondary">{loading ? 'Uploading…' : label}</span>
        {hint && !loading && <span className="text-micro text-tertiary">{hint}</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </>
  )
})

export { FileUpload }
