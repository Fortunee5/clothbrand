import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Package, ReceiptText, LayoutDashboard, LogOut, Plus, Trash2, Pencil, X, ImagePlus, ExternalLink, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/backendConfig'
import { compressImageFile } from '../lib/imageUtils'
import { updateOrderStatus } from '../lib/ordersApi'
import { useBfProducts, startBfProducts, saveBfProduct, deleteBfProduct, fetchBfOrders, subscribeBfOrders } from '../lib/bfApi'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'

// Same admin credentials as the main admin (Supabase Auth). Nothing new to remember.
const ADMIN_USERNAME = 'DsuperaDmin'
const ADMIN_EMAIL = 'bluicy8@gmail.com'
const STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']
const naira = (n) => `₦${Number(n || 0).toLocaleString()}`
const BLANK = { name: '', description: '', category: '', previousPrice: '', price: '', sizes: '', colors: '', inStock: true, images: [] }
const inputCls = 'w-full bg-black border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#FF3B1D] outline-none'

function Login({ onDone }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: u.trim() === ADMIN_USERNAME ? ADMIN_EMAIL : u.trim(), password: p })
    setBusy(false)
    if (error) setErr('Invalid username or password'); else onDone()
  }
  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center px-4">
      <form onSubmit={go} className="w-full max-w-sm bg-[#14141b] border border-white/10 p-8 space-y-4">
        <div className="flex items-center gap-2 text-[#FF3B1D] font-black uppercase tracking-tight text-xl"><Flame size={22} /> BF Control</div>
        <p className="text-white/40 text-xs">Black Friday admin. Sign in with your normal admin details.</p>
        <input className={inputCls} placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} />
        <input className={inputCls} type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} />
        {err && <p className="text-red-400 text-xs">{err}</p>}
        <button disabled={busy} className="w-full bg-[#FF3B1D] text-white py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

