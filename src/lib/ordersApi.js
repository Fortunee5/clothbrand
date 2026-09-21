import { isConfigured, gasPost, gasGet, ADMIN_KEY } from './backendConfig'

const LOCAL_KEY = 'orders'

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
  } catch {
    return []
  }
}

function writeLocal(orders) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(orders))
}

/**
 * Wipes orders cached in this browser's localStorage only. Does NOT touch
 * the Google Sheet — use apps-script/Code.gs's resetOrders() (run from the
 * Apps Script editor) or the ?action=reset_all URL for that. This exists
 * because the dashboard merges local + cloud orders, so leftover local
 * test orders can keep showing up even after the sheet has been cleared.
 */
export function clearLocalOrders() {
  localStorage.removeItem(LOCAL_KEY)
}

/**
 * Saves an order. Always writes to localStorage first (so the customer's
 * own success page and the admin dashboard — if opened on this same
 * device — work instantly, even offline). Then best-effort syncs to the
 * Google Sheet backend so the order is visible from any device.
 */
export async function saveOrder(order) {
  const existing = readLocal()
  writeLocal([...existing, order])

  if (!isConfigured()) {
    console.warn('[ordersApi] Backend not configured — order was only saved locally. See README.md.')
    return { synced: false, reason: 'not_configured' }
  }

  try {
    const data = await gasPost({ action: 'order', order })
    if (!data.success) throw new Error(data.error || 'Unknown error saving order')
    return { synced: true }
  } catch (err) {
    console.error('[ordersApi] saveOrder failed:', err)
    return { synced: false, reason: 'error', error: err }
  }
}

/**
 * Fetches all orders from the cloud sheet, merged with anything saved
 * locally that the sheet doesn't have yet (e.g. saved while offline).
 * Falls back to local-only data if the network/backend is unreachable —
 * the dashboard should never show a blank/broken screen for a network hiccup.
 */
export async function fetchOrders() {
  const local = readLocal()

  if (!isConfigured()) {
    return {
      orders: [...local].sort((a, b) => Number(b.id) - Number(a.id)),
      source: 'local',
      reason: 'not_configured',
    }
  }

  try {
    const data = await gasGet({ action: 'list_orders', key: ADMIN_KEY })
    if (!data.success) throw new Error(data.error || 'Failed to fetch orders')

    const remote = data.orders || []
    const remoteIds = new Set(remote.map((o) => String(o.id)))
    const localOnly = local.filter((o) => !remoteIds.has(String(o.id)))
    const merged = [...remote, ...localOnly].sort((a, b) => Number(b.id) - Number(a.id))

    return { orders: merged, source: 'cloud' }
  } catch (err) {
    console.error('[ordersApi] fetchOrders failed:', err)
    return {
      orders: [...local].sort((a, b) => Number(b.id) - Number(a.id)),
      source: 'local',
      reason: 'error',
      error: err,
    }
  }
}

export async function updateOrderStatus(id, status) {
  const local = readLocal().map((o) => (String(o.id) === String(id) ? { ...o, status } : o))
  writeLocal(local)

  if (!isConfigured()) return { synced: false, reason: 'not_configured' }

  try {
    const data = await gasPost({ action: 'update_status', id, status })
    if (!data.success) throw new Error(data.error || 'Unknown error updating status')
    return { synced: true }
  } catch (err) {
    console.error('[ordersApi] updateOrderStatus failed:', err)
    return { synced: false, reason: 'error', error: err }
  }
}
