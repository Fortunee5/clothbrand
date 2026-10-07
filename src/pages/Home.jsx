import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, RefreshCw, Truck, Headphones } from 'lucide-react'
import LazyImage from '../components/LazyImage'
import Reviews from '../components/Reviews'
import useGsapContext from '../hooks/useGsapContext'
import { gsap, ScrollTrigger, EASE } from '../lib/gsap'
import { useStore } from '../lib/store'


const trustFeatures = [
  { icon: Truck, label: 'Free Delivery', desc: 'On orders over ₦500,000' },
  { icon: RefreshCw, label: 'No cash refunds', desc: 'But you get another item of same price' },
  { icon: Shield, label: 'Secure Payment', desc: 'Protected by Paystack' },
  { icon: Headphones, label: 'Customer Care', desc: 'Mon–Sat, 9am–6pm' },
]

export default function Home() {
  const { products } = useStore()
  const heroRef = useRef(null)
  const rootRef = useRef(null)
  const marqueeRef = useRef(null)

  // Hero entrance — runs once on mount, above the fold.
  useGsapContext(() => {
    const tl = gsap.timeline({ defaults: { ease: EASE } })
    tl.fromTo('.hero-eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 })
      .fromTo('.hero-line', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, '-=0.3')
      .fromTo('.hero-cta', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.25')
      .fromTo('.hero-bg', { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0)
  }, [], heroRef)

  // Trust-strip marquee (mobile/tablet only — see the hidden lg:block
  // grid below for the desktop version). The track is rendered twice back
  // to back in the JSX; animating it left by exactly 50% of its own width,
  // on an infinite linear loop, means the instant the first copy scrolls
  // fully out of view the second copy is in exactly that same starting
  // position — so the loop never visibly "jumps" or resets.
  useGsapContext((el) => {
    if (!el) return
    const track = el.querySelector(':scope > div')
    if (!track) return
    // ~30px/sec feels readable without being sluggish; duration scales
    // with content width so the speed stays consistent regardless of how
    // many trust items there are.
    const distance = track.scrollWidth / 2
    gsap.to(track, {
      xPercent: -50,
      duration: distance / 30,
      ease: 'none',
      repeat: -1,
    })
  }, [], marqueeRef)

  // Scroll-triggered reveals for the rest of the page.
  useGsapContext(() => {
    gsap.utils.toArray('.reveal-section').forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: EASE,
          scrollTrigger: { trigger: section, start: 'top 85%' },
        }
      )
    })

    gsap.utils.toArray('.reveal-grid').forEach((grid) => {
      gsap.fromTo(
        grid.children,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: EASE,
          scrollTrigger: { trigger: grid, start: 'top 88%' },
        }
      )
    })

    // Refresh ScrollTrigger's cached positions once images/layout settle,
    // so reveal thresholds stay accurate instead of firing at stale offsets.
    const t = setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => clearTimeout(t)
  }, [products.length], rootRef)

  return (
    <div ref={rootRef}>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative h-[92dvh] min-h-[540px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000"
            alt="New collection"
            className="hero-bg w-full h-full object-cover"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
          <p className="hero-eyebrow text-[#C9A24B] text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold mb-3 sm:mb-4">
            Spring / Summer 2026
          </p>
          <h1 className="text-white text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold uppercase tracking-[-0.02em] leading-[0.95] mb-6 max-w-2xl xl:max-w-3xl">
            <span className="hero-line block">Timeless</span>
            <span className="hero-line block">Style,</span>
            <span className="hero-line block text-[#C9A24B]">Yours.</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              to="/shop"
              className="hero-cta inline-flex items-center justify-center gap-2.5 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-[#C9A24B] hover:text-white active:scale-[0.97] transition-all duration-300"
            >
              Shop the Collection
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/shop"
              className="hero-cta inline-flex items-center justify-center gap-2 border border-white/60 text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-white/10 active:scale-[0.97] transition-all duration-300"
            >
              View Lookbook
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="bg-[#0D0F1C]">
        {/* Mobile/tablet: continuous auto-sliding marquee — the content is
            rendered twice back-to-back and animated left by exactly half
            its own width on a loop, which is what makes the loop seamless
            (the moment the first copy scrolls fully offscreen, the second
            copy is sitting in the exact same position it started in).
            Desktop (lg+): the original fixed 4-column grid. */}
        <div ref={marqueeRef} className="lg:hidden overflow-hidden py-4">
          <div className="flex w-max">
            {[...trustFeatures, ...trustFeatures].map(({ icon: Icon, label, desc }, i) => (
              <div key={`${label}-${i}`} className="flex items-center gap-3 pr-10 shrink-0">
                <Icon size={18} className="text-[#C9A24B] shrink-0" />
                <div className="whitespace-nowrap">
                  <p className="text-white text-[11px] font-semibold uppercase tracking-[0.1em]">{label}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block container mx-auto px-6">
          <div className="grid grid-cols-4 divide-x divide-white/10">
            {trustFeatures.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 py-5 px-6">
                <Icon size={18} className="text-[#C9A24B] shrink-0" />
                <div>
                  <p className="text-white text-xs font-semibold uppercase tracking-[0.1em]">{label}</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      {products.length > 0 && (
      <section className="reveal-section container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <p className="text-[#C9A24B] text-[10px] tracking-[0.25em] uppercase font-semibold mb-2">Curated Picks</p>
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[-0.02em]">Shop Our Best</h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] border-b border-black pb-0.5 hover:text-[#C9A24B] hover:border-[#C9A24B] transition-colors self-start sm:self-auto"
          >
            View All <ArrowRight size={13} />
          </Link>
        </div>

        <div className="reveal-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
          {products.map((product, i) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group"
            >
              <div className="relative aspect-[3/4] mb-3 sm:mb-4 overflow-hidden">
                <LazyImage
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full"
                  imgClassName="transition-transform duration-700 group-hover:scale-[1.06]"
                  eager={i < 2}
                />
                {product.inStock === false && (
                  <div className="absolute inset-0 z-10 bg-white/55 flex items-center justify-center">
                    <span className="bg-[#0D0F1C] text-white text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1.5">Out of Stock</span>
                  </div>
                )}
                {i === 0 && product.inStock !== false && (
                  <span className="absolute top-3 left-3 z-10 bg-[#C9A24B] text-white text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">
                    Bestseller
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3 z-10">
                  <span className="text-white text-[10px] font-bold uppercase tracking-[0.15em]">
                    Quick View
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em]">{product.category}</p>
                <h3 className="text-sm font-medium uppercase tracking-wide group-hover:text-[#C9A24B] transition-colors leading-tight line-clamp-1">
                  {product.name}
                </h3>
                <p className="font-bold text-sm sm:text-base">₦{parseFloat(product.price).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* ── Category duo ── */}
      <section className="reveal-section container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="reveal-grid grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          {[
            {
              img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1000',
              label: 'Dresses',
            },
            {
              img: 'https://plus.unsplash.com/premium_photo-1664910739194-a9dbe371b361?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
              label: 'Outerwear',
            },
          ].map(({ img, label }) => (
            <Link
              key={label}
              to="/shop"
              className="group relative overflow-hidden block"
              style={{ aspectRatio: '4/5' }}
            >
              <LazyImage
                src={img}
                alt={label}
                className="h-full w-full"
                imgClassName="transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-300 z-10" />
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-8 sm:pb-10 text-white">
                <h3 className="text-3xl sm:text-4xl font-bold uppercase tracking-[-0.01em] mb-3">{label}</h3>
                <span className="inline-flex items-center gap-1.5 border-b border-white/70 pb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] group-hover:border-[#C9A24B] group-hover:text-[#C9A24B] transition-colors">
                  Explore <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Customer reviews ── */}
      <Reviews />

      {/* ── Editorial banner ── */}
      <section className="reveal-section bg-[#F7F5F0] py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl">
          <p className="text-[#C9A24B] text-[10px] tracking-[0.25em] uppercase font-semibold mb-4">Our Philosophy</p>
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[-0.02em] mb-5">
            Fashion that endures
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8">
            We believe great style is timeless. Every piece in our collection is chosen for quality,
            craftsmanship, and versatility — clothes that move with your life.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#0D0F1C] text-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-[#C9A24B] active:scale-[0.97] transition-all duration-300"
          >
            Discover the Collection <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
