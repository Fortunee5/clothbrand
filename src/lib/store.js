// ── Shared live data store ──────────────────────────────────────────────
// One place that owns products + delivery fees for the WHOLE app.
//  • Hydrates instantly from IndexedDB (no 5MB localStorage limit, so photos fit)
//  • Refreshes from Apps Script with ONE request ("bootstrap": products +
//    delivery fees together) instead of one request per page
//  • Re-syncs every 20s while the tab is visible and whenever the tab regains
//    focus, so every page sees backend changes without a manual reload
import { useSyncExternalStore } from 'react'
import { isConfigured, gasGet } from './backendConfig'

const DB = 'tsyh-cache', KV = 'kv'
let state = { products: [], delivery: {}, ready: false, source: 'local', error: null }
let pending = new Set() // product ids saved locally but not yet confirmed by the cloud
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
  try { const db = await idb(); db.transaction(KV, 'readwrite').objectStore(KV).put(v, k) } catch { /* cache is best-effort */ }
}

function set(patch, persist = true) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
  if (persist) idbSet('snapshot', { products: state.products, delivery: state.delivery, pending: [...pending] })
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

// The list endpoint only carries each product's FIRST image (keeps the payload
// small and fast). If we already hold the full gallery for the same version of
// a product, keep it instead of shrinking it back down.
function mergeProducts(remote) {
  const cached = new Map(state.products.map((p) => [String(p.id), p]))
  const merged = remote.map((p) => {
    const c = cached.get(String(p.id))
    const sizes = Array.isArray(p.sizes) ? p.sizes : []
    if (c && c.updatedAt === p.updatedAt && c.images?.length > (p.images?.length || 0)) return { ...p, sizes, images: c.images }
    return { ...p, sizes }
  })
  const ids = new Set(merged.map((p) => String(p.id)))
  const localOnly = state.products.filter((p) => pending.has(String(p.id)) && !ids.has(String(p.id)))
  return [...merged, ...localOnly]
}

export function refresh() {
  if (!isConfigured()) { set({ ready: true, source: 'local' }); return Promise.resolve(state) }
  if (inflight) return inflight
  inflight = gasGet({ action: 'bootstrap' })
    .then((data) => {
      if (!data.success) throw new Error(data.error || 'Failed to load store data')
      set({ products: mergeProducts(data.products || []), delivery: data.delivery || {}, ready: true, source: 'cloud', error: null })
      return state
    })
    .catch((error) => { console.error('[store] refresh failed:', error); set({ ready: true, source: 'local', error }, false); return state })
    .finally(() => { inflight = null })
  return inflight
}

// Fetch one product's FULL gallery (all images) and fold it into the store.
export async function loadFullProduct(id) {
  if (!isConfigured()) return
  try {
    const data = await gasGet({ action: 'get_product', id: String(id) })
    if (data.success && data.product) upsertProduct({ ...data.product, sizes: data.product.sizes || [] }, { markPending: pending.has(String(id)) })
  } catch (e) { console.error('[store] loadFullProduct failed:', e) }
}

// Boot: show cached data immediately, then refresh from the backend.
idbGet('snapshot').then((snap) => {
  if (snap && !state.ready) { pending = new Set(snap.pending || []); set({ products: snap.products || [], delivery: snap.delivery || {} }, false) }
}).finally(refresh)

if (typeof document !== 'undefined') {
  setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 20000)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh() })
  window.addEventListener('focus', refresh)
  window.addEventListener('online', refresh)
}
