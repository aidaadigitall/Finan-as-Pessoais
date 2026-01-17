
import { createClient } from '@supabase/supabase-js';

// Função utilitária para buscar variáveis de ambiente com prioridade e fallback
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Fallback para variáveis globais (se injetadas via define)
  if (typeof window !== 'undefined' && (window as any)[key]) {
    return (window as any)[key];
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("ALERTA: Configurações do Supabase não encontradas. Verifique o arquivo .env ou Secrets.");
}

// Inicializa com placeholders válidos para evitar erro de constructor se as chaves estiverem vazias
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
