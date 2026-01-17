
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const cwd = (process as any).cwd?.() || './';
  const env = loadEnv(mode, cwd, '');
  
  const supabaseUrl = 'https://aqimvhbgujedzyrpjogx.supabase.co';
  const supabaseAnonKey = 'sb_publishable_WizSBR-16hZBFe-gxL8NiQ_0BgYyabT';
  const geminiKey = 'AIzaSyA80FmfR_0o0Bvo1uJwN6sF3VO1RLaiaUY';

  return {
    plugins: [react()],
    define: {
      // Injeção para import.meta.env
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.API_KEY': JSON.stringify(geminiKey),
      
      // Injeção para process.env
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.API_KEY': JSON.stringify(geminiKey),

      // Injeção global direta para fallback máximo
      'VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'API_KEY': JSON.stringify(geminiKey)
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
