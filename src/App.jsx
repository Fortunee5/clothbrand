import { Component, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import './lib/store' // starts loading products + delivery fees immediately
import { CartProvider } from './context/CartContext'
import { BfCartProvider } from './context/BfCartContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import PageTransition from './components/PageTransition'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import CheckoutSuccess from './pages/CheckoutSuccess'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import Shop from './pages/Shop'
import BfHeader from './components/BfHeader'
import BlackFriday from './pages/BlackFriday'
import BfCart from './pages/BfCart'
import BfCheckout from './pages/BfCheckout'
import BfSuccess from './pages/BfSuccess'
import BfAdmin from './pages/BfAdmin'

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e) { console.error('[app] render error', e) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="font-bold uppercase tracking-widest text-sm">Something went wrong</p>
        <button onClick={() => window.location.reload()} className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest">Reload page</button>
      </div>
    )
  }
}

// Black Friday has its own header/footer-free layout; its admin has none at all.
function Shell() {
  const { pathname } = useLocation()
  const isBfAdmin = pathname.startsWith('/blackfriday/admin')
  const isBf = pathname.startsWith('/blackfriday') && !isBfAdmin
  return (
    <div className="flex flex-col min-h-screen">
      {isBf ? <BfHeader /> : !isBfAdmin && <Header />}
      <main className="flex-grow">
        <PageTransition>
          <Boundary key={pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/blackfriday" element={<BlackFriday />} />
            <Route path="/blackfriday/cart" element={<BfCart />} />
            <Route path="/blackfriday/checkout" element={<BfCheckout />} />
            <Route path="/blackfriday/success" element={<BfSuccess />} />
            <Route path="/blackfriday/admin" element={<BfAdmin />} />
          </Routes>
          </Boundary>
        </PageTransition>
      </main>
      {!isBf && !isBfAdmin && <Footer />}
    </div>
  )
}

function App() {
  // The index.html ships an inline "initial loader" so the very first paint
  // is never a blank white screen. Once React has mounted and painted,
  // fade it out and remove it — this is the hand-off point between the
  // static shell and the live app.
  useEffect(() => {
    const loader = document.getElementById('initial-loader')
    if (!loader) return
    const timer = setTimeout(() => {
      loader.classList.add('hide')
      setTimeout(() => loader.remove(), 550)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ToastProvider>
      <ConfirmProvider>
        <CartProvider>
          <Router>
            <BfCartProvider><Shell /></BfCartProvider>
          </Router>
        </CartProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App
