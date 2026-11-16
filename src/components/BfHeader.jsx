import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBfCart } from '../context/BfCartContext'

export default function BfHeader() {
  const { cart } = useBfCart()
  const count = cart.reduce((n, i) => n + i.quantity, 0)
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const urlQ = new URLSearchParams(search).get('q') || ''
  const [open, setOpen] = useState(!!urlQ)
  const [text, setText] = useState(urlQ)
  const inputRef = useRef(null)
  const onDeals = pathname === '/blackfriday'

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])
  useEffect(() => { setText(urlQ) }, [urlQ])

  const go = (v, replace) => {
    const q = v.trim()
    navigate(q ? `/blackfriday?q=${encodeURIComponent(q)}` : '/blackfriday', { replace })
  }
  const onChange = (e) => { setText(e.target.value); if (onDeals) go(e.target.value, true) } // live filter on the deals page
  const onSubmit = (e) => { e.preventDefault(); go(text, false); inputRef.current?.blur() }
  const close = () => { setOpen(false); setText(''); if (urlQ) go('', true) }

  return (
    <header className="sticky top-0 z-40 bg-black text-white border-b border-[#FFD400]/30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/blackfriday" className="font-black uppercase tracking-tight text-base sm:text-lg whitespace-nowrap">
          LMSY <span className="text-[#FFD400]">Black Friday</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] font-bold uppercase tracking-widest">
          <Link to="/" className="text-white/60 hover:text-white hidden sm:block">Main store</Link>
          <button
            onClick={() => (open ? close() : setOpen(true))}
            aria-label={open ? 'Close search' : 'Search deals'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:border-[#FFD400] active:scale-90 transition"
          >
            {open ? <X size={18} /> : <Search size={18} />}
          </button>
          <Link to="/blackfriday/cart" aria-label={`Cart (${count} items)`} className="relative flex items-center gap-2 bg-[#FFD400] text-black px-3 h-10 rounded-sm">
            <ShoppingBag size={15} /> <span>Cart</span>
            {count > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}
          </Link>
        </div>
      </div>
      {open && (
        <form onSubmit={onSubmit} className="border-t border-white/10 bg-black">
          <div className="max-w-6xl mx-auto px-4 py-3 relative">
            <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={text}
              onChange={onChange}
              placeholder="Search deals..."
              aria-label="Search deals"
              className="w-full bg-[#111] border border-white/15 focus:border-[#FFD400] text-white placeholder-white/40 pl-10 pr-4 py-3 text-base outline-none"
            />
          </div>
        </form>
      )}
    </header>
  )
}
