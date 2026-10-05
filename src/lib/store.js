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

// The list endpoint returns TEXT ONLY (fast). Photos arrive separately via
// get_thumbs and are kept in IndexedDB, so repeat visits paint instantly.
// A cached photo is reused as long as the product's updatedAt is unchanged.
function mergeProducts(remote) {
  const cached = new Map(state.products.map((p) => [String(p.id), p]))
  const merged = remote.map((p) => {
    const c = cached.get(String(p.id))
    const sizes = Array.isArray(p.sizes) ? p.sizes : []
    const keep = c && c.updatedAt === p.updatedAt && c.images?.length ? c.images : (c && pending.has(String(p.id)) ? c.images : [])
    return { ...p, sizes, colors: Array.isArray(p.colors) ? p.colors : [], inStock: p.inStock !== false, images: keep || [] }
  })
  const ids = new Set(merged.map((p) => String(p.id)))
  const localOnly = state.products.filter((p) => pending.has(String(p.id)) && !ids.has(String(p.id)))
  return [...merged, ...localOnly]
}

// Fetch first photos for products that don't have one yet: small parallel
// batches so the first photos appear within a moment and the rest stream in.
let thumbBusy = false
async function loadThumbs() {
  if (thumbBusy || !isConfigured()) return
  thumbBusy = true
  try {
    const need = state.products.filter((p) => p.hasImage !== false && !p.images?.length).map((p) => String(p.id))
    const batches = []
    for (let i = 0; i < need.length; i += 4) batches.push(need.slice(i, i + 4))
    let next = 0
    const worker = async () => {
      while (next < batches.length) {
        const ids = batches[next++]
        try {
          const data = await gasGet({ action: 'get_thumbs', ids: ids.join(',') })
          if (data.success && data.thumbs) {
            const t = data.thumbs
            set({ products: state.products.map((p) => (t[String(p.id)] && !p.images?.length ? { ...p, images: [t[String(p.id)]] } : p)) })
          }
        } catch (e) { console.error('[store] thumbs failed:', e) }
      }
    }
    await Promise.all([worker(), worker(), worker()])
  } finally { thumbBusy = false }
}

export function refresh() {
  if (!isConfigured()) { set({ ready: true, source: 'local' }); return Promise.resolve(state) }
  if (inflight) return inflight
  inflight = gasGet({ action: 'bootstrap' })
    .then((data) => {
      if (!data.success) throw new Error(data.error || 'Failed to load store data')
      set({ products: mergeProducts(data.products || []), delivery: data.delivery || {}, ready: true, source: 'cloud', error: null })
      loadThumbs()
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
    if (data.success && data.product) upsertProduct({ ...data.product, sizes: data.product.sizes || [], colors: data.product.colors || [], inStock: data.product.inStock !== false }, { markPending: pending.has(String(id)) })
  } catch (e) { console.error('[store] loadFullProduct failed:', e) }
}

// Open the connection to Google early (saves a few hundred ms on first request)
if (typeof document !== 'undefined') {
  ;['https://script.google.com', 'https://script.googleusercontent.com'].forEach((href) => {
    const l = document.createElement('link'); l.rel = 'preconnect'; l.href = href; l.crossOrigin = ''; document.head.appendChild(l)
  })
}

// Boot: show cached data immediately, then refresh from the backend.
refresh() // start the network request immediately, in parallel with the cache read
idbGet('snapshot').then((snap) => {
  if (!snap) return
  pending = new Set([...(snap.pending || []), ...pending])
  // only use the cache if the network hasn't already answered
  if (state.source !== 'cloud') set({ products: snap.products || [], delivery: snap.delivery || {} }, false)
  loadThumbs()
})

if (typeof document !== 'undefined') {
  setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 20000)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh() })
  window.addEventListener('focus', refresh)
  window.addEventListener('online', refresh)
}
