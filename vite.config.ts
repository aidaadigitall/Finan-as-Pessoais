
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify('https://aqimvhbgujedzyrpjogx.supabase.co'),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_WizSBR-16hZBFe-gxL8NiQ_0BgYyabT'),
    'process.env.API_KEY': JSON.stringify(''), // Adicione sua Gemini API Key aqui
    
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://aqimvhbgujedzyrpjogx.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_WizSBR-16hZBFe-gxL8NiQ_0BgYyabT'),
  },
  server: {
    port: 3000,
    host: true
  }
});
