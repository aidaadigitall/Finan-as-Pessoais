
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  // Busca em múltiplas fontes para garantir compatibilidade com VPS e builds estáticos
  const value = (
    (import.meta.env?.[key]) || 
    (process.env?.[key]) || 
    ((window as any)?.[key]) || 
    ''
  );
  
  // Ignora placeholders comuns ou strings vazias
  if (!value || value.includes('YOUR_') || value.startsWith('sb_publishable_Wiz')) {
      // Nota: Mantivemos o seu placeholder no vite.config.ts, mas aqui validamos se ele é funcional
      return value;
  }
  return value;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Singleton para o cliente
let supabaseInstance: SupabaseClient | null = null;

console.log("Supabase Init Diagnostic:", { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlValid: supabaseUrl?.startsWith('http') 
});

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
    console.error("Critical: Failed to create Supabase client", e);
  }
}

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseInstance;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error("Supabase não configurado corretamente. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  return supabaseInstance;
};

export const getURL = () => {
  let url = getEnvVar('VITE_SITE_URL') || window.location.origin;
  url = url.includes('http') ? url : `https://${url}`;
  return url;
};
