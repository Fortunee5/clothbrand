import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { Minus, Plus, ShoppingBag, ChevronLeft, Truck, RefreshCw, Shield } from 'lucide-react'

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

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [currentImage, setCurrentImage] = useState(0)
  const [products, setProducts] = useState(initialProducts)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('products')
    if (saved) setProducts(JSON.parse(saved))
  }, [])

  const product = products.find((p) => p.id === parseInt(id))

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-6">Product not found</p>
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest underline underline-offset-4">
          Back to Shop
        </Link>
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-gray-400">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-black font-medium truncate max-w-[180px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] bg-[#F7F5F0] overflow-hidden">
              <img
                src={product.images[currentImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 bg-[#0D0F1C] text-[#C9A24B] text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5">
                {product.category}
              </span>
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`shrink-0 w-16 h-20 overflow-hidden border-2 transition-colors ${
                      currentImage === i ? 'border-[#C9A24B]' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info — sticky on large screens */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <div>
              <p className="text-[10px] text-[#C9A24B] uppercase tracking-[0.2em] font-semibold mb-1.5">{product.category}</p>
              <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[-0.01em] leading-tight mb-3">
                {product.name}
              </h1>
              <p className="text-2xl sm:text-3xl font-bold">₦{parseFloat(product.price).toLocaleString()}</p>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Qty</span>
              <div className="flex items-center border border-gray-200 rounded">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 sm:py-5 font-bold uppercase tracking-[0.14em] text-sm flex items-center justify-center gap-3 transition-all duration-300 ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-[#0D0F1C] text-white hover:bg-[#C9A24B]'
              }`}
            >
              <ShoppingBag size={18} />
              {added ? 'Added to Bag!' : 'Add to Bag'}
            </button>

            {/* Trust badges */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              {[
                { icon: Truck, text: 'Free delivery on orders over ₦30,000' },
                { icon: RefreshCw, text: '14-day returns — no questions asked' },
                { icon: Shield, text: 'Secure checkout via Paystack' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-xs text-gray-500">
                  <Icon size={14} className="text-[#C9A24B] shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
