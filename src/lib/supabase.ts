import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
    : undefined;

const supabaseAnonKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
        (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined))
    : undefined;

let cachedClient: SupabaseClient | null = null;

export function isSupabaseClientConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('https://') &&
      supabaseAnonKey.length > 10
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseClientConfigured()) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return cachedClient;
}
