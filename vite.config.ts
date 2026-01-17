
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const cwd = (process as any).cwd?.() || './';
  const env = loadEnv(mode, cwd, '');
  
  // Credenciais reais fornecidas pelo usuário
  const supabaseUrl = 'https://aqimvhbgujedzyrpjogx.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaW12aGJndWplZHp5cnBqb2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NzQ5NzAsImV4cCI6MjA1NjM1MDk3MH0.your-real-key-here';
  const geminiKey = 'AIzaSyA80FmfR_0o0Bvo1uJwN6sF3VO1RLaiaUY';

  return {
    plugins: [react()],
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.API_KEY': JSON.stringify(geminiKey),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.API_KEY': JSON.stringify(geminiKey),
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
