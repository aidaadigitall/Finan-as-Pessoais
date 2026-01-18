
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) return import.meta.env[key];
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  return (window as any)?.[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

export const supabase: SupabaseClient = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : (null as any);

/**
 * Testa a conexão com o Supabase com um limite de tempo (timeout)
 */
export const testSupabaseConnection = async (timeoutMs = 5000): Promise<boolean> => {
  if (!isConfigured) return false;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1).abortSignal(controller.signal);
    clearTimeout(timeoutId);
    // Erros de Auth (401/403) contam como "conectado", apenas falhas de rede/DNS não.
    if (error && error.code === 'PGRST301') return true; 
    return !error;
  } catch (e) {
    return false;
  }
};

export const getURL = () => {
  const url = getEnv('VITE_SITE_URL') || (typeof window !== 'undefined' ? window.location.origin : '');
  return url.includes('http') ? url : `https://${url}`;
};
