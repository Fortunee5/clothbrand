import { isConfigured, gasPost, ADMIN_KEY } from './backendConfig'
import { getState, setDelivery, refresh } from './store'

export const DELIVERY_TBC_MESSAGE = 'pls note our team would reach out to you about the delivery cost to your destination'

// Returns a number if the admin priced this LGA, otherwise null.
export function getDeliveryFee(delivery, state, lga) {
  const v = delivery?.[state]?.[lga]
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// Saves every price for one state. `fees` = { 'Ikeja': 3500, 'Epe': '' , ... }
// Blank/invalid entries are removed (customers then see the "team will reach out" note).
export async function saveStateFees(stateName, fees) {
  const clean = {}
  Object.entries(fees).forEach(([lga, v]) => {
    if (v === '' || v === null || v === undefined) return
    const n = Number(v)
    if (Number.isFinite(n) && n >= 0) clean[lga] = n
  })
  const prev = getState().delivery
  const next = { ...prev }
  if (Object.keys(clean).length) next[stateName] = clean; else delete next[stateName]
  setDelivery(next) // instant everywhere
  if (!isConfigured()) return { synced: false, reason: 'not_configured' }
  try {
    const data = await gasPost({ action: 'save_delivery', key: ADMIN_KEY, state: stateName, fees: clean })
    if (!data.success) throw new Error(data.error || 'Unknown error saving delivery fees')
    refresh()
    return { synced: true }
  } catch (err) {
    console.error('[deliveryApi] saveStateFees failed:', err)
    return { synced: false, reason: 'error', error: err }
  }
}
