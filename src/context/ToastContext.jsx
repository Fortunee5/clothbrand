import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

const ToastContext = createContext()

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const ACCENTS = {
  success: 'border-l-green-500 text-green-600',
  error: 'border-l-red-500 text-red-500',
  info: 'border-l-[#C9A24B] text-[#C9A24B]',
}

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nodeRefs = useRef({})

  const dismiss = useCallback((id) => {
    const node = nodeRefs.current[id]
    if (node && !prefersReducedMotion) {
      gsap.to(node, {
        opacity: 0,
        x: 40,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      })
    } else {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }
  }, [])

  const toast = useCallback(
    (message, { type = 'info', duration = 3500 } = {}) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map(({ id, message, type }) => {
          const Icon = ICONS[type] || Info
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) {
                  nodeRefs.current[id] = el
                  if (!prefersReducedMotion) {
                    gsap.fromTo(
                      el,
                      { opacity: 0, y: 16, scale: 0.96 },
                      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
                    )
                  }
                }
              }}
              className={`flex items-start gap-3 rounded-lg border-l-4 bg-white p-4 shadow-xl shadow-black/10 ${ACCENTS[type] || ACCENTS.info}`}
              role="status"
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium text-gray-800">{message}</p>
              <button
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
