import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { Minus, Plus, ShoppingBag, Truck, RefreshCw, Shield } from 'lucide-react'
import LazyImage from '../components/LazyImage'
import { useToast } from '../context/ToastContext'
import useGsapContext from '../hooks/useGsapContext'
import { gsap, EASE } from '../lib/gsap'
import { fetchProducts, getCachedProducts } from '../lib/productsApi'


export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [currentImage, setCurrentImage] = useState(0)
  const [products, setProducts] = useState(getCachedProducts())
  const [added, setAdded] = useState(false)
  const infoRef = useRef(null)
  const ctaRef = useRef(null)

  useEffect(() => {
    fetchProducts().then(({ products: fetched }) => {
      setProducts(fetched)
    })
  }, [])

  const product = products.find((p) => p.id === parseInt(id))

  // Entrance animation for the info column once the product is known.
  useGsapContext(() => {
    if (!product || !infoRef.current) return
    gsap.fromTo(
      infoRef.current.children,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: EASE }
    )
  }, [product?.id], infoRef)

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
    toast(`Added ${quantity} × ${product.name} to your bag.`, { type: 'success' })
    if (ctaRef.current) {
      gsap.fromTo(ctaRef.current, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' })
    }
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
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
            <div className="relative aspect-[4/5] overflow-hidden">
              <LazyImage
                key={currentImage}
                src={product.images[currentImage]}
                alt={product.name}
                className="h-full w-full"
                eager
              />
              <span className="absolute top-4 left-4 z-10 bg-[#0D0F1C] text-[#C9A24B] text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5">
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
                    <LazyImage src={img} alt="" className="h-full w-full" eager />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info — sticky on large screens */}
          <div ref={infoRef} className="lg:sticky lg:top-24 lg:self-start space-y-6">
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
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              ref={ctaRef}
              onClick={handleAddToCart}
              className={`w-full py-4 sm:py-5 font-bold uppercase tracking-[0.14em] text-sm flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] ${
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
