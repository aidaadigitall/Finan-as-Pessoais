
import { createClient } from '@supabase/supabase-js';

/**
 * Tenta obter as credenciais de qualquer lugar possível (Vite, Process, Window ou Define)
 */
const getEnvVar = (key: string): string => {
  return (
    (import.meta.env?.[key]) || 
    (process.env?.[key]) || 
    ((window as any)?.[key]) || 
    ((window as any)?.process?.env?.[key]) ||
    ''
  );
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Log de depuração silencioso para ajudar no diagnóstico se necessário
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Aguardando configuração do Supabase...");
}

const supabaseInstance = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  : null;

export const supabase = supabaseInstance as any;

/**
 * Verifica se o Supabase está configurado corretamente com URLs válidas
 */
export const isSupabaseConfigured = () => {
    return !!supabaseInstance && supabaseUrl.includes('supabase.co');
};

export const getURL = () => {
  let url =
    getEnvVar('VITE_SITE_URL') || 
    getEnvVar('VITE_VERCEL_URL') || 
    'http://localhost:3000/';
  
  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};
