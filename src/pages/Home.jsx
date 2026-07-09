import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, RefreshCw, Truck, Headphones } from 'lucide-react'

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

const trustFeatures = [
  { icon: Truck, label: 'Free Delivery', desc: 'On orders over ₦30,000' },
  { icon: RefreshCw, label: 'Easy Returns', desc: '14-day hassle-free returns' },
  { icon: Shield, label: 'Secure Payment', desc: 'Protected by Paystack' },
  { icon: Headphones, label: 'Customer Care', desc: 'Mon–Sat, 9am–6pm' },
]

export default function Home() {
  const [products, setProducts] = useState(initialProducts)

  useEffect(() => {
    const saved = localStorage.getItem('products')
    if (saved) setProducts(JSON.parse(saved))
  }, [])

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative h-[88vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000"
            alt="New collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
          <p className="text-[#C9A24B] text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold mb-3 sm:mb-4">
            Spring / Summer 2026
          </p>
          <h1 className="text-white text-4xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-[-0.02em] leading-[0.95] mb-6 max-w-2xl">
            Timeless<br />Style,<br />
            <span className="text-[#C9A24B]">Yours.</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-[#C9A24B] hover:text-white transition-all duration-300"
            >
              Shop the Collection
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 border border-white/60 text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-white/10 transition-all duration-300"
            >
              View Lookbook
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="bg-[#0D0F1C]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
            {trustFeatures.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 py-5 px-4 sm:px-6">
                <Icon size={18} className="text-[#C9A24B] shrink-0" />
                <div>
                  <p className="text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.1em]">{label}</p>
                  <p className="text-gray-400 text-[10px] sm:text-[11px] mt-0.5 hidden sm:block">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
          {products.map((product, i) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group"
            >
              <div className="relative aspect-[3/4] mb-3 sm:mb-4 bg-gray-50 overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                {i === 0 && (
                  <span className="absolute top-3 left-3 bg-[#C9A24B] text-white text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">
                    Bestseller
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
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

      {/* ── Category duo ── */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
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
              <img
                src={img}
                alt={label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-10 text-white">
                <h3 className="text-3xl sm:text-4xl font-bold uppercase tracking-[-0.01em] mb-3">{label}</h3>
                <span className="inline-flex items-center gap-1.5 border-b border-white/70 pb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] group-hover:border-[#C9A24B] group-hover:text-[#C9A24B] transition-colors">
                  Explore <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Editorial banner ── */}
      <section className="bg-[#F7F5F0] py-16 sm:py-24">
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
            className="inline-flex items-center gap-2 bg-[#0D0F1C] text-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-[#C9A24B] transition-colors duration-300"
          >
            Discover the Collection <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
