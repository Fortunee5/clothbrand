import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { gsap, prefersReducedMotion } from '../lib/gsap'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { cart } = useCart()
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const location = useLocation()
  const cartBadgeRef = useRef(null)
  const prevCount = useRef(cartCount)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  // Small "pop" on the cart badge whenever an item is added — a tiny bit of
  // feedback that the click actually registered, without being distracting.
  useEffect(() => {
    if (cartCount > prevCount.current && cartBadgeRef.current && !prefersReducedMotion) {
      gsap.fromTo(
        cartBadgeRef.current,
        { scale: 1.6 },
        { scale: 1, duration: 0.4, ease: 'back.out(3)' }
      )
    }
    prevCount.current = cartCount
  }, [cartCount])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop All' },
    { to: '/shop', label: 'New Arrivals' },
    { to: '/shop', label: 'Bestsellers' },
  ]

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_#e5e7eb]'
            : 'bg-white border-b border-gray-100'
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-[#0D0F1C] text-[#C9A24B] text-[10px] tracking-[0.2em] uppercase font-medium py-2 text-center hidden sm:block">
          Free delivery on orders over ₦500,000 · Lagos & nationwide delivery
        </div>

        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[70px]">
            {/* Mobile menu trigger */}
            <button
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-50 active:scale-90 transition-all"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 font-bold tracking-[-0.04em] text-[17px] lg:text-[19px] uppercase whitespace-nowrap"
            >
              TheStyle<span className="text-[#C9A24B]">YouHub</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.14em]">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`relative py-1 transition-colors hover:text-[#C9A24B] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 after:bg-[#C9A24B] after:transition-transform hover:after:scale-x-100 ${
                    location.pathname === link.to ? 'text-black after:scale-x-100' : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">

              <Link
                to="/cart"
                aria-label={`Cart (${cartCount} items)`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-black"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span
                    ref={cartBadgeRef}
                    className="absolute -top-0.5 -right-0.5 bg-[#C9A24B] text-white text-[9px] min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center font-bold leading-none"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
          <span className="font-bold tracking-[-0.03em] text-[16px] uppercase">
            TheStyle<span className="text-[#C9A24B]">YouHub</span>
          </span>
          <button
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-md hover:bg-gray-50"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="flex items-center px-3 py-3 rounded-lg text-sm font-semibold uppercase tracking-[0.12em] text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-6 border-t border-gray-100 mt-6 space-y-1">
            <Link
              to="/cart"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
            >
              <ShoppingBag size={16} />
              <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
            </Link>
          </div>
        </nav>

        <div className="px-5 py-4 border-t border-gray-100 bg-[#0D0F1C]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <p className="text-[#C9A24B] text-[10px] tracking-[0.2em] uppercase font-medium text-center">
            Free delivery over ₦500,000
          </p>
        </div>
      </div>
    </>
  )
}
