// ── Shared live data store (Supabase) ───────────────────────────────────
// Owns products + delivery fees for the whole app.
//  • Paints instantly from IndexedDB, then loads fresh data from Supabase
//  • Supabase Realtime pushes every change to every open page within a moment
//  • Photos are plain CDN URLs now, so there is no separate photo loading step
import { useSyncExternalStore } from 'react'
import { isConfigured, supabase } from './backendConfig'

const DB = 'tsyh-cache', KV = 'kv'
let state = { products: [], delivery: {}, ready: false, source: 'local', error: null }
let pending = new Set() // products saved locally but not yet confirmed by the cloud
const listeners = new Set()
let inflight = null

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(KV)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function idbGet(k) {
  try { const db = await idb(); return await new Promise((res) => { const q = db.transaction(KV).objectStore(KV).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined) }) } catch { return undefined }
}
async function idbSet(k, v) {
  try { const db = await idb(); db.transaction(KV, 'readwrite').objectStore(KV).put(v, k) } catch { /* best-effort */ }
}

function set(patch, persist = true) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
  if (persist) idbSet('snapshot_sb', { products: state.products, delivery: state.delivery, pending: [...pending] })
}

export const getState = () => state
export const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useStore = () => useSyncExternalStore(subscribe, getState)

export function upsertProduct(p, { markPending = false } = {}) {
  const idx = state.products.findIndex((x) => String(x.id) === String(p.id))
  const products = idx >= 0 ? state.products.map((x, i) => (i === idx ? p : x)) : [...state.products, p]
  if (markPending) pending.add(String(p.id)); else pending.delete(String(p.id))
  set({ products })
}
export function removeProduct(id) {
  pending.delete(String(id))
  set({ products: state.products.filter((p) => String(p.id) !== String(id)) })
}
export function setDelivery(delivery) { set({ delivery }) }

export const toProduct = (r) => ({
  id: r.id, name: r.name, description: r.description || '', price: r.price, category: r.category || '',
  images: Array.isArray(r.images) ? r.images : [], sizes: Array.isArray(r.sizes) ? r.sizes : [],
  colors: Array.isArray(r.colors) ? r.colors : [], inStock: r.in_stock !== false, updatedAt: r.updated_at,
})

function mergeProducts(rows) {
  const mapped = rows.map(toProduct)
  const ids = new Set(mapped.map((p) => String(p.id)))
  const localOnly = state.products.filter((p) => pending.has(String(p.id)) && !ids.has(String(p.id)))
  return [...mapped, ...localOnly]
}

export function refresh() {
  if (!isConfigured()) { set({ ready: true, source: 'local' }); return Promise.resolve(state) }
  if (inflight) return inflight
  inflight = Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: true }).range(0, 4999),
    supabase.from('delivery').select('state,lga,price').range(0, 9999),
  ])
    .then(([p, d]) => {
      if (p.error) throw p.error
      if (d.error) throw d.error
      const delivery = {}
      d.data.forEach((r) => { (delivery[r.state] ||= {})[r.lga] = Number(r.price) })
      set({ products: mergeProducts(p.data), delivery, ready: true, source: 'cloud', error: null })
      return state
    })
    .catch((error) => { console.error('[store] refresh failed:', error); set({ ready: true, source: 'local', error }, false); return state })
    .finally(() => { inflight = null })
  return inflight
}

// Photos already ship with the product list, so nothing extra to load.
export async function loadFullProduct() {}

// Realtime: any change to products/delivery from anywhere refreshes every open page.
function startRealtime() {
  if (!supabase) return
  let t
  const kick = () => { clearTimeout(t); t = setTimeout(refresh, 150) }
  supabase.channel('storefront-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, kick)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery' }, kick)
    .subscribe()
}

refresh() // start the network request immediately
idbGet('snapshot_sb').then((snap) => {
  if (!snap) return
  pending = new Set([...(snap.pending || []), ...pending])
  if (state.source !== 'cloud') set({ products: snap.products || [], delivery: snap.delivery || {} }, false)
})
startRealtime()

if (typeof document !== 'undefined') {
  setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 60000) // safety net
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh() })
  window.addEventListener('online', refresh)
}
