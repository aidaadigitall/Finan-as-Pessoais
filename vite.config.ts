
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Supabase Configuration (Public)
    'process.env.VITE_SUPABASE_URL': JSON.stringify('https://aqimvhbgujedzyrpjogx.supabase.co'),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_WizSBR-16hZBFe-gxL8NiQ_0BgYyabT'),
    
    // API KEYS REMOVED: User must provide them in the Settings UI
    'process.env.API_KEY': JSON.stringify(''),
    
    // Fallbacks ensuring compatibility across the app
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://aqimvhbgujedzyrpjogx.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_WizSBR-16hZBFe-gxL8NiQ_0BgYyabT'),
  },
  server: {
    port: 3000,
    host: true
  }
});
