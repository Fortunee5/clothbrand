import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useBfCart } from '../context/BfCartContext'

export default function BfHeader() {
  const { cart } = useBfCart()
  const count = cart.reduce((n, i) => n + i.quantity, 0)
  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b border-[#FFD400]/30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/blackfriday" className="font-black uppercase tracking-tight text-lg">
          LMSY <span className="text-[#FFD400]">Black Friday</span>
        </Link>
        <div className="flex items-center gap-5 text-[11px] font-bold uppercase tracking-widest">
          <Link to="/" className="text-white/60 hover:text-white hidden sm:block">Main store</Link>
          <Link to="/blackfriday/cart" className="relative flex items-center gap-2 bg-[#FFD400] text-black px-3 py-2 rounded-sm">
            <ShoppingBag size={14} /> Cart
            {count > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}
