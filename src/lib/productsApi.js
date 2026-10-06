import { isConfigured, supabase } from './backendConfig'
import { getState, refresh, upsertProduct, removeProduct, toProduct } from './store'

const BUCKET = 'product-images'

export function getCachedProducts() { return getState().products }

export async function fetchProducts() {
  const s = await refresh()
  return { products: s.products, source: s.source, reason: s.error ? 'error' : (isConfigured() ? undefined : 'not_configured'), error: s.error }
}

// Uploads any photo that is still a data: URI to Supabase Storage and returns public URLs.
async function uploadImages(id, images) {
  return Promise.all((images || []).map(async (img, i) => {
    if (!String(img).startsWith('data:')) return img
    const blob = await (await fetch(img)).blob()
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
    const path = `${id}/${Date.now()}-${i}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
    if (error) throw error
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }))
}

export async function saveProduct(product) {
  const optimistic = { ...product, id: product.id || Date.now(), sizes: product.sizes || [], colors: product.colors || [], inStock: product.inStock !== false }
  upsertProduct(optimistic, { markPending: true }) // shows instantly everywhere
  if (!isConfigured()) return { synced: false, reason: 'not_configured', product: optimistic }
  try {
    const images = await uploadImages(optimistic.id, optimistic.images)
    const { data, error } = await supabase.from('products').upsert({
      id: optimistic.id, name: optimistic.name, description: optimistic.description || '', price: Number(optimistic.price),
      category: optimistic.category, images, sizes: optimistic.sizes, colors: optimistic.colors,
      in_stock: optimistic.inStock, updated_at: new Date().toISOString(),
    }).select().single()
    if (error) throw error
    const saved = toProduct(data)
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
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    // tidy up this product's photos (best-effort)
    const { data: files } = await supabase.storage.from(BUCKET).list(String(id))
    if (files?.length) await supabase.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`))
    return { synced: true }
  } catch (err) {
    console.error('[productsApi] deleteProduct failed:', err)
    return { synced: false, reason: 'error', error: err }
  }
}
