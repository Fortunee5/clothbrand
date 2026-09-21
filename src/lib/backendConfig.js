// ── Backend config ──────────────────────────────────────────────────────
// Shared by both ordersApi.js and productsApi.js — one Apps Script
// deployment (apps-script/Code.gs) handles orders AND products.
// See README.md for the full setup walkthrough.
// Paste your deployment's /exec URL below. Until you do, the app still
// works — everything just stays local to the device it was entered on.
export const GAS_URL = 'https://script.google.com/macros/s/AKfycbwtq_Vow_eyylroyQK0Qv5lCVNO1VhRNmN_vvPjcnYoK_ZtrqwIk4isYWrT72-vW3AL/exec'
// Must match the ADMIN_KEY constant in apps-script/Code.gs exactly.
export const ADMIN_KEY = '7jXgvts1ztYujfGjKlRHa2p1X37iVEyR'

export function isConfigured() {
  return typeof GAS_URL === 'string' && /^https:\/\/script\.google(usercontent)?\.com\//.test(GAS_URL)
}

// Turns a fetch Response into either parsed JSON or a descriptive error.
// Apps Script returns HTML (not JSON) when the deployment's access level
// is wrong or the URL points at the editor instead of the /exec endpoint —
// res.json() would just throw "Unexpected token '<'" with no useful detail,
// so we read the raw text ourselves and report what actually came back.
export async function parseJsonResponse(res) {
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    const snippet = text.slice(0, 120).replace(/\s+/g, ' ').trim()
    throw new Error(
      `Backend returned ${res.status} ${res.statusText}, not JSON (got: "${snippet}${text.length > 120 ? '…' : ''}"). ` +
      `This usually means the Apps Script deployment's "Who has access" isn't set to "Anyone", or the URL is wrong.`
    )
  }
  if (!res.ok) {
    throw new Error(data?.error || `Backend returned ${res.status} ${res.statusText}`)
  }
  return data
}

// text/plain avoids a CORS preflight (OPTIONS) request, which Apps Script
// web apps cannot answer — this is what makes POSTs work reliably
// cross-origin from a static frontend.
export async function gasPost(body) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  return parseJsonResponse(res)
}

export async function gasGet(params) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${GAS_URL}?${query}`)
  return parseJsonResponse(res)
}
