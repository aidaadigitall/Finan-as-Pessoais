
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  // Tenta buscar de todas as formas possíveis de injeção do Vite/SaaS
  // Adiciona verificação de existência para import.meta e import.meta.env
  return (
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) || 
    (typeof process !== 'undefined' && process.env && process.env[key]) || 
    ((window as any)?.[key]) || 
    ''
  );
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Singleton para o cliente
let supabaseInstance: SupabaseClient | null = null;

// Verificação segura do modo de desenvolvimento
const isDev = typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).DEV;

if (isDev) {
  console.log("Supabase Init Check:", { 
    urlFound: !!supabaseUrl, 
    keyFound: !!supabaseAnonKey 
  });
}

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (e) {
    console.error("Erro ao inicializar Supabase:", e);
  }
}

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseInstance;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error("Supabase não configurado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  return supabaseInstance;
};

export const getURL = () => {
  let url = getEnvVar('VITE_SITE_URL') || (typeof window !== 'undefined' ? window.location.origin : '');
  url = url.includes('http') ? url : `https://${url}`;
  return url;
};
