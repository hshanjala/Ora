'use client'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
}

const ICON_COLOR = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
}

/**
 * App-wide toasts. Wrap the shell once:
 *   <ToastProvider>…</ToastProvider>
 * then anywhere below:
 *   const toast = useToast()
 *   toast.success('Invoice saved')
 *   toast.error('Could not save', 'Check your connection and retry.')
 */
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (variant, title, description, { duration = 4000 } = {}) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-3), { id, variant, title, description }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const api = {
    success: (t, d, o) => push('success', t, d, o),
    error: (t, d, o) => push('danger', t, d, o),
    warning: (t, d, o) => push('warning', t, d, o),
    info: (t, d, o) => push('info', t, d, o),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Viewport */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 pb-safe"
      >
        {toasts.map(({ id, variant, title, description }) => {
          const Icon = ICONS[variant] || Info
          return (
            <div
              key={id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-surface p-3.5 shadow-md animate-modal-in"
            >
              <Icon size={16} strokeWidth={1.75} className={cn('mt-0.5 shrink-0', ICON_COLOR[variant])} />
              <div className="min-w-0 flex-1">
                <p className="text-body-md text-primary">{title}</p>
                {description && (
                  <p className="mt-0.5 text-small text-secondary">{description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                className="shrink-0 rounded-sm p-0.5 text-tertiary transition-colors duration-fast hover:text-primary"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export { ToastProvider, useToast }