function ProductForm({ initial, onClose }) {
  const { toast } = useToast()
  const [f, setF] = useState(initial ? { ...initial, sizes: initial.sizes.join(', '), colors: initial.colors.join(', ') } : BLANK)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const off = Number(f.previousPrice) > Number(f.price) && Number(f.price) > 0 ? Math.round((1 - f.price / f.previousPrice) * 100) : 0
  const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)

  const addImages = async (e) => {
    const files = [...(e.target.files || [])]; e.target.value = ''
    try { const imgs = await Promise.all(files.map(compressImageFile)); set('images', [...f.images, ...imgs]) }
    catch (err) { toast(err.message || 'Could not read that image', { type: 'error' }) }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim() || !f.images.length) return toast('Add a name and at least one photo', { type: 'error' })
    if (!(Number(f.price) > 0) || !(Number(f.previousPrice) > 0)) return toast('Enter both previous and new price', { type: 'error' })
    if (Number(f.previousPrice) <= Number(f.price)) return toast('Previous price should be higher than the new price', { type: 'error' })
    setBusy(true)
    const r = await saveBfProduct({ ...f, sizes: list(f.sizes), colors: list(f.colors) })
    setBusy(false)
    if (r.ok) { toast('Deal saved', { type: 'success' }); onClose() } else toast(r.error || 'Save failed', { type: 'error', duration: 7000 })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-4">
      <form onSubmit={submit} className="w-full max-w-xl bg-[#14141b] border border-white/10 p-6 space-y-4 my-8">
        <div className="flex justify-between items-center"><h3 className="font-black uppercase">{initial ? 'Edit deal' : 'New deal'}</h3><button type="button" onClick={onClose}><X /></button></div>
        <input className={inputCls} placeholder="Product name" value={f.name} onChange={(e) => set('name', e.target.value)} />
        <textarea className={inputCls} rows={3} placeholder="Description" value={f.description} onChange={(e) => set('description', e.target.value)} />
        <input className={inputCls} placeholder="Category (e.g. Dresses)" value={f.category} onChange={(e) => set('category', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] uppercase text-white/50">Previous price (₦)
            <input type="number" min="0" className={`${inputCls} mt-1`} value={f.previousPrice} onChange={(e) => set('previousPrice', e.target.value)} />
          </label>
          <label className="text-[11px] uppercase text-white/50">New price (₦)
            <input type="number" min="0" className={`${inputCls} mt-1`} value={f.price} onChange={(e) => set('price', e.target.value)} />
          </label>
        </div>
        <div className="bg-black border border-white/10 p-3 text-sm flex items-center gap-3">
          <span className="text-white/40 text-xs uppercase">Customers will see</span>
          <span className="text-white/40 line-through">{f.previousPrice ? naira(f.previousPrice) : '—'}</span>
          <span className="text-[#FFD400] font-black">{f.price ? naira(f.price) : '—'}</span>
          {off > 0 && <span className="bg-red-600 text-xs font-black px-2 py-0.5">-{off}%</span>}
        </div>
        <input className={inputCls} placeholder="Sizes, comma separated (S, M, L)" value={f.sizes} onChange={(e) => set('sizes', e.target.value)} />
        <input className={inputCls} placeholder="Colours, comma separated" value={f.colors} onChange={(e) => set('colors', e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.inStock} onChange={(e) => set('inStock', e.target.checked)} /> In stock</label>
        <div className="flex flex-wrap gap-2">
          {f.images.map((img, i) => (
            <div key={i} className="relative w-20 h-24"><img src={img} className="w-full h-full object-cover" />
              <button type="button" onClick={() => set('images', f.images.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5"><X size={12} /></button></div>
          ))}
          <label className="w-20 h-24 border border-dashed border-white/30 flex items-center justify-center cursor-pointer text-white/50"><ImagePlus /><input type="file" accept="image/*" multiple hidden onChange={addImages} /></label>
        </div>
        <button disabled={busy} className="w-full bg-[#FF3B1D] py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50">{busy ? 'Saving…' : 'Save deal'}</button>
      </form>
    </div>
  )
}

export default function BfAdmin() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const { products } = useBfProducts()
  const [authed, setAuthed] = useState(null)
  const [tab, setTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [open, setOpen] = useState(null)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (!supabase) return setAuthed(false)
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
  }, [])

  const loadOrders = async () => { const r = await fetchBfOrders(); if (r.error) toast(`Orders: ${r.error}`, { type: 'error' }); setOrders(r.orders) }
  useEffect(() => {
    if (!authed) return
    startBfProducts(); loadOrders()
    return subscribeBfOrders(loadOrders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== 'Cancelled')
    return [
      ['Orders', orders.length], ['Pending', orders.filter((o) => (o.status || 'Pending') === 'Pending').length],
      ['Revenue', naira(live.filter((o) => o.status !== 'Pending').reduce((s, o) => s + Number(o.total || 0), 0))], ['Live deals', products.length],
    ]
  }, [orders, products])

  if (authed === null) return <div className="min-h-screen bg-[#0b0b0f]" />
  if (!authed) return <Login onDone={() => setAuthed(true)} />

  const setStatus = async (o, status) => {
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status } : x)))
    const r = await updateOrderStatus(o.id, status)
    if (!r.synced) toast('Status did not sync. Try again.', { type: 'error' })
  }
  const remove = async (p) => {
    if (!(await confirm(`Remove "${p.name}" from Black Friday?`, { title: 'Delete deal?' }))) return
    const r = await deleteBfProduct(p.id); toast(r.ok ? 'Deleted' : r.error, { type: r.ok ? 'success' : 'error' })
  }
  const logout = async () => { await supabase.auth.signOut(); setAuthed(false) }

  const nav = [['overview', LayoutDashboard, 'Overview'], ['products', Package, 'Deals'], ['orders', ReceiptText, 'Orders']]

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white md:flex">
      {/* Mobile: compact top bar with a dropdown */}
      <div className="md:hidden sticky top-0 z-40 bg-[#14141b] border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 text-[#FF3B1D] font-black uppercase"><Flame size={18} /> BF Control</div>
          <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 bg-[#FF3B1D] px-3 py-2 text-xs font-black uppercase tracking-wider">
            {nav.find((n) => n[0] === tab)?.[2]} <ChevronDown size={14} className={`transition-transform ${menu ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {menu && (
          <div className="absolute right-3 top-[3.6rem] w-56 bg-[#14141b] border border-white/15 shadow-2xl">
            {nav.map(([k, Icon, label]) => (
              <button key={k} onClick={() => { setTab(k); setMenu(false) }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-left ${tab === k ? 'text-[#FF3B1D]' : 'text-white/70'}`}><Icon size={15} />{label}</button>
            ))}
            <Link to="/blackfriday" className="w-full flex items-center gap-3 px-4 py-3 text-xs text-white/50 border-t border-white/10"><ExternalLink size={14} /> View page</Link>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-white/50"><LogOut size={14} /> Sign out</button>
          </div>
        )}
      </div>
      {/* Desktop: sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 shrink-0 bg-[#14141b] border-r border-white/10 p-4 gap-2 min-h-screen">
        <div className="flex items-center gap-2 text-[#FF3B1D] font-black uppercase mb-6"><Flame size={20} /> BF Control</div>
        {nav.map(([k, Icon, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider ${tab === k ? 'bg-[#FF3B1D] text-white' : 'text-white/60 hover:bg-white/5'}`}><Icon size={15} />{label}</button>
        ))}
        <Link to="/blackfriday" className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 mt-auto"><ExternalLink size={14} /> View page</Link>
        <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-xs text-white/50"><LogOut size={14} /> Sign out</button>
      </aside>

      <main className="flex-1 p-4 sm:p-8 min-w-0 overflow-x-hidden">
        {tab === 'overview' && (<>
          <h1 className="text-2xl font-black uppercase mb-6">Black Friday overview</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {stats.map(([l, v]) => <div key={l} className="bg-[#14141b] border border-white/10 p-4"><div className="text-[10px] uppercase tracking-widest text-white/40">{l}</div><div className="text-2xl font-black mt-1">{v}</div></div>)}
          </div>
          <h2 className="text-sm font-bold uppercase text-white/50 mb-3">Latest orders</h2>
          {orders.slice(0, 5).map((o) => <div key={o.id} className="flex justify-between bg-[#14141b] border border-white/10 p-3 mb-2 text-sm"><span>{o.firstName} {o.lastName}</span><span className="text-[#FFD400] font-bold">{naira(o.total)}</span></div>)}
          {!orders.length && <p className="text-white/40 text-sm">No Black Friday orders yet.</p>}
        </>)}

        {tab === 'products' && (<>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black uppercase">Deals</h1>
            <button onClick={() => setEditing('new')} className="flex items-center gap-2 bg-[#FF3B1D] px-4 py-2 text-xs font-black uppercase"><Plus size={14} /> New deal</button>
          </div>
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-[#14141b] border border-white/10 p-3">
                <img src={p.images[0]} className="w-14 h-16 object-cover bg-black" />
                <div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">{p.name}</div>
                  <div className="text-xs"><span className="line-through text-white/40 mr-2">{naira(p.previousPrice)}</span><span className="text-[#FFD400] font-bold">{naira(p.price)}</span>{!p.inStock && <span className="ml-2 text-red-400">Sold out</span>}</div></div>
                <button onClick={() => setEditing(p)} className="p-2 text-white/60"><Pencil size={16} /></button>
                <button onClick={() => remove(p)} className="p-2 text-red-400"><Trash2 size={16} /></button>
              </div>
            ))}
            {!products.length && <p className="text-white/40 text-sm">No deals yet. Add your first one.</p>}
          </div>
        </>)}

        {tab === 'orders' && (<>
          <h1 className="text-2xl font-black uppercase mb-6">Orders</h1>
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="bg-[#14141b] border border-white/10">
                <button onClick={() => setOpen(open === o.id ? null : o.id)} className="w-full flex justify-between items-center p-3 text-left text-sm">
                  <span><b>{o.firstName} {o.lastName}</b> <span className="text-white/40 ml-2">{o.paymentMethod === 'card' ? 'Card' : 'Transfer'}</span></span>
                  <span className="text-[#FFD400] font-bold">{naira(o.total)}</span>
                </button>
                {open === o.id && (
                  <div className="border-t border-white/10 p-3 text-sm space-y-3">
                    <div className="text-white/60">{o.email} · {o.phone}<br />{o.address}, {o.city}</div>
                    {(o.items || []).map((i) => <div key={i.key} className="flex justify-between"><span>{i.quantity} × {i.name} {i.size && `(${i.size})`} {i.color && `· ${i.color}`}</span><span>{naira(i.price * i.quantity)}</span></div>)}
                    <div className="text-white/50">Delivery: {o.deliveryFee != null ? naira(o.deliveryFee) : 'To be confirmed'}</div>
                    {o.paymentProof && <a href={o.paymentProof} target="_blank" rel="noreferrer" className="text-[#FF3B1D] underline">View payment proof</a>}
                    <div className="flex flex-wrap gap-2">{STATUSES.map((s) => (
                      <button key={s} onClick={() => setStatus(o, s)} className={`px-3 py-1 text-[11px] font-bold uppercase border ${(o.status || 'Pending') === s ? 'bg-[#FF3B1D] border-[#FF3B1D]' : 'border-white/20 text-white/60'}`}>{s}</button>
                    ))}</div>
                  </div>
                )}
              </div>
            ))}
            {!orders.length && <p className="text-white/40 text-sm">No Black Friday orders yet.</p>}
          </div>
        </>)}
      </main>
      {editing && <ProductForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
