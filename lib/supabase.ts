
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return (window as any)?.[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export const supabase = supabaseInstance as SupabaseClient;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error("Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  return supabaseInstance;
};

export const getURL = () => {
  let url = getEnv('VITE_SITE_URL') || (typeof window !== 'undefined' ? window.location.origin : '');
  return url.includes('http') ? url : `https://${url}`;
};
