
import { createClient } from '@supabase/supabase-js';

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

// Só criamos o cliente se os dados básicos existirem e forem válidos
const supabaseInstance = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabase = supabaseInstance;

export const isSupabaseConfigured = () => {
    return !!supabaseInstance;
};

export const getURL = () => {
  let url = getEnvVar('VITE_SITE_URL') || 'http://localhost:3000/';
  url = url.includes('http') ? url : `https://${url}`;
  return url;
};
