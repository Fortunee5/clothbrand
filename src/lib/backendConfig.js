// ── Backend config (Supabase) ───────────────────────────────────────────
// Paste the two values from Supabase → Project Settings → API.
// Use the "anon" public key. NEVER paste the "service_role" key here.
import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://knkkefopxzootuxktcsb.supabase.co'      // e.g. https://abcdxyz.supabase.co
export const SUPABASE_ANON_KEY = 'sb_publishable_IECwBYcCbE8Q6RcYAw6GrA_TBO01Qi5'     // long string starting with eyJ...

export function isConfigured() {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co/i.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 40
}

export const supabase = isConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 5 } } })
  : null
