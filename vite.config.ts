
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env ou do ambiente (Vercel/GitHub Actions)
  const currentDir = typeof process !== 'undefined' && typeof (process as any).cwd === 'function' 
    ? (process as any).cwd() 
    : '.';
    
  const env = loadEnv(mode, currentDir, '');
  
  return {
    plugins: [react()],
    define: {
      // Injeta as variáveis para que fiquem disponíveis em process.env e import.meta.env no bundle final
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY),
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
