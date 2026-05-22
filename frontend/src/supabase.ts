import { createClient } from '@supabase/supabase-js';

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const configuredSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!configuredSupabaseUrl || !configuredSupabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabaseUrl = configuredSupabaseUrl;
export const supabaseAnonKey = configuredSupabaseAnonKey;
export const supabaseAuthStorageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

const noOpAuthLock = async <Result>(
  _name: string,
  _acquireTimeout: number,
  callback: () => Promise<Result>,
) => callback();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    lock: noOpAuthLock,
  },
});
