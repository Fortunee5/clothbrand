import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBfProducts, startBfProducts } from '../lib/bfApi'
import { useBfCart } from '../context/BfCartContext'
import { useToast } from '../context/ToastContext'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import LazyImage from '../components/LazyImage'

// Black Friday 2026 = Fri 27 Nov. Sale ends at midnight that night.
const SALE_END = new Date('2026-11-28T00:00:00').getTime()
const naira = (n) => `₦${Number(n).toLocaleString()}`


// Optional: put a real photo in /public (e.g. /public/bf-hero.jpg) and set this to '/bf-hero.jpg'.
const HERO_PHOTO = ''

const GARMENTS = [
  'M30 0 L50 12 L70 0 L100 18 L88 40 L74 34 L74 120 L26 120 L26 34 L12 40 L0 18 Z',          // shirt
  'M35 0 L50 10 L65 0 L72 40 L60 55 L95 130 L5 130 L40 55 L28 40 Z',                          // dress
  'M20 0 L80 0 L84 130 L56 130 L50 40 L44 130 L16 130 Z',                                     // trousers
  'M32 0 L50 10 L68 0 L100 30 L90 52 L76 44 L76 110 L24 110 L24 44 L10 52 L0 30 Z',          // jacket
]

function ClothesRail() {
  const items = Array.from({ length: 9 }, (_, i) => i)
  return (
    <svg aria-hidden className="absolute inset-0 w-full h-full" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMin slice">
      <line x1="0" y1="46" x2="1200" y2="46" stroke="#FFD400" strokeOpacity=".5" strokeWidth="3" />
      {items.map((i) => {
        const hot = i % 3 === 0
        return (
          <g key={i} className="bf-sway" style={{ animationDelay: `${i * -0.7}s`, animationDuration: `${4 + (i % 3)}s` }} transform={`translate(${30 + i * 140} 46)`}>
            <path d="M50 0 L50 -2 M50 0 L50 14 M50 14 L18 34 L82 34 Z" stroke="#FFD400" strokeOpacity=".55" strokeWidth="2" fill="none" />
            <path d={GARMENTS[i % 4]} transform="translate(0 30) scale(1.25)"
              fill={hot ? 'rgba(255,59,29,.16)' : 'rgba(255,212,0,.07)'} stroke={hot ? '#FF3B1D' : '#FFD400'} strokeOpacity=".5" strokeWidth="1.6" />
          </g>
        )
      })}
    </svg>
  )
}

function useCountdown() {
  const [left, setLeft] = useState(Math.max(0, SALE_END - Date.now()))
  useEffect(() => { const t = setInterval(() => setLeft(Math.max(0, SALE_END - Date.now())), 1000); return () => clearInterval(t) }, [])
  const s = Math.floor(left / 1000)
  return [['Days', Math.floor(s / 86400)], ['Hrs', Math.floor(s / 3600) % 24], ['Min', Math.floor(s / 60) % 60], ['Sec', s % 60]]
}

const offOf = (p) => (p.previousPrice > p.price ? Math.round((1 - p.price / p.previousPrice) * 100) : 0)

