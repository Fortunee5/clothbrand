import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

const ConfirmContext = createContext()

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null) // { message, title, resolve }
  const cardRef = useRef(null)
  const overlayRef = useRef(null)

  const confirm = useCallback((message, { title = 'Are you sure?', danger = true } = {}) => {
    return new Promise((resolve) => {
      setState({ message, title, danger, resolve })
    })
  }, [])

  const close = (result) => {
    const done = () => {
      state?.resolve(result)
      setState(null)
    }
    if (!prefersReducedMotion && cardRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 })
      gsap.to(cardRef.current, { opacity: 0, y: 8, scale: 0.97, duration: 0.2, onComplete: done })
    } else {
      done()
    }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
          onClick={() => close(false)}
          ref={(el) => {
            overlayRef.current = el
            if (el && !prefersReducedMotion) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 })
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            ref={(el) => {
              cardRef.current = el
              if (el && !prefersReducedMotion) {
                gsap.fromTo(el, { opacity: 0, y: 12, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.6)' })
              }
            }}
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${state.danger ? 'bg-red-50 text-red-500' : 'bg-[#C9A24B]/10 text-[#C9A24B]'}`}>
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-base font-bold uppercase tracking-tight">{state.title}</h3>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-600">{state.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => close(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors ${
                  state.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0D0F1C] hover:bg-[#C9A24B]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
