import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'

const initialProducts = [
  {
    id: 1,
    name: "Elegant Summer Dress",
    description: "A beautiful floral print dress perfect for summer outings.",
    price: "15500.00",
    images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=800"],
    category: "Dresses",
  },
  {
    id: 2,
    name: "Classic White Blouse",
    description: "Versatile white blouse for professional or casual wear.",
    price: "8500.00",
    images: ["https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800"],
    category: "Tops",
  },
  {
    id: 3,
    name: "Tailored Blazer - Navy",
    description: "Sharp navy blazer with excellent fit.",
    price: "22000.00",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800"],
    category: "Outerwear",
  },
  {
    id: 4,
    name: "High-Waist Wide Leg Trousers",
    description: "Comfortable and stylish wide-leg trousers.",
    price: "12500.00",
    images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800"],
    category: "Pants",
  },
]

export default function Shop() {
  const [products, setProducts] = useState(initialProducts)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    const saved = localStorage.getItem('products')
    if (saved) setProducts(JSON.parse(saved))
  }, [])

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))]
  const filtered = activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory)

  return (
    <div className="min-h-screen">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
            {filtered.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`} className="group">
                <div className="relative aspect-[3/4] mb-3 bg-gray-50 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2.5">
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
