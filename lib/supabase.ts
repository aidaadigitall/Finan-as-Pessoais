
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) return import.meta.env[key];
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  return (window as any)?.[key] || '';
};

// Credenciais forçadas via build ou env
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://aqimvhbgujedzyrpjogx.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_WizSBR-16hZBFe-gxL8NiQ_0BgYyabT';

export const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

// Inicialização segura: Nunca exportamos null para evitar "Cannot read properties of null (reading 'auth')"
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Health check real para garantir que o SaaS está online
 */
export const supabaseHealthCheck = async (): Promise<{online: boolean, error?: string}> => {
  try {
    const { error, status } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
    
    // Status 401/403/404 ou 200/204 indicam que o servidor respondeu
    if (status >= 200 && status < 500) {
      return { online: true };
    }
    
    return { online: false, error: error?.message || `Status HTTP: ${status}` };
  } catch (e: any) {
    return { online: false, error: e.message || "Timeout de rede ou erro de inicialização" };
  }
};
