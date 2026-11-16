import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Truck, MapPin, MessageCircle, ArrowRight, X } from 'lucide-react'

const WHATSAPP_DISPLAY = '08124630878'
const WHATSAPP_LINK = 'https://wa.me/2348124630878'
const naira = (n) => `₦${Number(n || 0).toLocaleString()}`

// Full-screen, mobile-first confirmation popup shown after a successful order.
// `storageKey` is where the checkout saved the order; `primary`/`secondary` are the exit links.
export default function OrderSuccessPopup({ storageKey, primary, secondary, dark = false }) {
  const [params] = useSearchParams()
  const id = params.get('id')

  const order = useMemo(() => {
    try {
      const o = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
      return o && (!id || String(o.id) === String(id)) ? o : null
    } catch { return null }
  }, [storageKey, id])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const inLagos = String(order?.state || '').trim().toLowerCase() === 'lagos'
  const eta = order ? (inLagos ? 'within 5 days' : 'within 5 – 10 days') : 'within 5 – 10 days (within 5 days in Lagos)'
  const items = order?.items || []

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Order confirmed">
      <div className="relative bg-white w-full sm:max-w-md max-h-[94dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl animate-[popIn_.35s_ease-out]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:none}}`}</style>

        <Link to={secondary.to} aria-label="Close" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center">
          <X size={18} />
        </Link>

        {/* Header */}
        <div className={`px-6 pt-8 pb-6 text-center ${dark ? 'bg-black text-white' : 'bg-[#0D0F1C] text-white'} rounded-t-3xl sm:rounded-t-2xl`}>
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-400/60 flex items-center justify-center mb-4">
            <CheckCircle2 size={34} className="text-green-400" />
          </div>
          <p className="text-[#C9A24B] text-[10px] tracking-[0.25em] uppercase font-semibold mb-1">Order Confirmed</p>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Thank you{order?.firstName ? `, ${order.firstName}` : ''}!</h1>
          {(order?.id || id) && <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 mt-2">Order #{order?.id || id}</p>}
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Delivery time */}
          <div className="flex gap-3 rounded-xl bg-green-50 border border-green-100 p-4">
            <Truck size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-green-800 mb-1">Delivery time</p>
              <p className="text-sm text-green-900 leading-relaxed">
                {order ? <>Your order will arrive <b>{eta}</b>{inLagos ? ' (Lagos)' : ` (${order.state || 'outside Lagos'})`}.</> : <>Orders arrive <b>{eta}</b>.</>}
              </p>
            </div>
          </div>

          {/* Order details */}
          {order && (
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
              {items.length > 0 && (
                <ul className="p-4 space-y-2.5">
                  {items.map((it, i) => (
                    <li key={it.key || i} className="flex justify-between gap-3">
                      <span className="min-w-0 text-gray-700">
                        <span className="font-semibold line-clamp-2">{it.name}</span>
                        <span className="block text-[11px] text-gray-400">
                          Qty {it.quantity}{it.size ? ` · Size ${it.size}` : ''}{it.color ? ` · ${it.color}` : ''}
                        </span>
                      </span>
                      <span className="font-semibold shrink-0">{naira(parseFloat(it.price) * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="p-4 space-y-1.5">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{naira(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Delivery</span><span>{Number(order.deliveryFee) ? naira(order.deliveryFee) : 'To be confirmed'}</span></div>
                <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{naira(order.total)}</span></div>
              </div>
              <div className="p-4 flex gap-3">
                <MapPin size={16} className="text-[#C9A24B] shrink-0 mt-0.5" />
                <p className="text-gray-600 leading-relaxed break-words">
                  {[order.firstName, order.lastName].filter(Boolean).join(' ')}<br />
                  {order.address}{order.city ? `, ${order.city}` : ''}<br />
                  {order.phone}
                </p>
              </div>
            </div>
          )}

          {/* Tracking */}
          <div className="flex gap-3 rounded-xl bg-[#F7F5F0] p-4">
            <MessageCircle size={20} className="text-[#25D366] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1">Track your order</p>
              <p className="text-xs text-gray-600 leading-relaxed">To track your product, reach out to us on WhatsApp:</p>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2.5 rounded-full active:scale-95 transition">
                <MessageCircle size={16} /> {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 pt-1">
            <Link to={primary.to} className="inline-flex items-center justify-center gap-2 bg-[#0D0F1C] text-white py-4 text-[11px] font-bold uppercase tracking-[0.18em] rounded-full active:scale-[0.98] transition">
              {primary.label} <ArrowRight size={14} />
            </Link>
            <Link to={secondary.to} className="inline-flex items-center justify-center border border-gray-200 text-gray-600 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] rounded-full active:scale-[0.98] transition">
              {secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
