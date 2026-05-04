/* ─── SUPABASE CLIENT ─── */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if Supabase is configured
export const SUPABASE_ENABLED = !!(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'https://your-project-id.supabase.co'
);

// Create client (will be a no-op client if not configured)
export const supabase = SUPABASE_ENABLED
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
          },
          realtime: {
              params: { eventsPerSecond: 10 },
          },
      })
    : null;

if (!SUPABASE_ENABLED) {
    console.warn('[VIGOR] Supabase not configured — running in MOCK mode. Edit .env to connect.');
}

export default supabase;
