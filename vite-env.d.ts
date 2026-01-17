
/**
 * Explicit type definitions for NodeJS and ImportMeta to satisfy 
 * the environment variable access patterns across the app.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly API_KEY: string;
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
