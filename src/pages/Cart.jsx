import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import LazyImage from '../components/LazyImage'
import useGsapContext from '../hooks/useGsapContext'
import { gsap, EASE } from '../lib/gsap'
import { useRef } from 'react'

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total } = useCart()
  const navigate = useNavigate()
  const listRef = useRef(null)

  useGsapContext(() => {
    if (!listRef.current) return
    gsap.fromTo(
      listRef.current.children,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: EASE }
    )
  }, [cart.length], listRef)

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <ShoppingBag size={28} className="text-gray-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[-0.01em] mb-3">Your bag is empty</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">You haven't added anything yet. Discover pieces you'll love.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-[#0D0F1C] text-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-[#C9A24B] active:scale-[0.97] transition-all"
        >
          Start Shopping <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-[#F7F5F0] pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-[-0.02em]">Your Bag</h1>
          <p className="text-gray-500 text-sm mt-1">{cart.reduce((s, i) => s + i.quantity, 0)} items</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

          {/* Items */}
          <div ref={listRef} className="lg:col-span-2 space-y-0 divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.key} className="flex gap-4 sm:gap-6 py-6 first:pt-0">
                <Link to={`/product/${item.id}`} className="shrink-0 block">
                  <div className="w-20 sm:w-24 aspect-[3/4] overflow-hidden">
                    <LazyImage src={item.image} alt={item.name} className="h-full w-full" imgClassName="hover:scale-105 transition-transform duration-500" eager />
                  </div>
                </Link>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold uppercase tracking-wide text-sm leading-tight line-clamp-2">{item.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mt-1">{item.category}{item.size ? ` · Size ${item.size}` : ''}</p>
                    </div>
                    <button
                      aria-label="Remove item"
                      onClick={() => removeFromCart(item.key)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors -mt-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-3">
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        aria-label="Decrease"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        aria-label="Increase"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-bold text-sm">₦{(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-[#F7F5F0] p-6 sm:p-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-gray-500 text-xs font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold uppercase tracking-wide text-sm">Total</span>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 mr-1">NGN</span>
                    <span className="text-2xl font-bold">₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#0D0F1C] text-white py-4 font-bold uppercase tracking-[0.14em] text-[11px] flex items-center justify-center gap-3 hover:bg-[#C9A24B] active:scale-[0.98] transition-all duration-300"
              >
                Checkout <ArrowRight size={15} />
              </button>

              <Link
                to="/shop"
                className="block text-center text-[10px] uppercase tracking-[0.14em] text-gray-400 hover:text-black transition-colors mt-4 font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
