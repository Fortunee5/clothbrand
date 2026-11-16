// ── Black Friday data layer ─────────────────────────────────────────────
// Products live in their own table (bf_products). Orders reuse the existing
// `orders` table (so your email notifications keep firing) but are tagged
// with data.source = 'blackfriday', so the two admins never mix results.
import { useSyncExternalStore } from 'react'
import { isConfigured, supabase } from './backendConfig'
import { saveOrder } from './ordersApi'

const BUCKET = 'product-images'
export const BF_TAG = 'blackfriday'

// ── tiny live store for BF products ──
let state = { products: [], ready: false, error: null }
const listeners = new Set()
const set = (p) => { state = { ...state, ...p }; listeners.forEach((l) => l()) }
export const useBfProducts = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)

export const getBfProducts = () => state.products

export const toBfProduct = (r) => ({
  id: r.id, name: r.name, description: r.description || '', category: r.category || '',
  previousPrice: Number(r.previous_price) || 0, price: Number(r.price) || 0,
  images: Array.isArray(r.images) ? r.images : [], sizes: Array.isArray(r.sizes) ? r.sizes : [],
  colors: Array.isArray(r.colors) ? r.colors : [], inStock: r.in_stock !== false,
})

const CACHE_KEY = 'bf_products_cache_v1'
const readCache = () => { try { const v = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); return Array.isArray(v) ? v : null } catch { return null } }
const writeCache = (v) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)) } catch { /* storage full/blocked */ } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let inflight = null
export function refreshBfProducts() {
  if (inflight) return inflight // collapse simultaneous calls into one request
  inflight = (async () => {
    if (!isConfigured()) { set({ ready: true, error: 'not_configured' }); return }
    let lastErr = null
    for (let attempt = 0; attempt < 3; attempt++) { // retry with backoff on flaky mobile networks
      const { data, error } = await supabase.from('bf_products').select('*').order('created_at', { ascending: false })
      if (!error) {
        const products = data.map(toBfProduct)
        writeCache(products)
        set({ products, ready: true, error: null })
        return
      }
      lastErr = error
      await sleep(600 * 2 ** attempt)
    }
    console.error('[bfApi] products', lastErr)
    // Keep showing whatever we already have (cache) instead of an empty/broken page.
    set({ ready: true, error: state.products.length ? null : lastErr?.message || 'load_failed' })
  })().finally(() => { inflight = null })
  return inflight
}

// Public page: NO realtime connection (Supabase caps those, and a sale = thousands of shoppers).
// Instead: instant paint from cache, one fetch, then a light refresh every 60s while the tab is visible.
let started = false
export function startBfProducts() {
  if (started) return
  started = true
  const cached = readCache()
  if (cached?.length) set({ products: cached, ready: true })
  refreshBfProducts()
  setInterval(() => { if (document.visibilityState === 'visible') refreshBfProducts() }, 60000)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshBfProducts() })
}

async function uploadImages(id, images) {
  return Promise.all((images || []).map(async (img, i) => {
    if (!String(img).startsWith('data:')) return img
    const blob = await (await fetch(img)).blob()
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
    const path = `bf/${id}/${Date.now()}-${i}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
    if (error) throw error
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }))
}

export async function saveBfProduct(p) {
  if (!isConfigured()) return { ok: false, error: 'Supabase not configured' }
  try {
    const id = p.id || Date.now()
    const images = await uploadImages(id, p.images)
    const { error } = await supabase.from('bf_products').upsert({
      id, name: p.name, description: p.description || '', category: p.category || '',
      previous_price: Number(p.previousPrice), price: Number(p.price),
      images, sizes: p.sizes || [], colors: p.colors || [], in_stock: p.inStock !== false,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    await refreshBfProducts()
    return { ok: true }
  } catch (err) { console.error('[bfApi] save', err); return { ok: false, error: err.message || String(err) } }
}

export async function deleteBfProduct(id) {
  const { error } = await supabase.from('bf_products').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  const { data: files } = await supabase.storage.from(BUCKET).list(`bf/${id}`)
  if (files?.length) await supabase.storage.from(BUCKET).remove(files.map((f) => `bf/${id}/${f.name}`))
  await refreshBfProducts()
  return { ok: true }
}

// ── orders ──
export const saveBfOrder = (order) => saveOrder({ ...order, source: BF_TAG })

export async function fetchBfOrders() {
  if (!isConfigured()) return { orders: [], error: 'Supabase not configured' }
  const { data, error } = await supabase.from('orders').select('*').range(0, 4999)
  if (error) return { orders: [], error: error.message }
  const orders = data.filter((r) => r.data?.source === BF_TAG)
    .map((r) => ({ ...r.data, id: r.id, status: r.status }))
    .sort((a, b) => Number(b.id) - Number(a.id))
  return { orders }
}

export function subscribeBfOrders(cb) {
  if (!supabase) return () => {}
  const ch = supabase.channel('bf-orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, cb).subscribe()
  return () => { supabase.removeChannel(ch) }
}