function BfCard({ p, onOpen }) {
  const off = offOf(p)
  return (
    <button onClick={() => onOpen(p)} className="text-left bg-[#111] border border-white/10 flex flex-col active:scale-[0.98] transition group">
      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        <LazyImage src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        {off > 0 && <span className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-black px-2 py-1">-{off}%</span>}
        {p.images.length > 1 && <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1">{p.images.length} photos</span>}
        {!p.inStock && <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-sm font-black uppercase tracking-widest">Sold out</div>}
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-grow">
        <h3 className="text-[13px] font-bold uppercase leading-tight line-clamp-2">{p.name}</h3>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[#FFD400] font-black text-base sm:text-lg">{naira(p.price)}</span>
          {p.previousPrice > 0 && <span className="text-white/40 line-through text-xs sm:text-sm">{naira(p.previousPrice)}</span>}
        </div>
        <span className="mt-1 bg-[#FFD400] text-black py-2.5 text-center text-[11px] font-black uppercase tracking-[0.15em]">{p.inStock ? 'View & add' : 'Sold out'}</span>
      </div>
    </button>
  )
}

function BfDetail({ p, onClose }) {
  const { addToCart } = useBfCart()
  const { toast } = useToast()
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [idx, setIdx] = useState(0)
  const track = useRef(null)
  const off = offOf(p)
  const imgs = p.images.length ? p.images : [undefined]

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc) }
  }, [onClose])

  const go = (i) => {
    const n = (i + imgs.length) % imgs.length
    track.current?.scrollTo({ left: n * track.current.clientWidth, behavior: 'smooth' })
    setIdx(n)
  }
  const onScroll = (e) => { const w = e.currentTarget.clientWidth; if (w) setIdx(Math.round(e.currentTarget.scrollLeft / w)) }

  const add = () => {
    if (p.sizes.length && !size) return toast('Pick a size first', { type: 'error' })
    if (p.colors.length && !color) return toast('Pick a colour first', { type: 'error' })
    addToCart(p, size, 1, color)
    toast(`${p.name} added to cart`, { type: 'success' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        className="relative bg-[#0e0e0e] text-white w-full sm:max-w-4xl max-h-[94dvh] sm:max-h-[90vh] overflow-y-auto sm:grid sm:grid-cols-2 border-t sm:border border-white/15 rounded-t-2xl sm:rounded-none">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-10 bg-black/70 rounded-full p-2"><X size={18} /></button>

        {/* Gallery */}
        <div className="relative bg-black sm:sticky sm:top-0 sm:self-start">
          <div ref={track} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
            {imgs.map((src, i) => (
              <div key={i} className="w-full shrink-0 snap-center aspect-[4/5] bg-[#111]">
                {src && <img src={src} alt={`${p.name} ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover" />}
              </div>
            ))}
          </div>
          {off > 0 && <span className="absolute top-3 left-3 bg-red-600 text-xs font-black px-2 py-1">-{off}%</span>}
          {imgs.length > 1 && (<>
            <button onClick={() => go(idx - 1)} aria-label="Previous photo" className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-2"><ChevronLeft size={18} /></button>
            <button onClick={() => go(idx + 1)} aria-label="Next photo" className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-2"><ChevronRight size={18} /></button>
            <span className="absolute bottom-3 right-3 bg-black/70 text-[11px] font-bold px-2 py-1">{idx + 1} / {imgs.length}</span>
            <div className="flex gap-2 p-2 overflow-x-auto bg-black" style={{ scrollbarWidth: 'none' }}>
              {imgs.map((src, i) => (
                <button key={i} onClick={() => go(i)} className={`w-14 h-16 shrink-0 border-2 ${i === idx ? 'border-[#FFD400]' : 'border-transparent opacity-60'}`}>
                  {src && <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />}
                </button>
              ))}
            </div>
          </>)}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            {p.category && <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1">{p.category}</p>}
            <h2 className="text-xl font-black uppercase leading-tight pr-8">{p.name}</h2>
            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              <span className="text-[#FFD400] font-black text-2xl">{naira(p.price)}</span>
              {p.previousPrice > 0 && <span className="text-white/40 line-through">{naira(p.previousPrice)}</span>}
              {off > 0 && <span className="text-red-500 text-xs font-black">SAVE {naira(p.previousPrice - p.price)}</span>}
            </div>
          </div>
          {p.description && <p className="text-sm text-white/70 whitespace-pre-line">{p.description}</p>}
          {p.sizes.length > 0 && (
            <div><p className="text-[11px] uppercase tracking-widest text-white/50 mb-2">Size</p>
              <div className="flex flex-wrap gap-2">{p.sizes.map((x) => (
                <button key={x} onClick={() => setSize(x)} className={`min-w-11 h-11 px-3 text-sm font-bold border ${size === x ? 'bg-[#FFD400] text-black border-[#FFD400]' : 'border-white/30 text-white/80'}`}>{x}</button>
              ))}</div></div>
          )}
          {p.colors.length > 0 && (
            <div><p className="text-[11px] uppercase tracking-widest text-white/50 mb-2">Colour</p>
              <div className="flex flex-wrap gap-2">{p.colors.map((x) => (
                <button key={x} onClick={() => setColor(x)} className={`h-11 px-4 text-sm font-bold border ${color === x ? 'bg-white text-black border-white' : 'border-white/30 text-white/80'}`}>{x}</button>
              ))}</div></div>
          )}
          <button disabled={!p.inStock} onClick={add} className="sticky bottom-0 sm:static mt-2 bg-[#FFD400] text-black py-4 text-xs font-black uppercase tracking-[0.2em] disabled:opacity-40 active:scale-[0.98] transition">
            {p.inStock ? 'Add to cart' : 'Sold out'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BlackFriday() {
  const { products, ready, error } = useBfProducts()
  const time = useCountdown()
  const [sel, setSel] = useState(null)
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  useEffect(() => { startBfProducts() }, [])

  useEffect(() => { // on phones the hero is tall: bring results into view when searching
    if (query) document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [query])

  const q = query.trim().toLowerCase()
  const shown = q
    ? products.filter((p) => [p.name, p.category, p.description].some((f) => String(f || '').toLowerCase().includes(q)))
    : products

  return (
    <div className="bg-black text-white min-h-screen">
      <style>{`
        .bf-sway{transform-box:fill-box;transform-origin:50% 0;animation:bfSwayR ease-in-out infinite}
        @keyframes bfSwayR{0%,100%{rotate:-2.5deg}50%{rotate:2.5deg}}
        @keyframes bfMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes bfUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes bfGlow{0%,100%{text-shadow:0 0 18px rgba(255,212,0,.25)}50%{text-shadow:0 0 38px rgba(255,212,0,.6)}}
        .bf-up{opacity:0;animation:bfUp .7s ease-out forwards}
        @media (prefers-reduced-motion:reduce){.bf-sway,.bf-marq,.bf-up{animation:none;opacity:1}}
      `}</style>
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-32 sm:pb-24 text-center">
        {HERO_PHOTO && <img src={HERO_PHOTO} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <ClothesRail />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(58,10,10,.55) 0%, rgba(0,0,0,.88) 70%), linear-gradient(to bottom, transparent 70%, #000 100%)' }} />
        <div className="relative">
          <p className="bf-up text-[#FFD400] text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] mb-4">Let Me Style You presents</p>
          <h1 className="bf-up font-black uppercase leading-[0.82] text-[4.5rem] sm:text-9xl tracking-tighter" style={{ animationDelay: '.1s' }}>
            Black<br /><span className="text-[#FFD400]" style={{ animation: 'bfGlow 3s ease-in-out infinite' }}>Friday</span>
          </h1>
          <p className="bf-up mt-6 text-white/75 max-w-md mx-auto text-sm" style={{ animationDelay: '.25s' }}>Our lowest prices of the year. Limited pieces. When they're gone, they're gone.</p>
          <div className="bf-up mt-8 flex justify-center gap-2 sm:gap-3" style={{ animationDelay: '.4s' }}>
            {time.map(([label, v]) => (
              <div key={label} className="w-[4.2rem] sm:w-20 border border-[#FFD400]/40 bg-black/50 backdrop-blur-sm py-3">
                <div className="text-2xl sm:text-3xl font-black text-[#FFD400] tabular-nums">{String(v).padStart(2, '0')}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
              </div>
            ))}
          </div>
          <a href="#deals" className="bf-up inline-block mt-8 bg-[#FFD400] text-black px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white active:scale-95 transition" style={{ animationDelay: '.55s' }}>Shop the deals</a>
        </div>
      </section>
      <div className="bg-[#FFD400] text-black overflow-hidden border-y border-black">
        <div className="bf-marq flex w-max py-2 text-[11px] font-black uppercase tracking-[0.25em]" style={{ animation: 'bfMarquee 22s linear infinite' }}>
          {[0, 1].map((k) => <span key={k} className="whitespace-nowrap pr-10">{'Black Friday ✦ Biggest discounts ✦ Limited stock ✦ Pay by card or transfer ✦ Nationwide delivery ✦ '.repeat(4)}</span>)}
        </div>
      </div>

      <section id="deals" className="scroll-mt-16 max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-black uppercase">The Deals</h2>
          <Link to="/blackfriday/cart" className="text-[11px] uppercase tracking-widest text-[#FFD400] underline underline-offset-4">View cart</Link>
        </div>
        {!ready && <p className="text-white/50 text-sm">Loading deals…</p>}
        {ready && error && <p className="text-red-400 text-sm">Couldn't load deals right now. Please refresh.</p>}
        {ready && !error && products.length === 0 && <p className="text-white/50 text-sm">Deals drop soon. Check back shortly.</p>}
        {ready && !error && products.length > 0 && shown.length === 0 && <p className="text-white/50 text-sm">No deals match "{query}".</p>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {!ready && Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/6] bg-white/5 animate-pulse" />)}
          {shown.map((p) => <BfCard key={p.id} p={p} onOpen={setSel} />)}
        </div>
      </section>
      {sel && <BfDetail p={products.find((x) => x.id === sel.id) || sel} onClose={() => setSel(null)} />}
    </div>
  )
}
