import { isConfigured, supabase } from './backendConfig'

const LOCAL_KEY = 'orders'
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] } }
const writeLocal = (orders) => localStorage.setItem(LOCAL_KEY, JSON.stringify(orders))

// Wipes orders cached in THIS browser only (does not touch Supabase).
export function clearLocalOrders() { localStorage.removeItem(LOCAL_KEY) }

// Payment screenshots go to Storage (random file name) instead of bloating the database.
async function uploadProof(dataUri) {
  const blob = await (await fetch(dataUri)).blob()
  const path = `${crypto.randomUUID()}.${blob.type.includes('png') ? 'png' : 'jpg'}`
  const { error } = await supabase.storage.from('payment-proofs').upload(path, blob, { contentType: blob.type })
  if (error) throw error
  return supabase.storage.from('payment-proofs').getPublicUrl(path).data.publicUrl
}

// Saves locally first (customer's success page works instantly), then to Supabase.
export async function saveOrder(order) {
  writeLocal([...readLocal(), order])
  if (!isConfigured()) return { synced: false, reason: 'not_configured' }
  try {
    let data = order
    if (String(order.paymentProof || '').startsWith('data:')) {
      try { data = { ...order, paymentProof: await uploadProof(order.paymentProof) } } catch (e) { console.warn('[ordersApi] proof upload failed, keeping inline', e) }
    }
    const { error } = await supabase.from('orders').insert({ id: String(order.id), status: order.status || 'Pending', created_at: order.createdAt || new Date().toISOString(), data })
    if (error) throw error
    return { synced: true }
  } catch (err) {
    console.error('[ordersApi] saveOrder failed:', err)
    return { synced: false, reason: 'error', error: err }
  }
}

const byNewest = (a, b) => Number(b.id) - Number(a.id)

export async function fetchOrders() {
  const local = readLocal()
  if (!isConfigured()) return { orders: [...local].sort(byNewest), source: 'local', reason: 'not_configured' }
  try {
    const { data, error } = await supabase.from('orders').select('*').range(0, 4999)
    if (error) throw error
    const remote = data.map((r) => ({ ...r.data, id: r.id, status: r.status }))
    const ids = new Set(remote.map((o) => String(o.id)))
    const merged = [...remote, ...local.filter((o) => !ids.has(String(o.id)))].sort(byNewest)
    return { orders: merged, source: 'cloud' }
  } catch (err) {
    console.error('[ordersApi] fetchOrders failed:', err)
    return { orders: [...local].sort(byNewest), source: 'local', reason: 'error', error: err }
  }
}

export async function updateOrderStatus(id, status) {
  writeLocal(readLocal().map((o) => (String(o.id) === String(id) ? { ...o, status } : o)))
  if (!isConfigured()) return { synced: false, reason: 'not_configured' }
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', String(id))
    if (error) throw error
    return { synced: true }
  } catch (err) {
    console.error('[ordersApi] updateOrderStatus failed:', err)
    return { synced: false, reason: 'error', error: err }
  }
}

// Live: calls `cb` whenever any order is added or changed. Returns an unsubscribe function.
export function subscribeOrders(cb) {
  if (!supabase) return () => {}
  const ch = supabase.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => cb()).subscribe()
  return () => { supabase.removeChannel(ch) }
}
