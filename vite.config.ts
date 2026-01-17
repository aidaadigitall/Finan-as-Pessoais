
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use a string literal fallback for cwd if process.cwd is not recognized by the environment types
  const cwd = (process as any).cwd?.() || './';
  const env = loadEnv(mode, cwd, '');
  
  // Normaliza a API KEY de diferentes fontes possíveis
  const geminiKey = env.API_KEY || env.VITE_GEMINI_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Injeta em process.env para compatibilidade legada/Node-like
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.API_KEY': JSON.stringify(geminiKey),
      
      // Injeta em import.meta.env (Padrão Vite)
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.API_KEY': JSON.stringify(geminiKey),

      // Injeta como variáveis globais no window para garantir acesso em qualquer lugar
      'API_KEY': JSON.stringify(geminiKey),
      'VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || '')
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
