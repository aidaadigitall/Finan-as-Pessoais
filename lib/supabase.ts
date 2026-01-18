
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Busca variáveis de ambiente de forma segura, verificando múltiplos contextos.
 * Previne o erro "Cannot read properties of undefined (reading 'DEV')"
 */
const getEnvVar = (key: string): string => {
  try {
    // 1. Tenta via import.meta.env (Vite nativo)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
    // 2. Tenta via process.env (Node/Webpack/Vercel)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // 3. Tenta via objeto global window (Injeção manual)
    if (typeof window !== 'undefined' && (window as any)[key]) {
      return (window as any)[key];
    }
  } catch (e) {
    console.warn(`Erro ao acessar variável ${key}:`, e);
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

let supabaseInstance: SupabaseClient | null = null;

// Verificação segura do modo DEV
const isDev = (() => {
  try {
    return !!(typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).DEV);
  } catch {
    return false;
  }
})();

if (isDev) {
  console.log("Supabase Init:", { 
    url: !!supabaseUrl, 
    key: !!supabaseAnonKey 
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
    console.error("Erro fatal ao criar cliente Supabase:", e);
  }
}

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseInstance;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error("Supabase não configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  return supabaseInstance;
};

export const getURL = () => {
  let url = getEnvVar('VITE_SITE_URL') || (typeof window !== 'undefined' ? window.location.origin : '');
  url = url.includes('http') ? url : `https://${url}`;
  return url;
};
