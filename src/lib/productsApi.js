import { isConfigured, gasPost, gasGet } from './backendConfig'

const LOCAL_KEY = 'products'

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Synchronous read of whatever's cached locally — use this for initial
 * component state so the page paints instantly with last-known data
 * instead of showing empty/loading while the network round-trip to Apps
 * Script (which is slow — often a few seconds) completes. Follow up with
 * fetchProducts() to refresh in the background.
 */
export function getCachedProducts() {
  return readLocal()
}

// Quota-safe: a browser's localStorage caps out around 5–10MB, and a few
// uncompressed phone photos can blow past that on their own. If the write
// fails we deliberately do NOT let that crash the calling function — a
// product that's already synced to the cloud shouldn't become unrecoverable
// just because the local cache is full.
function writeLocal(products) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(products))
    return true
  } catch (err) {
    console.error('[productsApi] Could not write to localStorage (likely full):', err)
    return false
  }
}

/**
 * Fetches the product catalog. Cloud is authoritative for any product ID
 * it knows about, but any product that only exists locally (e.g. a save
 * whose cloud sync failed, or hasn't been attempted yet) is kept in the
 * result instead of being silently dropped — a cloud response is never
 * allowed to erase data the app hasn't confirmed is safely stored
 * elsewhere. This mirrors how orders are merged, and is what was
 * previously missing: a failed/incomplete cloud sync was making saved
 * products disappear on the next refresh.
 */
export async function fetchProducts() {
  const local = readLocal()

  if (!isConfigured()) {
    return { products: local, source: 'local', reason: 'not_configured' }
  }

  try {
    const data = await gasGet({ action: 'list_products' })
    if (!data.success) throw new Error(data.error || 'Failed to fetch products')

    const remote = data.products || []
    const remoteIds = new Set(remote.map((p) => String(p.id)))
    const localOnly = local.filter((p) => !remoteIds.has(String(p.id)))
    const merged = [...remote, ...localOnly]

    writeLocal(merged)
    return { products: merged, source: 'cloud', unsyncedCount: localOnly.length }
  } catch (err) {
    console.error('[productsApi] fetchProducts failed:', err)
    return { products: local, source: 'local', reason: 'error', error: err }
  }
}

/**
 * Creates or updates a product, including its images. Images that are
 * already hosted (http/https URLs) are left alone; images picked "From
 * Device" arrive here as base64 data URIs, which the backend uploads to
 * Google Drive and swaps for a hosted URL (a Sheet cell can't hold a
 * multi-hundred-KB base64 string, so this is required, not optional).
 *
 * Always saves to localStorage first so the admin's edit is never lost
 * even if the network call fails or is slow — the canonical version
 * (with final Drive URLs) then overwrites that local copy once the
 * backend responds.
 */
export async function saveProduct(product) {
  const local = readLocal()
  const optimistic = { ...product, id: product.id || Date.now() }
  const existingIdx = local.findIndex((p) => p.id === optimistic.id)
  const localNext = existingIdx >= 0
    ? local.map((p) => (p.id === optimistic.id ? optimistic : p))
    : [...local, optimistic]
  writeLocal(localNext)

  if (!isConfigured()) {
    console.warn('[productsApi] Backend not configured — product was only saved locally. See README.md.')
    return { synced: false, reason: 'not_configured', product: optimistic }
  }

  try {
    const data = await gasPost({ action: 'save_product', product: optimistic })
    if (!data.success) throw new Error(data.error || 'Unknown error saving product')
    // The backend returns the canonical product (base64 images replaced
    // with their final Drive URLs) — cache that exact version so we're
    // never left holding a giant base64 string in localStorage.
    const saved = data.product
    const merged = readLocal()
    const idx = merged.findIndex((p) => p.id === saved.id)
    const mergedNext = idx >= 0 ? merged.map((p) => (p.id === saved.id ? saved : p)) : [...merged, saved]
    writeLocal(mergedNext)
    return { synced: true, product: saved }
  } catch (err) {
    console.error('[productsApi] saveProduct failed:', err)
    // Cloud sync failed — but the optimistic version is already sitting in
    // localStorage from the write above, so nothing is lost. It'll be kept
    // (not erased) on the next fetchProducts() thanks to the local-only merge.
    return { synced: false, reason: 'error', error: err, product: optimistic }
  }
}

export async function deleteProduct(id) {
  writeLocal(readLocal().filter((p) => p.id !== id))

  if (!isConfigured()) return { synced: false, reason: 'not_configured' }

  try {
    const data = await gasPost({ action: 'delete_product', id })
    if (!data.success) throw new Error(data.error || 'Unknown error deleting product')
    return { synced: true }
  } catch (err) {
    console.error('[productsApi] deleteProduct failed:', err)
    return { synced: false, reason: 'error', error: err }
  }
}
