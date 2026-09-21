import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Package, Mail } from 'lucide-react'
import { useRef } from 'react'
import useGsapContext from '../hooks/useGsapContext'
import { gsap, EASE } from '../lib/gsap'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const rootRef = useRef(null)

  useGsapContext(() => {
    const tl = gsap.timeline({ defaults: { ease: EASE } })
    tl.fromTo('.success-icon', { scale: 0, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.2)' })
      .fromTo('.success-text', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, '-=0.2')
      .fromTo('.success-card', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, '-=0.2')
      .fromTo('.success-cta', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }, '-=0.15')
  }, [], rootRef)

  return (
    <div ref={rootRef} className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className="success-icon inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 mb-8">
          <CheckCircle2 size={38} className="text-green-500" />
        </div>

        {/* Heading */}
        <p className="success-text text-[#C9A24B] text-[10px] tracking-[0.25em] uppercase font-semibold mb-3">Order Confirmed</p>
        <h1 className="success-text text-3xl sm:text-4xl font-bold uppercase tracking-[-0.02em] mb-4">Thank you!</h1>
        <p className="success-text text-gray-500 text-sm sm:text-base leading-relaxed mb-2">
          Your order has been received and is being processed.
        </p>
        {id && (
          <p className="success-text text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-8">
            Order #{id}
          </p>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 text-left">
          <div className="success-card bg-[#F7F5F0] rounded p-4 flex gap-3">
            <Mail size={16} className="text-[#C9A24B] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1">Confirmation</p>
              <p className="text-xs text-gray-500 leading-relaxed">A confirmation email will be sent to you shortly.</p>
            </div>
          </div>
          <div className="success-card bg-[#F7F5F0] rounded p-4 flex gap-3">
            <Package size={16} className="text-[#C9A24B] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1">Delivery</p>
              <p className="text-xs text-gray-500 leading-relaxed">Your order will be dispatched within 1–2 business days.</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="success-cta inline-flex items-center justify-center gap-2 bg-[#0D0F1C] text-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-[#C9A24B] active:scale-[0.97] transition-all"
          >
            Continue Shopping <ArrowRight size={14} />
          </Link>
          <Link
            to="/shop"
            className="success-cta inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] hover:border-black hover:text-black active:scale-[0.97] transition-all"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    </div>
  )
}
