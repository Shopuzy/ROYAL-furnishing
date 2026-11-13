import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabasePublicKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

if (supabasePublicKey.startsWith('sb_secret_')) {
  throw new Error('Security Error: Do not expose a Supabase secret key in frontend environment variables.');
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublicKey);
}

// Safe storage adapter that falls back to in-memory storage if a browser blocks localStorage/cookies
const memoryStorage = new Map<string, string>();
const safeAuthStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem(key: string, value: string): void {
    memoryStorage.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore SecurityError in strict privacy modes
    }
  },
  removeItem(key: string): void {
    memoryStorage.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore SecurityError
    }
  },
};

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY) are not configured.');
  }
  if (!client) {
    client = createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeAuthStorage,
      },
    });
  }
  return client;
}
