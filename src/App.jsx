import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
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
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/checkout/success" element={<CheckoutSuccess />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  </Routes>
                </PageTransition>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App
