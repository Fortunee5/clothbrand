import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Edit2, Plus, Package, ShoppingCart, LogOut, Download, X, Link, Upload, ChevronDown, Menu } from 'lucide-react'

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState(initialProducts)
  const [orders, setOrders] = useState([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (session !== 'true') navigate('/admin/login')

    const savedProducts = localStorage.getItem('products')
    if (savedProducts) setProducts(JSON.parse(savedProducts))
    else localStorage.setItem('products', JSON.stringify(initialProducts))

    const savedOrders = localStorage.getItem('orders')
    if (savedOrders) setOrders(JSON.parse(savedOrders))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    navigate('/')
  }

  const deleteProduct = (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    localStorage.setItem('products', JSON.stringify(updated))
  }

  const exportOrders = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Phone', 'Address', 'City', 'Total Amount', 'Payment Method', 'Items']
    const rows = orders.map(o => [
      o.id, o.createdAt, o.firstName + ' ' + o.lastName,
      o.email, o.phone, o.address, o.city, o.total, o.paymentMethod,
      JSON.stringify(o.items)
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const saveProduct = (product) => {
    let updated
    if (editingProduct) {
      updated = products.map(p => p.id === product.id ? product : p)
    } else {
      updated = [...products, { ...product, id: Date.now() }]
    }
    setProducts(updated)
    localStorage.setItem('products', JSON.stringify(updated))
    setIsAddingProduct(false)
    setEditingProduct(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button
                onClick={() => setIsAddingProduct(true)}
                className="flex items-center justify-center space-x-2 bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded"
              >
                <Plus size={15} />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Products', value: products.length },
                { label: 'Categories', value: [...new Set(products.map(p => p.category))].length },
                { label: 'Total Orders', value: orders.length },
                { label: 'Revenue', value: `₦${orders.reduce((s, o) => s + parseFloat(o.total || 0), 0).toLocaleString()}` },
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
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 w-20">
                        <img src={p.images[0]} alt="" className="w-12 h-16 object-cover rounded" />
                      </td>
                      <td className="p-4 font-medium">{p.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wide">{p.category}</span>
                      </td>
                      <td className="p-4 font-bold">₦{parseFloat(p.price).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-1">
                          <button onClick={() => setEditingProduct(p)} className="p-2 hover:bg-blue-50 rounded text-blue-600 transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors">
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
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
                  <img src={p.images[0]} alt="" className="w-16 h-20 object-cover rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wide">{p.category}</span>
                    <p className="font-bold text-base mt-2">₦{parseFloat(p.price).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setEditingProduct(p)} className="p-2 bg-blue-50 rounded text-blue-600">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 bg-red-50 rounded text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">View</p>
                <h2 className="text-xl font-bold uppercase tracking-tight">Order History</h2>
              </div>
              <button
                onClick={exportOrders}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors rounded"
              >
                <Download size={15} />
                <span>Export CSV</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded p-12 text-center">
                <ShoppingCart size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No orders yet</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Address</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-xs">#{o.id}</td>
                          <td className="p-4 text-gray-500 text-xs">{o.createdAt}</td>
                          <td className="p-4">
                            <div className="font-medium text-sm">{o.firstName} {o.lastName}</div>
                            <div className="text-xs text-gray-400">{o.email}</div>
                          </td>
                          <td className="p-4 text-sm max-w-[180px] truncate text-gray-500">{o.address}, {o.city}</td>
                          <td className="p-4 font-bold">₦{parseFloat(o.total).toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.paymentMethod === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {o.paymentMethod?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile order cards */}
                <div className="md:hidden space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-400 font-bold">#{o.id}</p>
                          <p className="font-bold">{o.firstName} {o.lastName}</p>
                          <p className="text-xs text-gray-500">{o.email}</p>
                        </div>
                        <p className="font-bold text-base">₦{parseFloat(o.total).toLocaleString()}</p>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{o.address}, {o.city}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{o.createdAt}</span>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.paymentMethod === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {o.paymentMethod?.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">{o.status}</span>
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
  const [images, setImages] = useState(product?.images || [])
  const [urlInput, setUrlInput] = useState('')
  const [imageTab, setImageTab] = useState('upload') // 'upload' | 'url'
  const fileInputRef = useRef()

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target.result])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    setImages(prev => [...prev, trimmed])
    setUrlInput('')
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (images.length === 0) {
      alert('Please add at least one image.')
      return
    }
    onSave({ ...formData, id: product?.id, images })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-lg max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold uppercase tracking-tight">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
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
                <Link size={13} />
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
                    <img src={src} alt="" className="w-full h-full object-cover rounded border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={11} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black text-white text-[9px] font-bold px-1 py-0.5 rounded uppercase tracking-wide">Main</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors rounded"
            >
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
