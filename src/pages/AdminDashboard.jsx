import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Trash2, Edit2, Plus, Package, ShoppingCart, LogOut, Download, X, Link as LinkIcon,
  Upload, Menu, Search, RefreshCw, Cloud, CloudOff, ChevronDown, Truck, Check,
} from 'lucide-react'
import { fetchOrders, updateOrderStatus, subscribeOrders } from '../lib/ordersApi'
import { supabase } from '../lib/backendConfig'
import { useStore, loadFullProduct, getState } from '../lib/store'
import { NIGERIA, STATES } from '../lib/nigeria'
import { saveStateFees } from '../lib/deliveryApi'
import { fetchProducts, saveProduct as saveProductRemote, deleteProduct as deleteProductRemote } from '../lib/productsApi'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Spinner from '../components/Spinner'
import { compressImageFile } from '../lib/imageUtils'
import LazyImage from '../components/LazyImage'
import { gsap, prefersReducedMotion } from '../lib/gsap'


const STATUS_OPTIONS = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']
const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Shipped: 'bg-blue-100 text-blue-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products')
  const { products, delivery } = useStore()
  const [productsLoading, setProductsLoading] = useState(products.length === 0)
  const [productsSource, setProductsSource] = useState(null) // 'cloud' | 'local'
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersSource, setOrdersSource] = useState(null) // 'cloud' | 'local'
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [proofPreview, setProofPreview] = useState(null)
  const [viewOrder, setViewOrder] = useState(null) // order id currently shown in the lightbox
  const [productSearch, setProductSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const confirm = useConfirm()
  const statsRef = useRef(null)

  const loadProducts = async (showToast = false) => {
    setProductsLoading(true)
    const { products: fetched, source, reason, error } = await fetchProducts()
    // Nothing saved anywhere yet (first run) — seed with the sample catalog
    // so the storefront/admin aren't empty, same as before.
    setProductsSource(source)
    setProductsLoading(false)

    if (source === 'cloud') {
      if (showToast) toast('Products refreshed from the cloud.', { type: 'success' })
      return
    }
    if (reason === 'not_configured') {
      if (showToast) {
        toast('Cloud sync isn\'t set up yet — add your Apps Script URL to src/lib/backendConfig.js. See README.md.', { type: 'info', duration: 7000 })
      }
      return
    }
    const detail = error?.message ? ` (${error.message.slice(0, 100)})` : ''
    if (showToast) {
      toast(`Could not reach the backend — showing products saved on this device only.${detail}`, { type: 'error', duration: 8000 })
    }
  }

  const loadOrders = async (showToast = false, silent = false) => {
    if (!silent) setOrdersLoading(true)
    const { orders: fetched, source, reason, error } = await fetchOrders()
    setOrders(fetched)
    setOrdersSource(source)
    setOrdersLoading(false)

    if (source === 'cloud') {
      if (showToast) toast('Orders refreshed from the cloud.', { type: 'success' })
      return
    }

    // Not synced — figure out why and say so specifically, instead of a
    // generic "couldn't connect" message that's impossible to debug.
    if (reason === 'not_configured') {
      if (showToast) {
        toast('Cloud sync isn\'t set up yet — add your Apps Script URL to src/lib/backendConfig.js. See README.md.', { type: 'info', duration: 7000 })
      }
      return
    }

    // reason === 'error' — log the real cause to the console for debugging
    // and show a short version in the toast.
    const detail = error?.message ? ` (${error.message.slice(0, 100)})` : ''
    if (!silent) toast(`Could not reach the order backend — showing orders saved on this device only.${detail}`, {
      type: 'error',
      duration: 8000,
    })
  }

  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (session !== 'true') { navigate('/admin/login'); return }
    // Writes need a real Supabase login — if it has expired, send the admin back to sign in
    if (supabase) supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { localStorage.removeItem('admin_session'); navigate('/admin/login') }
    })

    loadProducts()
    loadOrders()
    // Live: new orders / status changes arrive instantly (Supabase Realtime); a slow poll is just a safety net
    const unsub = subscribeOrders(() => loadOrders(false, true))
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadOrders(false, true) }, 60000)
    return () => { unsub(); clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  // Gentle stagger-in for the stat cards whenever the products tab is shown
  useEffect(() => {
    if (prefersReducedMotion || activeTab !== 'products' || !statsRef.current) return
    const cards = statsRef.current.children
    gsap.fromTo(
      cards,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
    )
  }, [activeTab, products.length, orders.length])

  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    if (supabase) supabase.auth.signOut()
    navigate('/')
  }

  const deleteProduct = async (id, name) => {
    const ok = await confirm(`This will permanently remove "${name}" from your shop.`, { title: 'Delete product?' })
    if (!ok) return
    const { synced } = await deleteProductRemote(id)
    toast(
      synced ? 'Product deleted.' : 'Deleted locally — will sync to the cloud once online.',
      { type: synced ? 'success' : 'info' }
    )
  }

  const exportOrders = () => {
    if (orders.length === 0) {
      toast('There are no orders to export yet.', { type: 'info' })
      return
    }
    const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Phone', 'Address', 'City', 'Total Amount', 'Payment Method', 'Status', 'Items']
    const rows = orders.map(o => [
      o.id, o.createdAt, `${o.firstName} ${o.lastName}`,
      o.email, o.phone, o.address, o.city, o.total, o.paymentMethod, o.status,
      JSON.stringify(o.items)
    ])
    const csvContent = [headers, ...rows]
      .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast('Orders exported to CSV.', { type: 'success' })
  }


  const saveProduct = async (product) => {
    const isEditing = !!editingProduct
    const { synced, product: saved, reason } = await saveProductRemote(product)

    setIsAddingProduct(false)
    setEditingProduct(null)

    if (synced) {
      toast(isEditing ? 'Product updated.' : 'Product added.', { type: 'success' })
    } else if (reason === 'not_configured') {
      toast(
        `${isEditing ? 'Product updated' : 'Product added'} locally. Set up cloud sync (README.md) so it shows up on other devices.`,
        { type: 'info', duration: 6000 }
      )
    } else {
      toast(`Saved locally — will sync to the cloud once online.`, { type: 'info', duration: 6000 })
    }
  }

  // Make sure ALL photos are loaded before editing, otherwise saving would drop them.
  const openEditor = async (p) => {
    await loadFullProduct(p.id)
    setEditingProduct(getState().products.find((x) => String(x.id) === String(p.id)) || p)
  }

  const changeOrderStatus = async (id, status) => {
    setOrders(prev => prev.map(o => String(o.id) === String(id) ? { ...o, status } : o))
    const { synced } = await updateOrderStatus(id, status)
    toast(
      synced ? `Order #${id} marked as ${status}.` : `Saved locally — will sync to the cloud once online.`,
      { type: synced ? 'success' : 'info' }
    )
  }

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }, [products, productSearch])

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(o =>
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) ||
      String(o.id).includes(q) ||
      (o.email || '').toLowerCase().includes(q)
    )
  }, [orders, orderSearch])

  const revenue = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0)

  return (
    <div className="bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tighter">Admin Dashboard</h1>

            {/* Desktop tabs */}
            <nav className="hidden sm:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${activeTab === 'products' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Package size={15} />
                <span>Products</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <ShoppingCart size={15} />
                <span>Orders</span>
              </button>
              <button
                onClick={() => setActiveTab('delivery')}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${activeTab === 'delivery' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Truck size={15} />
                <span>Delivery</span>
              </button>
            </nav>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 px-3 py-2 rounded transition-colors"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-1">
            <button
              onClick={() => { setActiveTab('products'); setMobileMenuOpen(false) }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-bold uppercase tracking-widest rounded ${activeTab === 'products' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Package size={16} />
              <span>Products</span>
            </button>
            <button
              onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false) }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-bold uppercase tracking-widest rounded ${activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ShoppingCart size={16} />
              <span>Orders</span>
            </button>
            <button
              onClick={() => { setActiveTab('delivery'); setMobileMenuOpen(false) }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-bold uppercase tracking-widest rounded ${activeTab === 'delivery' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Truck size={16} />
              <span>Delivery</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 rounded"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Manage</p>
                <h2 className="text-xl font-bold uppercase tracking-tight">Products</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                    productsSource === 'cloud' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                  title={productsSource === 'cloud' ? 'Showing products synced from the cloud' : 'Showing products saved on this device only'}
                >
                  {productsSource === 'cloud' ? <Cloud size={12} /> : <CloudOff size={12} />}
                  {productsSource === 'cloud' ? 'Cloud synced' : 'Local only'}
                </span>
                <button
                  onClick={() => loadProducts(true)}
                  disabled={productsLoading}
                  className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded disabled:opacity-60"
                >
                  <RefreshCw size={14} className={productsLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="flex items-center justify-center space-x-2 bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 active:scale-[0.98] transition-all rounded"
                >
                  <Plus size={15} />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Products', value: products.length },
                { label: 'Categories', value: [...new Set(products.map(p => p.category))].length },
                { label: 'Total Orders', value: orders.length },
                { label: 'Revenue', value: `₦${revenue.toLocaleString()}` },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                  <p className="text-xl font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {(isAddingProduct || editingProduct) && (
              <ProductForm
                product={editingProduct}
                onSave={saveProduct}
                onClose={() => { setIsAddingProduct(false); setEditingProduct(null) }}
              />
            )}

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name or category…"
                className="w-full sm:w-80 rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-black/10"
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded p-12 text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No products match your search</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block bg-white border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="p-4">Image</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 w-20">
                            <LazyImage src={p.images[0]} alt="" className="w-12 h-16 rounded" eager />
                          </td>
                          <td className="p-4 font-medium">{p.name}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wide">{p.category}</span>
                            <span className={`ml-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${p.inStock === false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{p.inStock === false ? 'Out of stock' : 'In stock'}</span>
                          </td>
                          <td className="p-4 font-bold">₦{parseFloat(p.price).toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end space-x-1">
                              <button onClick={() => openEditor(p)} className="p-2 hover:bg-blue-50 rounded text-blue-600 transition-colors" aria-label={`Edit ${p.name}`}>
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => deleteProduct(p.id, p.name)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" aria-label={`Delete ${p.name}`}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
                      <LazyImage src={p.images[0]} alt="" className="w-16 h-20 rounded flex-shrink-0" eager />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.name}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wide">{p.category}</span>
                        <span className={`inline-block mt-1 ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${p.inStock === false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{p.inStock === false ? 'Out of stock' : 'In stock'}</span>
                        <p className="font-bold text-base mt-2">₦{parseFloat(p.price).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => openEditor(p)} className="p-2 bg-blue-50 rounded text-blue-600" aria-label={`Edit ${p.name}`}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => deleteProduct(p.id, p.name)} className="p-2 bg-red-50 rounded text-red-500" aria-label={`Delete ${p.name}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && <DeliveryTab delivery={delivery} />}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">View</p>
                <h2 className="text-xl font-bold uppercase tracking-tight">Order History</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                    ordersSource === 'cloud' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                  title={ordersSource === 'cloud' ? 'Showing orders synced from all devices' : 'Showing orders saved on this device only'}
                >
                  {ordersSource === 'cloud' ? <Cloud size={12} /> : <CloudOff size={12} />}
                  {ordersSource === 'cloud' ? 'Cloud synced' : 'Local only'}
                </span>
                <button
                  onClick={() => loadOrders(true)}
                  disabled={ordersLoading}
                  className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded disabled:opacity-60"
                >
                  <RefreshCw size={14} className={ordersLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={exportOrders}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-700 active:scale-[0.98] transition-all rounded"
                >
                  <Download size={15} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders by name, email, or ID…"
                className="w-full sm:w-80 rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-black/10"
              />
            </div>

            {ordersLoading ? (
              <div className="bg-white border border-gray-200 rounded p-12 text-center">
                <Spinner size={24} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading orders…</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded p-12 text-center">
                <ShoppingCart size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                  {orders.length === 0 ? 'No orders yet' : 'No orders match your search'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden xl:block bg-white border border-gray-200 rounded overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[1050px]">
                    <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Address</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Proof</th>
                        <th className="p-4">Status</th>
                      <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-xs">#{o.id}</td>
                          <td className="p-4 text-gray-500 text-xs">{o.createdAt}</td>
                          <td className="p-4">
                            <div className="font-medium text-sm">{o.firstName} {o.lastName}</div>
                            <div className="text-xs text-gray-400">{o.email}</div>
                          <div className="text-xs text-gray-500">{o.phone}</div>
                          </td>
                          <td className="p-4 text-sm max-w-[180px] truncate text-gray-500">{o.address}, {o.city}</td>
                          <td className="p-4 font-bold">₦{parseFloat(o.total).toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.paymentMethod === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {(o.paymentMethod || '').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            {o.paymentProof ? (
                              <button onClick={() => setProofPreview(o)} className="block">
                                <img src={o.paymentProof} alt="Payment proof" className="h-10 w-10 object-cover rounded border border-gray-200 hover:border-black transition-colors" />
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <StatusDropdown status={o.status} onChange={(status) => changeOrderStatus(o.id, status)} />
                          </td>
                        <td className="p-4">
                            <button onClick={() => setViewOrder(o)} className="text-[10px] font-bold uppercase tracking-widest border border-gray-300 rounded px-3 py-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap">
                              Details ({(o.items || []).length})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile order cards */}
                <div className="xl:hidden space-y-3">
                  {filteredOrders.map((o) => (
                    <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-xs text-gray-400 font-bold">#{o.id}</p>
                          <p className="font-bold">{o.firstName} {o.lastName}</p>
                          <p className="text-xs text-gray-500">{o.email}</p>
                        <p className="text-xs text-gray-500">{o.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {o.paymentProof && (
                            <button onClick={() => setProofPreview(o)}>
                              <img src={o.paymentProof} alt="Payment proof" className="h-10 w-10 object-cover rounded border border-gray-200" />
                            </button>
                          )}
                          <p className="font-bold text-base">₦{parseFloat(o.total).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{o.address}, {o.city}</div>
                      <button onClick={() => setViewOrder(o)} className="w-full text-[10px] font-bold uppercase tracking-widest border border-gray-300 rounded px-3 py-2 hover:bg-black hover:text-white transition-colors">
                        View full details &amp; items ({(o.items || []).length})
                      </button>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400">{o.createdAt}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.paymentMethod === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {(o.paymentMethod || '').replace('_', ' ')}
                          </span>
                          <StatusDropdown status={o.status} onChange={(status) => changeOrderStatus(o.id, status)} compact />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {viewOrder && createPortal(
        <OrderDetails order={viewOrder} onClose={() => setViewOrder(null)} onProof={() => setProofPreview(viewOrder)} />,
        document.body
      )}

      {proofPreview && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setProofPreview(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProofPreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <img src={proofPreview.paymentProof} alt="Payment proof" className="w-full rounded-lg" />
            <p className="text-white text-xs text-center mt-3">
              Order #{proofPreview.id} — {proofPreview.firstName} {proofPreview.lastName}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Full order details (everything the customer entered + exactly what they bought) ──
const naira = (n) => `₦${(Number(n) || 0).toLocaleString()}`
function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 text-sm">
      <span className="text-gray-400 text-xs uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-right font-medium break-words min-w-0">{children || '—'}</span>
    </div>
  )
}
function OrderDetails({ order: o, onClose, onProof }) {
  const items = o.items || []
  const subtotal = o.subtotal ?? items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (it.quantity || 1), 0)
  const hasFee = o.deliveryFee !== undefined && o.deliveryFee !== null && o.deliveryFee !== ''
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-lg my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Order</p>
            <h3 className="text-lg font-bold">#{o.id}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-6">
          <section>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-1">Customer</h4>
            <Row label="Name">{o.firstName} {o.lastName}</Row>
            <Row label="Email"><a href={`mailto:${o.email}`} className="underline">{o.email}</a></Row>
            <Row label="Phone">{o.phone && <a href={`tel:${o.phone}`} className="underline">{o.phone}</a>}</Row>
          </section>

          <section>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-1">Delivery</h4>
            <Row label="Address">{o.address}</Row>
            <Row label="State">{o.state}</Row>
            <Row label="Local government">{o.lga}</Row>
            <Row label="Ordered">{o.createdAt}</Row>
          </section>

          <section>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-1">Payment</h4>
            <Row label="Method">{(o.paymentMethod === 'card' ? 'Card (Paystack)' : o.paymentMethod === 'online' ? 'Bank transfer' : o.paymentMethod || '').toString()}</Row>
            <Row label="Status">{o.status}</Row>
            {o.paystackRef && <Row label="Paystack ref">{o.paystackRef}</Row>}
            {o.paymentProof && (
              <Row label="Proof">
                <button onClick={onProof}><img src={o.paymentProof} alt="Payment proof" className="h-16 w-16 object-cover rounded border border-gray-200 ml-auto" /></button>
              </Row>
            )}
          </section>

          <section>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Items paid for ({items.length})</h4>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded">
              {items.map((it, i) => (
                <div key={`${it.key || it.id}-${i}`} className="flex gap-3 p-3">
                  {it.image ? <img src={it.image} alt={it.name} className="w-16 h-16 object-cover rounded bg-gray-100 shrink-0" /> : <div className="w-16 h-16 bg-gray-100 rounded shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{it.name}</p>
                    <p className="text-xs text-gray-500">
                      {[it.size && `Size: ${it.size}`, it.color && `Colour: ${it.color}`, `Qty: ${it.quantity || 1}`].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-gray-400">{naira(it.price)} each</p>
                  </div>
                  <p className="font-bold text-sm shrink-0">{naira((parseFloat(it.price) || 0) * (it.quantity || 1))}</p>
                </div>
              ))}
              {items.length === 0 && <p className="p-3 text-sm text-gray-400">No item details were saved for this order.</p>}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{naira(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>{hasFee ? naira(o.deliveryFee) : 'To be confirmed with customer'}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200"><span>Total paid</span><span>{naira(o.total)}</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Order status dropdown ───────────────────────────────────────────────────
function StatusDropdown({ status, onChange, compact = false }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded text-[10px] font-bold uppercase px-2 py-1 transition-colors ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
      >
        {status || 'Pending'} <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute z-20 mt-1 ${compact ? 'right-0' : 'left-0'} w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg`}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false) }}
                className={`block w-full px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide hover:bg-gray-50 ${s === status ? 'text-black' : 'text-gray-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Product Form ────────────────────────────────────────────────────────────
function ProductForm({ product, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || '',
  })
  const [sizesText, setSizesText] = useState((product?.sizes || []).join(', '))
  const [colorsText, setColorsText] = useState((product?.colors || []).join(', '))
  const [inStock, setInStock] = useState(product ? product.inStock !== false : true)
  const [images, setImages] = useState(product?.images || [])
  const [urlInput, setUrlInput] = useState('')
  const [imageTab, setImageTab] = useState('upload') // 'upload' | 'url'
  const [imageError, setImageError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef()
  const modalRef = useRef()
  const { toast } = useToast()

  useEffect(() => {
    if (prefersReducedMotion || !modalRef.current) return
    gsap.fromTo(modalRef.current, { opacity: 0, y: 16, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' })
  }, [])

  const MAX_IMAGES = 6 // matches the Products sheet's image1..image6 columns

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    for (const file of files) {
      if (images.length >= MAX_IMAGES) {
        toast(`You can add up to ${MAX_IMAGES} images per product.`, { type: 'info' })
        break
      }
      try {
        const compressed = await compressImageFile(file)
        setImages(prev => [...prev, compressed])
      } catch (err) {
        toast(err.message || `Couldn't process "${file.name}" — try a different image.`, { type: 'error' })
      }
    }
  }

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (images.length >= MAX_IMAGES) {
      toast(`You can add up to ${MAX_IMAGES} images per product.`, { type: 'info' })
      return
    }
    setImages(prev => [...prev, trimmed])
    setUrlInput('')
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (images.length === 0) {
      setImageError('Please add at least one image.')
      toast('Please add at least one product image.', { type: 'error' })
      return
    }
    setSubmitting(true)
    // Await here matters: uploading "From Device" images to the cloud can
    // take a few seconds, and onSave (in AdminDashboard) is what actually
    // performs that upload — closing the modal early would make it look
    // like the save silently vanished.
    const sizes = [...new Set(sizesText.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean))]
    const colors = [...new Set(colorsText.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean))]
    await onSave({ ...formData, id: product?.id, images, sizes, colors, inStock })
    setSubmitting(false)
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl sm:rounded-lg max-h-[92dvh] flex flex-col overflow-hidden"
      >
        {/* Header — always visible, never scrolls away */}
        <div className="shrink-0 flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold uppercase tracking-tight">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} disabled={submitting} className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body — flex-1 + min-h-0 is what makes this actually
            scroll all the way to its last pixel inside a flex column,
            instead of being pushed out of view by mobile browser chrome. */}
        <form id="product-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Product Name *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 p-3 rounded outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Floral Midi Dress"
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Price (₦) *</label>
              <input
                required
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded outline-none focus:ring-2 focus:ring-black text-sm"
                placeholder="e.g. 15000"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Category *</label>
              <input
                required
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded outline-none focus:ring-2 focus:ring-black text-sm"
                placeholder="e.g. Dresses"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Sizes (optional)</label>
            <input
              type="text"
              value={sizesText}
              onChange={(e) => setSizesText(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. 12, 16, 20 — separate with commas"
            />
            {sizesText.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[...new Set(sizesText.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean))].map((s) => (
                  <span key={s} className="px-2.5 py-1 border border-gray-200 text-xs font-semibold rounded">{s}</span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5">Customers must pick one of these before adding to bag. Leave empty for one-size items.</p>
          </div>

          {/* Colours */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Colours (optional)</label>
            <input
              type="text"
              value={colorsText}
              onChange={(e) => setColorsText(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Black, Red, Royal Blue — separate with commas"
            />
            {colorsText.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[...new Set(colorsText.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean))].map((c) => (
                  <span key={c} className="px-2.5 py-1 border border-gray-200 text-xs font-semibold rounded">{c}</span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5">Customers must pick one before adding to bag. Leave empty if there is only one colour.</p>
          </div>

          {/* Stock status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Stock status *</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: true, label: 'In Stock' }, { v: false, label: 'Out of Stock' }].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setInStock(o.v)}
                  aria-pressed={inStock === o.v}
                  className={`py-3 text-xs font-bold uppercase tracking-widest border rounded transition-colors ${
                    inStock === o.v
                      ? (o.v ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600')
                      : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Out of Stock products stay visible to customers but can't be bought.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 p-3 rounded outline-none focus:ring-2 focus:ring-black resize-none text-sm"
              placeholder="Describe the product…"
            />
          </div>

          {/* Images Section */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Product Images *</label>

            {/* Tab switcher */}
            <div className="flex border border-gray-200 rounded overflow-hidden mb-3 text-xs font-bold uppercase tracking-widest">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${imageTab === 'upload' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <Upload size={13} />
                From Device
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${imageTab === 'url' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <LinkIcon size={13} />
                From URL
              </button>
            </div>

            {/* Upload from device */}
            {imageTab === 'upload' && (
              <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-black hover:bg-gray-50 transition-colors"
              >
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Click to select images</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* URL input */}
            {imageTab === 'url' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                  className="flex-1 border border-gray-300 p-3 rounded outline-none focus:ring-2 focus:ring-black text-sm"
                  placeholder="https://example.com/photo.jpg"
                />
                <button
                  type="button"
                  onClick={addUrl}
                  className="px-4 bg-black text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            {/* Image previews */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <LazyImage src={src} alt="" className="w-full h-full rounded border border-gray-200" eager />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={11} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black text-white text-[9px] font-bold px-1 py-0.5 rounded uppercase tracking-wide z-10">Main</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {imageError && <p className="mt-2 text-xs font-medium text-red-500">{imageError}</p>}
          </div>
        </form>

        {/* Footer — pinned outside the scroll area, so the buttons are
            always reachable without scrolling all the way down. */}
        <div
          className="shrink-0 flex gap-3 p-5 border-t border-gray-200"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-gray-300 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={submitting}
            className="flex-1 bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all rounded disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Spinner size={14} />}
            {submitting ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}


// ── Delivery fees: admin prices every state / local government ───────────
function DeliveryTab({ delivery }) {
  const { toast } = useToast()
  const [stateName, setStateName] = useState('Lagos')
  const [draft, setDraft] = useState({})
  const [bulk, setBulk] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const lgas = NIGERIA[stateName] || []

  // Load the saved prices for the selected state into the editable draft
  useEffect(() => {
    const saved = delivery[stateName] || {}
    setDraft(Object.fromEntries(lgas.map((l) => [l, saved[l] ?? ''])))
    setBulk('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateName, JSON.stringify(delivery[stateName] || {})])

  const pricedCount = (s) => Object.keys(delivery[s] || {}).length
  const visible = lgas.filter((l) => l.toLowerCase().includes(search.trim().toLowerCase()))
  const dirty = lgas.some((l) => String(draft[l] ?? '') !== String((delivery[stateName] || {})[l] ?? ''))

  const applyBulk = () => {
    if (bulk === '' || Number(bulk) < 0) return
    setDraft((d) => ({ ...d, ...Object.fromEntries(visible.map((l) => [l, bulk])) }))
  }

  const save = async () => {
    setSaving(true)
    const { synced, reason } = await saveStateFees(stateName, draft)
    setSaving(false)
    if (synced) toast(`${stateName} delivery prices saved.`, { type: 'success' })
    else if (reason === 'not_configured') toast('Saved on this device only — set up cloud sync first.', { type: 'info' })
    else toast('Saved locally — could not reach the backend. Try again.', { type: 'error' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tight">Delivery Prices</h2>
        <p className="text-sm text-gray-500 mt-1">
          Set a price per local government. Any LGA left blank shows customers: "pls note our team would reach out to about the delivery cost to your destination".
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* State list */}
        <div className="bg-white border border-gray-200 rounded max-h-[70vh] overflow-y-auto">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setStateName(s)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm border-b border-gray-100 transition-colors ${stateName === s ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
            >
              <span className="font-semibold">{s}</span>
              <span className={`text-[10px] font-bold ${stateName === s ? 'text-gray-300' : pricedCount(s) ? 'text-green-600' : 'text-gray-300'}`}>
                {pricedCount(s)}/{NIGERIA[s].length}
              </span>
            </button>
          ))}
        </div>

        {/* LGA prices */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h3 className="font-bold uppercase tracking-wide text-sm">{stateName} <span className="text-gray-400 font-medium">· {lgas.length} LGAs</span></h3>
            <div className="flex flex-wrap gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search LGA…"
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black w-full sm:w-40" />
              <input type="number" min="0" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="₦ for all shown"
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black w-full sm:w-36" />
              <button onClick={applyBulk} disabled={bulk === ''}
                className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">Apply</button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto">
            {visible.map((l) => (
              <label key={l} className="flex items-center justify-between gap-3 border border-gray-200 rounded px-3 py-2">
                <span className="text-sm font-medium truncate">{l}</span>
                <span className="flex items-center gap-1 shrink-0">
                  <span className="text-gray-400 text-sm">₦</span>
                  <input type="number" min="0" inputMode="numeric" value={draft[l] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [l]: e.target.value }))}
                    placeholder="—" className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-black" />
                </span>
              </label>
            ))}
            {visible.length === 0 && <p className="text-sm text-gray-400 col-span-full">No local government matches your search.</p>}
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
            <button onClick={save} disabled={saving || !dirty}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-900 disabled:opacity-40">
              {saving ? <Spinner size={14} /> : <Check size={14} />} Save {stateName}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
