import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import LazyImage from '../components/LazyImage'
import useGsapContext from '../hooks/useGsapContext'
import { gsap, EASE } from '../lib/gsap'
import { fetchProducts, getCachedProducts } from '../lib/productsApi'


export default function Shop() {
  const [products, setProducts] = useState(getCachedProducts())
  const [activeCategory, setActiveCategory] = useState('All')
  const gridRef = useRef(null)

  useEffect(() => {
    fetchProducts().then(({ products: fetched }) => {
      setProducts(fetched)
    })
  }, [])

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))]
  const filtered = activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory)

  // Re-run a light stagger reveal whenever the visible set changes (filter
  // switch or initial load) so the grid never just "pops" into place.
  useGsapContext(() => {
    if (!gridRef.current) return
    gsap.fromTo(
      gridRef.current.children,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: EASE }
    )
  }, [activeCategory, filtered.length], gridRef)

  return (
    <div>
      {/* Page header */}
      <div className="bg-[#F7F5F0] pt-10 sm:pt-14 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <p className="text-[#C9A24B] text-[10px] tracking-[0.25em] uppercase font-semibold mb-2">Collection</p>
          <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[-0.02em]">Shop All</h1>
          <p className="text-gray-500 text-sm mt-2">{products.length} pieces</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-[64px] lg:top-[70px] z-30 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3">
            <SlidersHorizontal size={14} className="text-gray-400 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] rounded-full transition-colors border ${
                  activeCategory === cat
                    ? 'bg-[#0D0F1C] text-white border-[#0D0F1C]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
            {activeCategory !== 'All' && (
              <button
                onClick={() => setActiveCategory('All')}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C9A24B] hover:text-black transition-colors"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm uppercase tracking-widest">No products found</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 lg:gap-8">
            {filtered.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`} className="group">
                <div className="relative aspect-[3/4] mb-3 overflow-hidden">
                  <LazyImage
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2.5 z-10">
                    <span className="text-white text-[9px] font-bold uppercase tracking-[0.15em]">Quick View</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-[0.12em]">{product.category}</p>
                  <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wide leading-tight line-clamp-1 group-hover:text-[#C9A24B] transition-colors">
                    {product.name}
                  </h3>
                  <p className="font-bold text-sm">₦{parseFloat(product.price).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
