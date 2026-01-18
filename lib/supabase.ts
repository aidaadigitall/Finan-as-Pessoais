
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Função utilitária para buscar variáveis de ambiente em diferentes contextos.
 * Essencial para compatibilidade entre ambientes de desenvolvimento e produção (Vercel/SaaS).
 */
const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && (window as any)._env_?.[key]) return (window as any)._env_[key];
  
  return (
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) || 
    (typeof process !== 'undefined' && process.env && process.env[key]) || 
    ((window as any)?.[key]) || 
    ''
  );
};

// Chaves específicas do Supabase
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Singleton para o cliente para evitar múltiplas conexões
let supabaseInstance: SupabaseClient | null = null;

// Verifica modo de desenvolvimento com segurança
const isDev = typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).DEV;

if (isDev) {
  console.log("Supabase Connection Strategy:", { 
    urlFound: !!supabaseUrl, 
    keyFound: !!supabaseAnonKey,
    strategy: typeof import.meta !== 'undefined' ? 'import.meta' : 'process.env'
  });
}

// Inicializa apenas se as chaves forem válidas
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
    console.error("Falha crítica na inicialização do Supabase:", e);
  }
}

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseInstance;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error("Supabase não configurado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu painel de controle.");
  }
  return supabaseInstance;
};

export const getURL = () => {
  let url = getEnvVar('VITE_SITE_URL') || (typeof window !== 'undefined' ? window.location.origin : '');
  url = url.includes('http') ? url : `https://${url}`;
  return url;
};
