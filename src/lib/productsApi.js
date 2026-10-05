import { isConfigured, gasPost } from './backendConfig'
import { getState, refresh, upsertProduct, removeProduct } from './store'

// Synchronous read of the in-memory store (hydrated from IndexedDB on boot).
export function getCachedProducts() { return getState().products }

export async function fetchProducts() {
  const s = await refresh()
  return { products: s.products, source: s.source, reason: s.error ? 'error' : (isConfigured() ? undefined : 'not_configured'), error: s.error }
}

// Saves instantly into the shared store (every page updates at once), then
// syncs to the Google Sheet. Images are saved straight into the sheet.
export async function saveProduct(product) {
  const optimistic = { ...product, id: product.id || Date.now(), sizes: product.sizes || [], colors: product.colors || [], inStock: product.inStock !== false }
  upsertProduct(optimistic, { markPending: true })
  if (!isConfigured()) return { synced: false, reason: 'not_configured', product: optimistic }
  try {
    const data = await gasPost({ action: 'save_product', product: optimistic })
    if (!data.success) throw new Error(data.error || 'Unknown error saving product')
    const saved = { ...data.product, sizes: data.product.sizes || [], colors: data.product.colors || [], inStock: data.product.inStock !== false }
    upsertProduct(saved)
    return { synced: true, product: saved }
  } catch (err) {
    console.error('[productsApi] saveProduct failed:', err)
    return { synced: false, reason: 'error', error: err, product: optimistic }
  }
}

export async function deleteProduct(id) {
  removeProduct(id)
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
