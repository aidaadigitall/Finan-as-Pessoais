
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  return (
    (import.meta.env?.[key]) || 
    (process.env?.[key]) || 
    ((window as any)?.[key]) || 
    ''
  );
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Singleton para o cliente
let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseInstance;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error("Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  return supabaseInstance;
};

export const getURL = () => {
  let url = getEnvVar('VITE_SITE_URL') || window.location.origin;
  url = url.includes('http') ? url : `https://${url}`;
  return url;
};
